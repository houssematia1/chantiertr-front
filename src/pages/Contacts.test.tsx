import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { CLEF_CONTACTS } from '@/api/contacts'
import type { Contact } from '@/api/contacts'
import { CLEF_ENTREPRISES } from '@/api/entreprises'
import { Contacts } from '@/pages/Contacts'

/**
 * Ce que ces tests protegent.
 *
 * LE MODELE A DEUX AXES, et l'ecran doit les distinguer sans les expliquer :
 * `company_id` dit qui EMPLOIE la personne, le carnet dit qui la DETIENT. Les
 * confondre est la faute que le socle a corrigee cote API — un acces direct aux
 * contacts d'un autre tenant, avec 400 tests verts.
 *
 * Cote front la consequence est plus modeste mais reelle : le filtre par
 * entreprise RESTREINT le carnet, il ne va jamais chercher les contacts d'une
 * entreprise qu'on ne detient pas. Un message de vide qui laisserait croire le
 * contraire enverrait chercher une donnee qu'on n'a pas le droit de voir.
 */

const KARIM: Contact = {
  id: 'c1',
  company_id: 'e1',
  company_name: 'Bâtir Ensemble',
  prenom: 'Karim',
  nom: 'Lefebvre',
  nom_complet: 'Karim Lefebvre',
  email: 'k.lefebvre@batir.test',
  portable: '06 12 45 78 90',
  poste: 'Conducteur de travaux',
  access_role: 'Administrateur',
}

const AWA: Contact = {
  id: 'c2',
  company_id: 'e2',
  company_name: 'Toitures du Sud',
  prenom: 'Awa',
  nom: 'Diallo',
  nom_complet: 'Awa Diallo',
  email: null,
  portable: '06 90 12 33 07',
  poste: null,
  access_role: null,
}

/**
 * Monte l'ecran avec un cache seme.
 *
 * `parEmployeur` seme les requetes FILTREES. Sans lui, choisir une entreprise
 * declenche une requete a une clef inconnue du cache, l'ecran passe en chargement
 * et affiche « … » — pas le message de vide qu'on voulait verifier. Le premier jet
 * de ce fichier s'y est fait prendre.
 */
function rendre(
  contacts: readonly Contact[],
  parEmployeur: Record<string, readonly Contact[]> = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  client.setQueryData([...CLEF_CONTACTS, { company_id: null }], contacts)
  client.setQueryData([...CLEF_ENTREPRISES, { categorie: null }], [])

  for (const [id, liste] of Object.entries(parEmployeur)) {
    client.setQueryData([...CLEF_CONTACTS, { company_id: id }], liste)
  }

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/contacts']}>
        <Contacts />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Le tableau du carnet. */
function carnet(): HTMLElement {
  return screen.getByRole('table', { name: 'Carnet de contacts' })
}

describe('Contacts', () => {
  it('porte une semantique de tableau malgre une mise en page en flex', () => {
    rendre([KARIM])

    // Une grille en `flex` n'a AUCUNE semantique de tableau : sans les roles poses
    // a la main, un lecteur d'ecran annonce une suite de `div` et l'utilisateur
    // perd le rapport entre une valeur et son en-tete.
    expect(carnet()).toBeInTheDocument()
    expect(within(carnet()).getAllByRole('columnheader')).toHaveLength(6)
    expect(within(carnet()).getByRole('columnheader', { name: 'Entreprise' })).toBeVisible()
  })

  it("mene de l'employeur a sa fiche entreprise", () => {
    rendre([KARIM])

    // Le SEUL lien entre les deux annuaires. Il sert a chaque fois qu'on cherche
    // « qui est cette societe pour laquelle il travaille ».
    expect(screen.getByRole('link', { name: 'Bâtir Ensemble' })).toHaveAttribute(
      'href',
      '/entreprises/e1',
    )
  })

  it('mene du nom a la fiche du contact', () => {
    rendre([KARIM])

    // La LIGNE n'est pas un lien : un `role="row"` ne peut pas etre une ancre, et
    // la rendre cliquable par `onClick` la retirerait du parcours au clavier.
    expect(screen.getByRole('link', { name: 'Karim Lefebvre' })).toHaveAttribute(
      'href',
      '/contacts/c1',
    )
  })

  it("offre d'ecrire au contact", () => {
    rendre([KARIM])

    // Un carnet d'adresses sert a ecrire. Sans `mailto:`, il faut selectionner une
    // adresse coupee en points de suspension.
    expect(screen.getByRole('link', { name: 'k.lefebvre@batir.test' })).toHaveAttribute(
      'href',
      'mailto:k.lefebvre@batir.test',
    )
  })

  it("n'affiche le role d'acces que lorsqu'il y en a un", () => {
    const { container } = rendre([KARIM, AWA])

    // Le controle POSITIF d'abord, sinon l'assertion negative passerait sur un
    // ecran qui ne rendrait rien.
    expect(screen.getByText('Administrateur')).toBeVisible()

    // ON COMPTE LES PUCES, ON NE CHERCHE PAS UN TEXTE ABSENT. La premiere version
    // de ce test verifiait que « Agent » n'etait pas dans le document, et la
    // contre-epreuve par mutation l'a montre VACUEUX : rendre la puce sans
    // condition produit une puce VIDE pour Awa, dont `access_role` est nul — aucun
    // texte n'apparait, et l'assertion passait quand meme.
    //
    // Le selecteur porte sur la classe, faute de meilleure prise sur un element
    // purement decoratif. Un attribut de test serait pire : il n'existerait que
    // pour le test, et rien ne garantirait qu'il suive le composant.
    expect(container.querySelectorAll('span.rounded-34')).toHaveLength(1)
  })

  it('offre le retrait du carnet, nomme', () => {
    rendre([KARIM])

    // Le nom est DANS le libelle accessible : une liste de croix identiques ne dit
    // pas laquelle retire qui.
    expect(
      screen.getByRole('button', { name: 'Retirer Karim Lefebvre de mon carnet' }),
    ).toBeEnabled()
  })

  describe('la recherche', () => {
    it('trouve par nom, sans les accents', async () => {
      const utilisateur = userEvent.setup()
      rendre([KARIM, AWA])

      await utilisateur.type(screen.getByLabelText('Rechercher'), 'lefebvre')

      expect(screen.getByText('Karim Lefebvre')).toBeVisible()
      expect(screen.queryByText('Awa Diallo')).not.toBeInTheDocument()
    })

    it('trouve par employeur', async () => {
      const utilisateur = userEvent.setup()
      rendre([KARIM, AWA])

      await utilisateur.type(screen.getByLabelText('Rechercher'), 'toitures')

      expect(screen.getByText('Awa Diallo')).toBeVisible()
      expect(screen.queryByText('Karim Lefebvre')).not.toBeInTheDocument()
    })

    it('trouve par telephone colle', async () => {
      const utilisateur = userEvent.setup()
      rendre([KARIM, AWA])

      await utilisateur.type(screen.getByLabelText('Rechercher'), '0612457890')

      expect(screen.getByText('Karim Lefebvre')).toBeVisible()
      expect(screen.queryByText('Awa Diallo')).not.toBeInTheDocument()
    })
  })

  describe('le message de vide', () => {
    it('nomme le carnet quand il est reellement vide', () => {
      rendre([])
      expect(screen.getByText(/Votre carnet est vide/)).toBeVisible()
    })

    it("nomme la recherche quand c'est elle qui exclut tout", async () => {
      const utilisateur = userEvent.setup()
      rendre([KARIM])

      await utilisateur.type(screen.getByLabelText('Rechercher'), 'introuvable')

      // Confondre « rien dans le carnet » et « rien qui corresponde » fait chercher
      // une donnee qui existe.
      expect(screen.getByText(/ne correspond à « introuvable »/)).toBeVisible()
      expect(screen.queryByText(/Votre carnet est vide/)).not.toBeInTheDocument()
    })

    it("dit que le filtre RESTREINT le carnet et n'y ajoute rien", async () => {
      const utilisateur = userEvent.setup()
      // L'API ne rend RIEN pour cette entreprise : c'est le cas ou l'on detient
      // Karim, mais aucun contact de `e1` — parce que le filtre restreint le
      // carnet, il ne va pas chercher chez l'entreprise.
      const { container } = rendre([KARIM], { e1: [] })
      await utilisateur.selectOptions(screen.getByLabelText('Entreprise'), 'e1')

      // LE MESSAGE QUI COMPTE. Sans lui, un carnet filtre a vide laisserait croire
      // que l'entreprise n'a pas de contact — alors qu'elle en a peut-etre, et
      // qu'on ne les detient simplement pas.
      expect(container.textContent).toMatch(/restreint votre carnet/)
    })
  })
})
