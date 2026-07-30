import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { ApiError, api, amorcerSession } from '@/lib/http'
import type { Enveloppe } from '@/lib/http'

/**
 * Un compte utilisateur, tel que l'API le rend.
 *
 * La forme suit `UserResource` a plat, jamais un objet `company` imbrique :
 * `company_id` est le tenant et doit rester disponible sans jointure.
 *
 * @see chantiertr-api/app/Http/Resources/UserResource.php
 */
export interface Utilisateur {
  id: string
  prenom: string
  nom: string
  email: string
  tel: string | null
  poste: string | null
  role: string
  role_label: string
  statut: string
  statut_label: string
  company_id: string | null
  company_name?: string | null
}

export interface Identifiants {
  email: string
  password: string
}

/** La clef du profil courant. Une seule, partagee par toute l'application. */
export const CLEF_SESSION = ['session'] as const

/**
 * Le profil du compte connecte, ou `null` s'il n'y en a pas.
 *
 * Un 401 n'est PAS une erreur ici : « personne n'est connecte » est un etat
 * normal de l'application, pas une panne. Le rendre en `null` evite qu'un
 * visiteur anonyme voie un ecran d'erreur au lieu de l'ecran de connexion.
 */
async function chargerSession(): Promise<Utilisateur | null> {
  try {
    const { data } = await api.get<Enveloppe<Utilisateur>>('/me')
    return data
  } catch (erreur) {
    if (erreur instanceof ApiError && (erreur.status === 401 || erreur.status === 403)) {
      return null
    }
    throw erreur
  }
}

/**
 * Etat de la session courante.
 *
 * `staleTime: Infinity` : le profil ne change pas tout seul. Il est invalide
 * explicitement a la connexion, a la deconnexion et — au lot 2 — a l'emprunt de
 * compte. Sans cela, chaque remontage de composant declencherait un `GET /me`.
 */
export function useSession(): UseQueryResult<Utilisateur | null> {
  return useQuery({
    queryKey: CLEF_SESSION,
    queryFn: chargerSession,
    staleTime: Infinity,
    // Reessayer une absence de session n'a aucun sens, et retarde l'affichage
    // de l'ecran de connexion d'autant de tentatives.
    retry: false,
    refetchOnWindowFocus: false,
  })
}

/**
 * Connexion.
 *
 * La session est amorcee AVANT le POST — c'est ce que `/sanctum/csrf-cookie`
 * fait — sans quoi l'API rend 419 et non 422. Le client HTTP s'en charge, mais
 * l'appel est ici explicite : sur la connexion, l'ordre est un point du
 * contrat, pas un detail d'implementation.
 *
 * La reponse EST le profil : `AuthController::login()` rend une `UserResource`.
 * Elle est posee directement dans le cache, ce qui evite un `GET /me` de plus
 * juste apres.
 */
export function useConnexion(): UseMutationResult<Utilisateur, Error, Identifiants> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (identifiants: Identifiants): Promise<Utilisateur> => {
      await amorcerSession()
      const { data } = await api.post<Enveloppe<Utilisateur>>('/login', identifiants)
      return data
    },
    onSuccess: (utilisateur) => {
      client.setQueryData(CLEF_SESSION, utilisateur)
    },
  })
}

/**
 * Deconnexion.
 *
 * Tout ce que le cache contient a ete lu au nom du compte qui part : il doit
 * donc partir avec lui, sans quoi le compte suivant sur le meme poste le verrait
 * le temps d'un rafraichissement. Une seule entree survit, et elle est mise a
 * `null` : celle de la session, que la garde de route lit pour savoir qu'il n'y
 * a plus personne.
 *
 * `clear()` NE PEUT PAS ETRE EMPLOYE ICI, et c'est le contraire de ce qu'on
 * croit en le lisant. Il detruit les entrees du cache sans en avertir les
 * observateurs montes : chacun se reconstruit alors une entree de son cote, et
 * deux composants qui lisent la MEME clef se retrouvent branches sur deux
 * instances differentes. Le `setQueryData` qui suit n'en touche qu'une.
 *
 * Le symptome, verifie contre l'API en marche : `POST /logout` rendait 200,
 * `Profil` voyait bien la session tomber a `null` et ne rendait plus rien —
 * mais `GardeDeSession`, restee sur son ancienne instance, continuait de croire
 * la session ouverte et rendait son `Outlet`. Ecran vide, adresse inchangee,
 * aucune erreur en console. L'utilisateur reste bloque sur une page blanche
 * apres avoir demande a se deconnecter.
 *
 * L'ordre compte donc, et il est inverse de l'intuition : la session d'abord,
 * par une valeur explicite, le reste ensuite et par retrait cible.
 *
 * Le vidage a lieu dans `onSettled` et non `onSuccess` : si l'API refuse, la
 * session locale doit tomber quand meme — un ecran qui reste ouvert sur un
 * compte qu'on a demande a fermer est pire qu'une erreur.
 */
export function useDeconnexion(): UseMutationResult<void, Error, void> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/logout')
    },
    onSettled: () => {
      fermerLaSessionLocale(client)
    },
  })
}

/**
 * Remet le cache dans l'etat « personne n'est connecte ».
 *
 * Fonction et non corps de callback : c'est l'invariant que la deconnexion doit
 * tenir, et il se teste sans monter de composant — `src/api/auth.test.ts`
 * verifie qu'un observateur deja abonne VOIT le passage a `null`. C'est
 * precisement ce que `clear()` ne garantissait pas.
 */
export function fermerLaSessionLocale(client: QueryClient): void {
  // `null` et non un retrait : la garde de route distingue « pas encore charge »
  // de « personne n'est connecte ». Un retrait la ferait redemander `GET /me`
  // pour se faire rendre 401 — un aller-retour pour une reponse deja connue.
  client.setQueryData(CLEF_SESSION, null)

  client.removeQueries({
    predicate: (requete) => requete.queryKey[0] !== CLEF_SESSION[0],
  })
}
