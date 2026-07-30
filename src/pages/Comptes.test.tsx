import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { CLEF_SESSION } from '@/api/auth'
import type { ContexteDeSession, Role, Utilisateur } from '@/api/auth'
import { CLEF_COMPTES } from '@/api/comptes'
import { Comptes } from '@/pages/Comptes'

/**
 * Ce que ces tests protegent.
 *
 * LES ACTIONS OFFERTES SONT CELLES QUE L'API PEUT ACCEPTER, et rien de plus. Le
 * front MASQUE ce qu'il sait impossible ; il ne rejoue pas les policies. Trois
 * filtres sont deductibles de `GET /me` et de la ligne, et les trois comptent :
 *
 *   emprunt       jamais sur soi, jamais sur un compte de plateforme, et
 *                 super-administrateur plateforme seulement
 *   archivage     jamais sur soi — l'API rend 403, et le proposer serait un piege
 *   invitation    seulement sur un compte `invite` — l'API rend 409 sinon
 *
 * Proposer une action que le serveur refusera n'est pas une faute de securite,
 * c'est un piege : l'utilisateur clique, essuie un refus, et n'apprend rien.
 */

const BASE: Utilisateur = {
  id: 'u1',
  prenom: 'Marie',
  nom: 'Berthier',
  email: 'superadmin@demo.test',
  tel: null,
  poste: null,
  role: 'superadmin',
  role_label: 'Super-administrateur',
  statut: 'actif',
  statut_label: 'Actif',
  company_id: 'e0',
  company_name: 'Chantier Tranquille',
}

const MOI = BASE

const MEMBRE: Utilisateur = {
  ...BASE,
  id: 'u2',
  prenom: 'Thomas',
  nom: 'Nguyen',
  email: 'membre@demo.test',
  tel: '07 41 02 88 15',
  role: 'membre',
  role_label: 'Membre',
  company_id: 'e1',
  company_name: 'Bâtir Ensemble',
}

const INVITE: Utilisateur = {
  ...MEMBRE,
  id: 'u3',
  prenom: 'Léa',
  nom: 'Marchand',
  email: 'agent@demo.test',
  role: 'agent',
  role_label: 'Agent',
  statut: 'invite',
  statut_label: 'Invité',
}

const ARCHIVE: Utilisateur = {
  ...MEMBRE,
  id: 'u4',
  prenom: 'Hugo',
  nom: 'Petit',
  email: 'h.petit@batir.test',
  statut: 'archive',
  statut_label: 'Archivé',
}

const AUTRE_PLATEFORME: Utilisateur = {
  ...BASE,
  id: 'u5',
  prenom: 'Houssy',
  nom: 'Atia',
  email: 'dev@chantiertranquille.fr',
  role: 'super_admin_membre',
  role_label: 'Super-administrateur membre',
}

function rendre(comptes: readonly Utilisateur[], role: Role = 'superadmin') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const contexte: ContexteDeSession = {
    utilisateur: { ...MOI, role },
    droits: [],
    emprunt: null,
  }

  client.setQueryData(CLEF_SESSION, contexte)
  client.setQueryData(CLEF_COMPTES, comptes)

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/comptes']}>
        <Comptes />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Ouvre le menu d'un compte et rend ses entrees. */
async function entreesDuMenu(
  utilisateur: ReturnType<typeof userEvent.setup>,
  nom: string,
): Promise<(string | null)[]> {
  await utilisateur.click(screen.getByRole('button', { name: `Réglages — ${nom}` }))

  const menu = screen.getByRole('menu')

  return within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent)
}

describe('Comptes', () => {
  it('rend le statut de chaque compte', () => {
    rendre([MOI, INVITE, ARCHIVE])

    // Notre colonne en plus de leur ecran : leur tableau met une couronne devant le
    // prenom d'un super-administrateur, le statut dit davantage.
    expect(screen.getByText('Actif')).toBeVisible()
    expect(screen.getByText('Invité')).toBeVisible()
    expect(screen.getByText('Archivé')).toBeVisible()
  })

  it('nomme le menu de chaque ligne', async () => {
    const utilisateur = userEvent.setup()
    rendre([MOI, MEMBRE])

    // Sept boutons « Réglages » identiques : sans le nom du compte, un lecteur
    // d'ecran ne sait pas lequel il ouvre.
    await utilisateur.click(screen.getByRole('button', { name: 'Réglages — Thomas Nguyen' }))

    expect(screen.getByRole('menu')).toHaveAccessibleName('Réglages — Thomas Nguyen')
  })

  describe("l'emprunt de compte", () => {
    it('est offert sur un compte ordinaire, par un super-administrateur plateforme', async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, MEMBRE])

      // Le controle POSITIF : il porte les trois assertions negatives qui suivent.
      expect(await entreesDuMenu(utilisateur, 'Thomas Nguyen')).toEqual(
        expect.arrayContaining([expect.stringContaining('Se connecter en tant que')]),
      )
    })

    it("n'est jamais offert sur son propre compte", async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, MEMBRE])

      expect(await entreesDuMenu(utilisateur, 'Marie Berthier')).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Se connecter en tant que')]),
      )
    })

    it("n'est jamais offert sur un compte de plateforme", async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, AUTRE_PLATEFORME])

      // `ImpersonationController` refuse d'emprunter un compte de plateforme, y
      // compris `super_admin_membre` — qui est plateforme tout en restant cloisonne.
      expect(await entreesDuMenu(utilisateur, 'Houssy Atia')).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Se connecter en tant que')]),
      )
    })

    it("n'est pas offert a un compte qui n'est pas plateforme", async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, MEMBRE], 'admin')

      expect(await entreesDuMenu(utilisateur, 'Thomas Nguyen')).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Se connecter en tant que')]),
      )
    })
  })

  describe("l'archivage", () => {
    it('est offert sur un compte actif qui n est pas le sien', async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, MEMBRE])

      expect(await entreesDuMenu(utilisateur, 'Thomas Nguyen')).toEqual(
        expect.arrayContaining([expect.stringContaining('Archiver')]),
      )
    })

    it("n'est jamais offert sur son propre compte", async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, MEMBRE])

      // L'API rend 403, et se retirer son propre acces depuis cet ecran serait
      // irreversible pour l'utilisateur qui vient de le faire.
      expect(await entreesDuMenu(utilisateur, 'Marie Berthier')).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Archiver')]),
      )
    })

    it("n'est pas offert sur un compte deja archive", async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, ARCHIVE])

      const entrees = await entreesDuMenu(utilisateur, 'Hugo Petit')

      expect(entrees).not.toEqual(expect.arrayContaining([expect.stringContaining('Archiver')]))
      // C'est « Réactiver » qui prend sa place.
      expect(entrees).toEqual(expect.arrayContaining([expect.stringContaining('Réactiver')]))
    })
  })

  describe("l'invitation", () => {
    it('se renvoie et s annule sur un compte invite', async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, INVITE])

      const entrees = await entreesDuMenu(utilisateur, 'Léa Marchand')

      expect(entrees).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Renvoyer l'invitation"),
          expect.stringContaining("Annuler l'invitation"),
        ]),
      )
    })

    it('ne se propose pas sur un compte deja en service', async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, MEMBRE])

      // L'API rend 409 — « ce compte est déjà en service ». Le proposer ne servirait
      // qu'a le decouvrir.
      expect(await entreesDuMenu(utilisateur, 'Thomas Nguyen')).not.toEqual(
        expect.arrayContaining([expect.stringContaining("Renvoyer l'invitation")]),
      )
    })

    it("dit que l'annulation detruit le compte", async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, INVITE])

      await utilisateur.click(screen.getByRole('button', { name: 'Réglages — Léa Marchand' }))

      // C'est le SEUL endroit du produit ou un compte est detruit. Le libelle doit le
      // dire : « annuler » sans « le compte est détruit » laisserait croire a une
      // simple desactivation.
      expect(screen.getByRole('menu')).toHaveTextContent('Le compte est détruit')
    })
  })

  describe('le menu', () => {
    it('se ferme par Echap', async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, MEMBRE])

      const declencheur = screen.getByRole('button', { name: 'Réglages — Thomas Nguyen' })

      await utilisateur.click(declencheur)
      expect(screen.getByRole('menu')).toBeInTheDocument()

      // ON DEPLACE LE FOCUS DANS LE MENU AVANT D'ECHAPPER, et c'est indispensable :
      // la contre-epreuve par mutation a montre l'assertion VACUEUSE sans cela.
      // Cliquer le declencheur lui donne deja le focus, donc « le focus revient au
      // declencheur » passait meme en retirant le code qui le ramene.
      await utilisateur.tab()
      expect(declencheur).not.toHaveFocus()

      await utilisateur.keyboard('{Escape}')

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      // Sans ce retour, le focus reste sur un element qui vient de disparaitre et la
      // tabulation repart du debut du document.
      expect(declencheur).toHaveFocus()
    })

    it('annonce son etat au declencheur', async () => {
      const utilisateur = userEvent.setup()
      rendre([MOI, MEMBRE])

      const declencheur = screen.getByRole('button', { name: 'Réglages — Thomas Nguyen' })

      expect(declencheur).toHaveAttribute('aria-expanded', 'false')
      expect(declencheur).toHaveAttribute('aria-haspopup', 'menu')

      await utilisateur.click(declencheur)

      expect(declencheur).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('trouve un compte par son role', async () => {
    const utilisateur = userEvent.setup()
    rendre([MOI, MEMBRE])

    await utilisateur.type(screen.getByLabelText('Rechercher'), 'membre')

    expect(screen.getByText('Thomas Nguyen')).toBeVisible()
    expect(screen.queryByText('Marie Berthier')).not.toBeInTheDocument()
  })
})
