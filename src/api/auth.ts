import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'

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
 * Le cache est vide INTEGRALEMENT, pas seulement la session : tout ce qu'il
 * contient a ete lu au nom du compte qui part. Le laisser en place le
 * montrerait au compte suivant sur le meme poste, le temps d'un rafraichissement.
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
      client.clear()
      // Pose apres le vidage, et non avant : `clear()` emporterait la valeur.
      // Sans elle, l'observateur remonte et redemande `GET /me` pour se faire
      // rendre 401 — un aller-retour pour une reponse deja connue.
      client.setQueryData(CLEF_SESSION, null)
    },
  })
}
