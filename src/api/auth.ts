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

/**
 * Les facultes que la grille de droits sait retirer.
 *
 * L'union reprend `App\Domain\Identity\Enums\Droit` a l'identique. Elle est
 * ecrite a la main et non generee : six valeurs, et une valeur inventee ici ne
 * compilerait pas la ou elle est employee.
 *
 * `GET /me` NE REND QUE LES DROITS APPLIQUES. Quatre des six attendent M1, M3 et
 * M6 ; l'API les tait a dessein, pour que le front ne puisse pas masquer un
 * bouton au nom d'un droit qu'aucune policy ne verifie. Une restriction visible
 * que le serveur n'applique pas inspire une confiance qu'elle ne merite pas.
 *
 * @see chantiertr-api/app/Domain/Identity/Enums/Droit.php
 */
export type Droit =
  | 'supprimer_projet'
  | 'acceder_comptabilite'
  | 'modifier_facture_validee'
  | 'acceder_bibliotheque'
  | 'inviter_un_compte'
  | 'archiver_un_compte'

/**
 * Les six roles fonctionnels.
 *
 * @see chantiertr-api/app/Domain/Identity/Enums/Role.php
 */
export type Role =
  'superadmin' | 'super_admin_membre' | 'admin' | 'superviseur' | 'membre' | 'agent'

/**
 * L'emprunt de compte en cours.
 *
 * Le front NE PEUT PAS le deduire : l'emprunt vit dans la session sous
 * `impersonator_id`, et le cookie de session est `HttpOnly`. C'est l'API qui le
 * dit, et elle seule.
 */
export interface Emprunt {
  par: { id: string; nom: string }
}

/**
 * Tout ce que le shell a besoin de savoir : qui, avec quoi, et dans quel cadre.
 *
 * Les trois clefs viennent de `GET /me`, ou `data` porte le compte et les deux
 * autres le contexte de la SESSION. Elles sont reunies ici en un seul objet
 * parce qu'elles se lisent toujours ensemble et qu'elles s'invalident ensemble.
 */
export interface ContexteDeSession {
  utilisateur: Utilisateur
  droits: readonly Droit[]
  emprunt: Emprunt | null
}

/** La forme brute de `GET /me`, avant d'etre rangee en `ContexteDeSession`. */
interface ReponseMe {
  data: Utilisateur
  droits: Droit[]
  emprunt: Emprunt | null
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
async function chargerSession(): Promise<ContexteDeSession | null> {
  try {
    const reponse = await api.get<ReponseMe>('/me')

    return {
      utilisateur: reponse.data,
      droits: reponse.droits,
      emprunt: reponse.emprunt,
    }
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
 * `staleTime: Infinity` : le contexte ne change pas tout seul. Il est invalide
 * explicitement a la connexion, a la deconnexion et aux deux bouts de l'emprunt
 * de compte. Sans cela, chaque remontage de composant declencherait un
 * `GET /me`.
 */
export function useSession(): UseQueryResult<ContexteDeSession | null> {
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
 * LE PROFIL RENDU N'EST PAS POSE DANS LE CACHE, et c'est un renoncement
 * deliberé a une optimisation qui tenait auparavant. `POST /login` rend une
 * `UserResource` — le compte seul —, la ou le shell a besoin du CONTEXTE :
 * les droits effectifs et l'etat d'emprunt. Poser le compte seul remplirait le
 * cache d'un contexte a moitie vide, et la barre laterale se construirait un
 * instant sur `droits: []` avant de se corriger.
 *
 * Une invalidation, donc, et un `GET /me` de plus. Il coute une trentaine de
 * millisecondes sur un evenement qui arrive une fois par jour, et il garantit
 * qu'il n'existe qu'UNE forme de session dans l'application.
 */
export function useConnexion(): UseMutationResult<Utilisateur, Error, Identifiants> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (identifiants: Identifiants): Promise<Utilisateur> => {
      await amorcerSession()
      const { data } = await api.post<Enveloppe<Utilisateur>>('/login', identifiants)
      return data
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: CLEF_SESSION })
    },
  })
}

/**
 * Fin de l'emprunt de compte.
 *
 * TOUT LE CACHE PART, et pas seulement la session. Chaque entree a ete lue au
 * nom du compte emprunte, dans son tenant : la garder ferait voir au
 * super-administrateur, le temps d'un rafraichissement, l'annuaire d'un adherent
 * sous sa propre identite. C'est le meme raisonnement qu'a la deconnexion, et le
 * meme ordre — la session par une valeur explicite, le reste par retrait cible,
 * jamais `clear()`.
 *
 * La difference avec la deconnexion : ici la session ne tombe pas a `null`, elle
 * REDEVIENT celle de l'emprunteur. On invalide donc au lieu de vider.
 */
export function useArreterEmprunt(): UseMutationResult<void, Error, void> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.delete('/impersonation')
    },
    onSettled: async () => {
      client.removeQueries({
        predicate: (requete) => requete.queryKey[0] !== CLEF_SESSION[0],
      })
      await client.invalidateQueries({ queryKey: CLEF_SESSION })
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
