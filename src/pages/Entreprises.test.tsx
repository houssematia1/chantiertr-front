import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { CLEF_SESSION } from '@/api/auth'
import type { ContexteDeSession, Role, Utilisateur } from '@/api/auth'
import { CLEF_ENTREPRISES } from '@/api/entreprises'
import type { Entreprise } from '@/api/entreprises'
import { Entreprises } from '@/pages/Entreprises'

/**
 * Ce que ces tests protegent.
 *
 * UNE REGLE DE CONFIDENTIALITE, avant tout. `CompanyResource` ne rend
 * `numero_adherent` et `nombre_de_comptes` qu'a la plateforme et a l'entreprise
 * elle-meme : le SIREN est public, la qualite de CLIENT de l'editeur et
 * l'EFFECTIF ne le sont pas. Les rendre a tout detenteur d'une fiche donnerait a
 * chaque adherent le moyen de trier ses concurrents entre clients et non-clients,
 * et de suivre leur taille.
 *
 * Consequence pour le front, et c'est la que le defaut serait subtil : pour un
 * lecteur ordinaire ces champs sont ABSENTS de la reponse — `undefined`, pas
 * `null`. Une etiquette « Adhérente » ou un compteur rendus quand meme
 * affirmeraient quelque chose que le front ne sait pas. Ce n'est pas une fuite,
 * c'est une affirmation fausse — et elle porte sur la meme information.
 *
 * Le cache est SEME plutot que le reseau simule : `useQuery` lit son cache avant
 * d'appeler, et une entree posee a la clef exacte rend le test synchrone.
 */

const BASE: Entreprise = {
  id: '1',
  name: 'Chantier Tranquille',
  legal: null,
  categorie: 'Entreprise de services',
  forme_juridique: null,
  capital: null,
  siren: null,
  siret: null,
  ape: null,
  rcs: null,
  rcs_ville: null,
  adresse: null,
  cp: null,
  ville: null,
  tva: null,
  iban: null,
  bic: null,
  assureur: null,
  couverture_rc: null,
  gerant: null,
  qualite: null,
  tel: null,
  logo_url: null,
  created_at: '2025-03-12T09:00:00+01:00',
  is_platform: true,
  annuaire_reference: false,
}

const ADHERENTE: Entreprise = {
  ...BASE,
  id: '2',
  name: 'Bâtir Ensemble',
  categorie: 'Entreprise de BTP',
  adresse: '14 rue des Compagnons',
  cp: '34000',
  ville: 'Montpellier',
  siret: '790 151 831 00092',
  tel: '04 67 12 34 56',
  is_platform: false,
  numero_adherent: 'A-001',
  default_emetteur: false,
  nombre_de_comptes: 4,
}

const REFERENCE: Entreprise = {
  ...BASE,
  id: '3',
  name: 'Loueur Lyonnais',
  categorie: 'Fournisseur',
  ville: 'Lyon',
  is_platform: false,
  annuaire_reference: true,
  numero_adherent: null,
  default_emetteur: false,
}

/**
 * La meme fiche telle qu'un lecteur ORDINAIRE la recoit : les trois champs
 * reserves sont ABSENTS de l'objet, pas mis a `null`. C'est toute la difference
 * entre « je ne sais pas » et « elle n'adhere pas ».
 *
 * `delete` sur une copie plutot qu'une destructuration : les variables mises de
 * cote par `{ a: _a, ...reste }` ne sont jamais lues, et la regle
 * `no-unused-vars` a raison de le refuser — un nom qui ne sert a rien se lit
 * comme un oubli.
 */
const VUE_ORDINAIRE: Entreprise = (() => {
  const copie: Entreprise = { ...ADHERENTE }

  delete copie.numero_adherent
  delete copie.default_emetteur
  delete copie.nombre_de_comptes

  return copie
})()

const UTILISATEUR: Utilisateur = {
  id: 'u1',
  prenom: 'Thomas',
  nom: 'Nguyen',
  email: 'membre@demo.test',
  tel: null,
  poste: null,
  role: 'membre',
  role_label: 'Membre',
  statut: 'actif',
  statut_label: 'Actif',
  company_id: '2',
  company_name: 'Bâtir Ensemble',
}

function rendre(role: Role, entreprises: readonly Entreprise[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const contexte: ContexteDeSession = {
    utilisateur: { ...UTILISATEUR, role },
    droits: [],
    emprunt: null,
  }

  client.setQueryData(CLEF_SESSION, contexte)
  client.setQueryData([...CLEF_ENTREPRISES, { categorie: null }], entreprises)

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/entreprises']}>
        <Entreprises />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/**
 * Les cartes de comptage.
 *
 * Interroger la page entiere ne marche pas : « Entreprises » est aussi le titre de
 * l'ecran, et « Adhérentes » se lirait a cote de l'etiquette « Adhérente » d'une
 * carte. Le groupe est nomme pour cela.
 */
function comptages(): HTMLElement {
  return screen.getByRole('group', { name: 'Comptages' })
}

/** Les raisons sociales rendues, dans l'ordre des cartes. */
function nomsRendus(): string[] {
  return screen
    .getAllByRole('link')
    .map((lien) => lien.textContent)
    .filter((texte) => texte !== '' && !texte.includes('Nouvelle entreprise'))
}

describe('Entreprises', () => {
  describe("ce que l'API dit, et rien de plus", () => {
    it("rend le numero d'adherent et l'effectif a la plateforme", () => {
      rendre('superadmin', [BASE, ADHERENTE, REFERENCE])

      // Le controle POSITIF, et il porte les assertions negatives qui suivent :
      // sans lui, un ecran qui ne rendrait RIEN les passerait toutes.
      expect(screen.getByText('A-001')).toBeVisible()
      expect(screen.getByText("Numéro d'adhérent")).toBeVisible()
      expect(screen.getByText(/comptes/)).toBeVisible()
    })

    it("rend l'adhesion des que l'API la donne, quel que soit le role affiche", () => {
      // CE TEST A CORRIGE UNE ERREUR DE CONCEPTION. Sa premiere version servait la
      // fiche complete a un membre et exigeait que la carte la taise — donc que le
      // front rejoue le filtre de confidentialite de l'API.
      //
      // C'etait faux. `CompanyResource` decide SEULE a qui elle rend
      // `numero_adherent` : la plateforme, et l'entreprise elle-meme. Un membre
      // recoit bien le champ sur SA propre fiche, et doit le voir. Dupliquer la
      // regle cote front donnerait deux verites, et la seconde se tromperait.
      //
      // La carte lit donc ce qu'elle a recu, et le test le fixe ainsi.
      rendre('membre', [ADHERENTE])

      expect(screen.getByText('A-001')).toBeVisible()
    })

    it('ne les rend pas davantage quand ils sont absents de la reponse', () => {
      rendre('membre', [VUE_ORDINAIRE])

      // Le cas REEL : c'est ainsi que l'API repond a un membre. La carte parait,
      // sans rien affirmer sur l'adhesion.
      expect(screen.getByText('Bâtir Ensemble')).toBeVisible()
      expect(screen.queryByText('A-001')).not.toBeInTheDocument()
      expect(screen.queryByText('Adhérente')).not.toBeInTheDocument()
    })

    it("compte les adherentes des que l'API renseigne l'adhesion", () => {
      rendre('superadmin', [BASE, ADHERENTE, REFERENCE])
      expect(within(comptages()).getByText('Adhérentes')).toBeVisible()
    })

    it("se tait quand l'API ne dit rien de l'adhesion", () => {
      // `numero_adherent` est absent de toutes les fiches servies : compter des
      // `undefined` donnerait zero, ce qui serait FAUX et non « inconnu ».
      rendre('membre', [VUE_ORDINAIRE])

      expect(within(comptages()).queryByText('Adhérentes')).not.toBeInTheDocument()
      expect(within(comptages()).getByText('Entreprises')).toBeVisible()
    })
  })

  describe('les etiquettes de qualification', () => {
    it("marque l'editeur, l'annuaire de reference et l'adherente", () => {
      rendre('superadmin', [BASE, ADHERENTE, REFERENCE])

      expect(screen.getByText('Éditeur')).toBeVisible()
      expect(screen.getByText('Annuaire de référence')).toBeVisible()

      // L'etiquette de la carte, pas le libelle du compteur — celui-ci est au
      // pluriel invariable precisement pour qu'on ne les confonde pas.
      expect(screen.getByText('Adhérente')).toBeVisible()
    })

    it('ne marque pas une fiche ordinaire', () => {
      rendre('membre', [VUE_ORDINAIRE])

      expect(screen.queryByText('Éditeur')).not.toBeInTheDocument()
      expect(screen.queryByText('Annuaire de référence')).not.toBeInTheDocument()
    })
  })

  describe('la carte', () => {
    it("joint l'adresse, le code postal et la ville en une ligne", () => {
      rendre('membre', [VUE_ORDINAIRE])

      // La forme d'une adresse postale francaise : des espaces, pas des virgules.
      expect(screen.getByText('14 rue des Compagnons 34000 Montpellier')).toBeVisible()
    })

    it('tait les couples dont la valeur manque', () => {
      rendre('membre', [REFERENCE])

      // Une carte affiche ce qu'elle SAIT. Six lignes de tirets dans une liste
      // d'annuaire n'apprennent rien et occupent la place du renseigne.
      expect(screen.queryByText(/SIRET/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Téléphone/)).not.toBeInTheDocument()
      expect(screen.getByText('Loueur Lyonnais')).toBeVisible()
    })

    it("nomme l'entreprise dans le texte alternatif du logo", () => {
      rendre('membre', [{ ...VUE_ORDINAIRE, logo_url: 'https://exemple.test/logo.png' }])

      // Le logo REPRESENTE l'entreprise : son texte alternatif est le nom, pas
      // « logo ». Un lecteur d'ecran qui annonce « logo » n'a rien annonce.
      expect(screen.getByRole('img', { name: 'Bâtir Ensemble' })).toBeVisible()
    })
  })

  describe('le perimetre annonce', () => {
    it("dit a la plateforme qu'elle voit tout", () => {
      rendre('superadmin', [BASE])
      expect(screen.getByText(/Toutes les entreprises de la plateforme/)).toBeVisible()
    })

    it('dit aux autres ce que couvre leur carnet', () => {
      rendre('membre', [VUE_ORDINAIRE])
      expect(screen.getByText(/votre carnet/i)).toBeVisible()
    })
  })

  describe('le message de vide', () => {
    it("nomme le carnet quand il n'y a rien du tout", () => {
      rendre('membre', [])
      expect(screen.getByText(/Votre carnet est vide/)).toBeVisible()
    })

    it("nomme la recherche quand c'est elle qui exclut tout", async () => {
      const utilisateur = userEvent.setup()
      rendre('membre', [VUE_ORDINAIRE])

      await utilisateur.type(screen.getByLabelText('Rechercher'), 'introuvable')

      // LA distinction qui compte : confondre « rien dans le carnet » et « rien
      // qui corresponde » fait chercher une donnee qui existe.
      expect(screen.getByText(/ne correspond à « introuvable »/)).toBeVisible()
      expect(screen.queryByText(/Votre carnet est vide/)).not.toBeInTheDocument()
    })
  })

  describe('la recherche', () => {
    it('trouve sans les accents', async () => {
      const utilisateur = userEvent.setup()
      rendre('membre', [VUE_ORDINAIRE, REFERENCE])

      await utilisateur.type(screen.getByLabelText('Rechercher'), 'batir')

      expect(nomsRendus()).toContain('Bâtir Ensemble')
      expect(nomsRendus()).not.toContain('Loueur Lyonnais')
    })

    it("trouve par SIRET colle alors qu'il est stocke avec des espaces", async () => {
      const utilisateur = userEvent.setup()
      rendre('membre', [VUE_ORDINAIRE, REFERENCE])

      await utilisateur.type(screen.getByLabelText('Rechercher'), '79015183100092')

      expect(nomsRendus()).toContain('Bâtir Ensemble')
      expect(nomsRendus()).not.toContain('Loueur Lyonnais')
    })
  })

  describe('le filtre de categorie', () => {
    it('propose les six categories du referentiel meme sans fiche qui les porte', () => {
      rendre('membre', [VUE_ORDINAIRE])

      const selecteur = screen.getByLabelText('Catégorie')

      // La liste n'est pas construite a partir des donnees seules : un filtre qui
      // apparait au fil des saisies deplacerait ses propres options. Et l'API
      // n'impose pas de liste fermee — les categories inconnues s'y ajoutent.
      //
      // L'APOSTROPHE EST DROITE : `normaliserCategorie` ramene les apostrophes
      // typographiques a `'`, donc c'est cette forme que la base contient.
      for (const categorie of ["Maître d'ouvrage", 'AMO', 'Fournisseur']) {
        expect(within(selecteur).getByRole('option', { name: categorie })).toBeInTheDocument()
      }
    })
  })

  describe('la pagination', () => {
    it('ne parait pas sous onze fiches', () => {
      rendre('membre', [VUE_ORDINAIRE, REFERENCE])

      // Une pagination a un seul bouton est un ornement qui occupe une ligne et
      // n'informe de rien.
      expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
    })

    it('decoupe a dix par page', () => {
      rendre('membre', douzeFiches())

      expect(nomsRendus()).toHaveLength(10)
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    })

    it('borne la page courante quand un filtre reduit la liste', async () => {
      const utilisateur = userEvent.setup()
      rendre('membre', douzeFiches())

      await utilisateur.click(screen.getByRole('button', { name: 'Page 2' }))
      expect(nomsRendus()).toHaveLength(2)

      // LE PIEGE : filtrer depuis la page 2 laisserait un ecran vide alors qu'il y
      // a des resultats. La page est bornee, pas memorisee telle quelle.
      await utilisateur.type(screen.getByLabelText('Rechercher'), 'Fiche 1')

      expect(nomsRendus().length).toBeGreaterThan(0)
      expect(screen.queryByText(/ne correspond à/)).not.toBeInTheDocument()
    })
  })
})

/** Douze fiches, de quoi deborder d'une page. */
function douzeFiches(): Entreprise[] {
  return Array.from({ length: 12 }, (_, index) => ({
    ...VUE_ORDINAIRE,
    id: `f${String(index)}`,
    name: `Fiche ${String(index)}`,
  }))
}
