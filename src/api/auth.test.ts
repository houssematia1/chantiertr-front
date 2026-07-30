import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { CLEF_SESSION, fermerLaSessionLocale } from './auth'
import type { Utilisateur } from './auth'

/**
 * Regression : la deconnexion doit etre VUE par les observateurs deja abonnes.
 *
 * Le bug corrige ici ne se voyait ni en type, ni en lint, ni dans une assertion
 * sur l'etat final du cache — l'etat final etait bon. Il ne se voyait qu'a
 * l'ecran, contre l'API en marche : `POST /logout` rendait 200, et
 * l'utilisateur restait sur une page blanche a l'adresse `/`.
 *
 * La cause etait `queryClient.clear()`, qui detruit les entrees du cache sans
 * en avertir les observateurs montes. `GardeDeSession` restait branchee sur
 * l'ancienne instance et continuait de croire la session ouverte.
 *
 * Le test ne monte aucun composant : `QueryObserver` est l'objet que
 * `useQuery` enveloppe, et c'est a ce niveau que la notification se joue.
 */

const COMPTE: Utilisateur = {
  id: '019fb043-0ffa-7315-8ab7-107dddbdbf1b',
  prenom: 'Houssy',
  nom: 'Atia',
  email: 'dev@chantiertranquille.fr',
  tel: null,
  poste: null,
  role: 'superadmin',
  role_label: 'Super-administrateur',
  statut: 'actif',
  statut_label: 'Actif',
  company_id: null,
}

/** Un observateur abonne a la session, et la liste de ce qu'il a vu passer. */
function observerLaSession(client: QueryClient): {
  vues: (Utilisateur | null | undefined)[]
  desabonner: () => void
} {
  const observer = new QueryObserver<Utilisateur | null>(client, {
    queryKey: CLEF_SESSION,
    staleTime: Infinity,
    // Aucun appel reseau : le test porte sur la notification, pas sur `GET /me`.
    enabled: false,
  })

  const vues: (Utilisateur | null | undefined)[] = []
  const desabonner = observer.subscribe((resultat) => {
    vues.push(resultat.data)
  })

  return { vues, desabonner }
}

describe('fermeture de la session locale', () => {
  it('notifie un observateur deja abonne que la session est tombee', () => {
    const client = new QueryClient()
    client.setQueryData(CLEF_SESSION, COMPTE)

    const { vues, desabonner } = observerLaSession(client)

    fermerLaSessionLocale(client)

    // LA propriete : l'observateur a vu `null`. Avec `clear()`, il ne voyait
    // rien du tout et restait sur le compte precedent.
    expect(vues.at(-1)).toBeNull()
    expect(client.getQueryData(CLEF_SESSION)).toBeNull()

    desabonner()
  })

  it('emporte tout ce qui a ete lu au nom du compte qui part', () => {
    const client = new QueryClient()
    client.setQueryData(CLEF_SESSION, COMPTE)
    client.setQueryData(['companies'], [{ id: '1' }])
    client.setQueryData(['users', 'page', 1], [{ id: '2' }])

    fermerLaSessionLocale(client)

    expect(client.getQueryData(['companies'])).toBeUndefined()
    expect(client.getQueryData(['users', 'page', 1])).toBeUndefined()
    // Une seule entree survit, et elle dit qu'il n'y a personne.
    expect(client.getQueryCache().getAll()).toHaveLength(1)
    expect(client.getQueryData(CLEF_SESSION)).toBeNull()
  })
})
