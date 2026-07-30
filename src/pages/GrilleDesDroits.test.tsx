import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { CLEF_DROITS } from '@/api/comptes'
import type { LigneDeGrille } from '@/api/comptes'
import { GrilleDesDroits } from '@/pages/GrilleDesDroits'

/**
 * Ce que ces tests protegent.
 *
 * QUATRE DROITS SUR SIX N'APPLIQUENT ENCORE RIEN, et c'est le point delicat de cet
 * ecran : un droit affiche qu'aucun code n'applique est un MENSONGE —
 * l'administrateur croit avoir restreint quelque chose et il ne s'est rien passe.
 *
 * Deux erreurs symetriques sont possibles, et les deux sont graves :
 *
 *   masquer les lignes inactives   laisse croire que la grille compte deux lignes
 *   les rendre reglables           laisse croire qu'on a restreint quelque chose
 *
 * L'ecran les affiche donc, DESACTIVEES, avec le lot qui les branchera. L'API le
 * declare — `actif` et `lot_attendu` — parce qu'une declaration se verifie : un
 * test d'architecture cote serveur la confronte aux sources.
 */

const PROFILS = [
  { profil: 'plateforme', libelle: 'Compte de la plateforme' },
  { profil: 'admin', libelle: "Administrateur d'une entreprise cliente" },
  { profil: 'superviseur', libelle: "Superviseur d'une entreprise cliente" },
]

function ligne(
  droit: LigneDeGrille['droit'],
  libelle: string,
  actif: boolean,
  lot: string | null,
  accordes: readonly boolean[],
): LigneDeGrille {
  return {
    droit,
    libelle,
    actif,
    lot_attendu: lot,
    profils: PROFILS.map((profil, index) => ({
      ...profil,
      accorde: accordes[index] ?? false,
      defaut: accordes[index] ?? false,
    })),
  }
}

const GRILLE: LigneDeGrille[] = [
  ligne('supprimer_projet', 'Supprimer un projet ou un devis', false, 'M1', [true, true, false]),
  ligne('inviter_un_compte', 'Inviter et modifier les comptes', true, null, [true, true, true]),
  ligne('archiver_un_compte', 'Archiver et réactiver un compte', true, null, [true, true, false]),
]

function rendre(grille: LigneDeGrille[] = GRILLE) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  client.setQueryData(CLEF_DROITS, grille)

  return render(
    <QueryClientProvider client={client}>
      <GrilleDesDroits />
    </QueryClientProvider>,
  )
}

describe('GrilleDesDroits', () => {
  it('dit en tete que la grille retire et n ajoute jamais', () => {
    rendre()

    // La regle de composition du socle : `policy && grille`. Aucune ligne de la
    // table ne peut rendre possible ce qu'une policy refuse. L'ecran doit le dire,
    // sinon un administrateur croit pouvoir ACCORDER par une case.
    expect(screen.getByText(/retire des facultés, elle n'en ajoute jamais/)).toBeVisible()
  })

  it('affiche toutes les facultes, actives ou non', () => {
    rendre()

    // Le controle POSITIF : les masquer laisserait croire que la grille compte deux
    // lignes au lieu de six.
    expect(screen.getByText('Supprimer un projet ou un devis')).toBeVisible()
    expect(screen.getByText('Inviter et modifier les comptes')).toBeVisible()
  })

  it("desactive les cases d'une faculte que rien n'applique", () => {
    rendre()

    // LA PROPRIETE QUI COMPTE. Une case reglable sur un droit inapplique laisse
    // croire qu'on a restreint quelque chose, alors qu'aucune policy ne le verifie.
    const inactive = screen.getByLabelText(
      'Supprimer un projet ou un devis — Compte de la plateforme',
    )
    expect(inactive).toBeDisabled()

    // Et le controle inverse, sans lequel un ecran qui desactiverait TOUT passerait.
    const active = screen.getByLabelText(
      'Inviter et modifier les comptes — Compte de la plateforme',
    )
    expect(active).toBeEnabled()
  })

  it('nomme le lot qui branchera la faculte', () => {
    rendre()

    // « grisé » ne dit pas quand. Le lot le dit, et la couleur ne porte donc pas
    // seule l'information — MASTER § 7.
    expect(screen.getByText(/elle arrive au lot M1/)).toBeVisible()
  })

  it('donne a chaque case un libelle qui la distingue des dix-sept autres', () => {
    rendre()

    // Dix-huit cases nues : un lecteur d'ecran ne saurait pas laquelle il coche. Le
    // libelle concatene la faculte ET le profil.
    expect(
      screen.getByLabelText(
        "Archiver et réactiver un compte — Superviseur d'une entreprise cliente",
      ),
    ).not.toBeChecked()
    expect(
      screen.getByLabelText(
        "Archiver et réactiver un compte — Administrateur d'une entreprise cliente",
      ),
    ).toBeChecked()
  })

  it("n'offre aucune colonne pour le super-administrateur", () => {
    rendre()

    // La grille ne le decrit pas : lui donner une colonne reviendrait a offrir une
    // case a decocher sur le cloisonnement lui-meme.
    expect(screen.queryByText(/Super-administrateur/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(4)
  })

  it('bascule la case immediatement, sans attendre le serveur', async () => {
    const utilisateur = userEvent.setup()
    rendre()

    const nom = "Archiver et réactiver un compte — Superviseur d'une entreprise cliente"
    const cocher = screen.getByLabelText(nom)

    expect(cocher).not.toBeChecked()

    await utilisateur.click(cocher)

    // LA MISE A JOUR OPTIMISTE. Sans elle, la case est controlee sur la valeur du
    // cache : le clic ne change rien a l'ecran, la case revient a son etat
    // d'origine, et l'utilisateur reclique. La verification au navigateur a montre
    // ce comportement avant la correction.
    //
    // La requete echoue ici — aucun serveur —, et c'est justement ce qui rend le
    // test interessant : l'ecriture optimiste doit avoir eu lieu AVANT.
    expect(screen.getByLabelText(nom)).toBeChecked()
  })
})
