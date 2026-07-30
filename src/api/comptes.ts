import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { CLEF_SESSION } from '@/api/auth'
import type { Droit, Role, Utilisateur } from '@/api/auth'
import { api } from '@/lib/http'
import type { Enveloppe } from '@/lib/http'

/**
 * Les comptes, et la grille des droits.
 *
 * @see chantiertr-api/app/Http/Controllers/Api/UserController.php
 * @see chantiertr-api/app/Http/Controllers/Api/RolePermissionController.php
 */

/** Les champs que l'API accepte a la creation d'un compte. */
export interface FormulaireCompte {
  company_id: string
  prenom: string
  nom: string
  email: string
  tel: string | null
  poste: string | null
  role: Role
}

/**
 * La modification d'un compte.
 *
 * `role` Y EST, `password` ET `statut` N'Y SONT PAS, et ce n'est pas un oubli :
 *
 * - `password` est declare `prohibited` cote API. C'est la correction de la prise
 *   de controle complete trouvee au socle — un administrateur d'entreprise
 *   changeait le mot de passe d'un super-administrateur, sans trace au journal
 *   puisque le mot de passe en est exclu. Le titulaire choisit le sien par lien ;
 * - `statut` est ignore par `PATCH` a dessein. L'archivage et la reactivation ont
 *   leurs propres routes, parce que ce sont des ACTES et non des champs.
 */
export type ModificationCompte = Partial<Omit<FormulaireCompte, 'company_id'>>

export const CLEF_COMPTES = ['comptes'] as const
export const CLEF_DROITS = ['grille-des-droits'] as const

export function clefCompte(id: string): readonly unknown[] {
  return [...CLEF_COMPTES, id]
}

/**
 * L'annuaire des comptes visibles depuis le compte courant.
 *
 * LE PERIMETRE N'EST PAS CELUI QU'ON CROIT. `UserPolicy::view()` exige de partager
 * l'entreprise ET que le collegue ne releve pas de la plateforme : un
 * administrateur d'entreprise ne voit JAMAIS un compte de plateforme dans son
 * perimetre gerable. C'est la reparation d'une regression contre le logiciel
 * d'origine, dont `companyUsers()` filtre `!isPlatformUser(u)`.
 *
 * Le front n'a pas a le redire — la liste rendue est deja filtree.
 */
export function useComptes(): UseQueryResult<Utilisateur[]> {
  return useQuery({
    queryKey: CLEF_COMPTES,
    queryFn: async (): Promise<Utilisateur[]> => {
      const { data } = await api.get<Enveloppe<Utilisateur[]>>('/users')
      return data
    },
  })
}

export function useCreerCompte(): UseMutationResult<Utilisateur, Error, FormulaireCompte> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (valeurs: FormulaireCompte): Promise<Utilisateur> => {
      const { data } = await api.post<Enveloppe<Utilisateur>>('/users', valeurs)
      return data
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: CLEF_COMPTES })
    },
  })
}

export function useModifierCompte(
  id: string,
): UseMutationResult<Utilisateur, Error, ModificationCompte> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (valeurs: ModificationCompte): Promise<Utilisateur> => {
      const { data } = await api.patch<Enveloppe<Utilisateur>>(`/users/${id}`, valeurs)
      return data
    },
    onSuccess: async (compte) => {
      client.setQueryData(clefCompte(id), compte)
      await client.invalidateQueries({ queryKey: CLEF_COMPTES })
    },
  })
}

/**
 * Archive un compte — il ne peut plus se connecter.
 *
 * CE N'EST PAS UNE SUPPRESSION, et la route `DELETE /users/{id}` n'existe pas :
 * elle rend 405. Un compte porte une histoire — des actes, des documents, des
 * attributions —, et la detruire rendrait le journal d'audit incomprehensible.
 *
 * L'API refuse qu'un compte s'archive lui-meme.
 */
export function useArchiverCompte(): UseMutationResult<Utilisateur, Error, string> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Utilisateur> => {
      const { data } = await api.post<Enveloppe<Utilisateur>>(`/users/${id}/archive`)
      return data
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: CLEF_COMPTES })
    },
  })
}

/**
 * Reactive un compte archive.
 *
 * Le pendant de l'archivage, et il n'est pas decoratif : sans lui, un archivage
 * par erreur etait definitif via l'API — `PATCH` ignore `statut` a dessein, et
 * rien ne le remplacait.
 */
export function useReactiverCompte(): UseMutationResult<Utilisateur, Error, string> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Utilisateur> => {
      const { data } = await api.post<Enveloppe<Utilisateur>>(`/users/${id}/reactivate`)
      return data
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: CLEF_COMPTES })
    },
  })
}

/** Renvoie l'invitation — le lien a pu perimer ou se perdre dans les indesirables. */
export function useRenvoyerInvitation(): UseMutationResult<{ message: string }, Error, string> {
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> =>
      api.post<{ message: string }>(`/users/${id}/invitation`),
  })
}

/**
 * Annule une invitation qui n'a pas encore servi.
 *
 * C'EST LE SEUL ENDROIT DU PRODUIT OU UN COMPTE EST DETRUIT, et c'est justifie :
 * une invitation non acceptee n'a pas d'histoire — personne n'a jamais ouvert ce
 * compte. Ne pas la detruire couterait cher : l'adresse est unique sur toute la
 * plateforme, et un compte fantome la retiendrait a jamais, y compris contre le
 * veritable employeur de la personne.
 *
 * Le nom du hook dit « annuler » et non « supprimer », comme la regle du client.
 */
export function useAnnulerInvitation(): UseMutationResult<void, Error, string> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/users/${id}/invitation`)
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: CLEF_COMPTES })
    },
  })
}

/**
 * Emprunte un compte.
 *
 * TOUT LE CACHE PART, et pas seulement la session : chaque entree a ete lue au nom
 * du compte emprunteur. La garder ferait voir, le temps d'un rafraichissement,
 * l'annuaire de la plateforme sous l'identite du compte emprunte.
 *
 * C'est le declencheur qui manquait depuis la tache 2 : le bandeau d'emprunt
 * existait, et rien ne l'allumait.
 */
export function useEmprunterCompte(): UseMutationResult<Utilisateur, Error, string> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Utilisateur> => {
      const { data } = await api.post<Enveloppe<Utilisateur>>(`/impersonation/${id}`)
      return data
    },
    onSettled: async () => {
      client.removeQueries({
        predicate: (requete) => requete.queryKey[0] !== CLEF_SESSION[0],
      })
      await client.invalidateQueries({ queryKey: CLEF_SESSION })
    },
  })
}

/* ══════════════════════ LA GRILLE DES DROITS ══════════════════════ */

/** Une colonne de la grille : un profil, et ce qu'il obtient sur ce droit. */
export interface CaseDeGrille {
  profil: string
  libelle: string
  accorde: boolean
  /** La valeur de reference, celle du logiciel d'origine. */
  defaut: boolean
}

/** Une ligne de la grille : un droit, et ses colonnes. */
export interface LigneDeGrille {
  droit: Droit
  libelle: string
  /**
   * Le droit gouverne-t-il aujourd'hui une fonctionnalite qui existe ?
   *
   * QUATRE DES SIX SONT DECLARES INACTIFS, et l'API le dit plutot que de le taire.
   * Un droit affiche qu'aucun code n'applique est un mensonge : l'administrateur
   * croit avoir restreint quelque chose et il ne s'est rien passe. L'interface doit
   * donc le SIGNALER, pas le masquer — le masquer laisserait croire que la grille
   * ne compte que deux lignes.
   */
  actif: boolean
  /** Le lot qui apportera la fonctionnalite, ou `null` si elle est deja livree. */
  lot_attendu: string | null
  profils: CaseDeGrille[]
}

export function useGrilleDesDroits(): UseQueryResult<LigneDeGrille[]> {
  return useQuery({
    queryKey: CLEF_DROITS,
    queryFn: async (): Promise<LigneDeGrille[]> => {
      const { data } = await api.get<Enveloppe<LigneDeGrille[]>>('/permissions')
      return data
    },
  })
}

/** Ce qu'une bascule de case demande. */
export interface ReglageDeCase {
  droit: Droit
  profil: string
  accorde: boolean
}

/**
 * Regle une case de la grille.
 *
 * LA MISE A JOUR EST OPTIMISTE, ET CE N'EST PAS UN CONFORT. Les cases sont des
 * cases a cocher CONTROLEES sur la valeur du cache : sans ecriture immediate, un
 * clic ne change rien a l'ecran jusqu'a ce que la requete revienne, la case
 * revient visuellement a son etat d'origine, et l'utilisateur reclique. Sur une
 * grille de dix-huit cases, cela se lit comme une panne — et c'est ainsi que la
 * premiere version se comportait, jusqu'a la verification au navigateur.
 *
 * `onMutate` ECRIT ET REND L'ANCIENNE VALEUR ; `onError` la remet. Le contexte de
 * TanStack Query existe exactement pour cela — sans lui, un refus de l'API
 * laisserait une case cochee que le serveur n'a pas acceptee, ce qui est pire que
 * la lenteur.
 *
 * `cancelQueries` AVANT L'ECRITURE : une requete de grille en vol se resoudrait
 * apres notre ecriture optimiste et la remplacerait par la valeur d'avant.
 *
 * LA SESSION EST INVALIDEE AVEC LA GRILLE, et c'est indispensable : `GET /me` rend
 * les droits EFFECTIFS du compte courant. Un super-administrateur qui se retire un
 * droit continuerait sinon de voir les boutons correspondants jusqu'au prochain
 * rechargement, et les verrait refuses par l'API.
 */
export function useReglerUneCase(): UseMutationResult<
  void,
  Error,
  ReglageDeCase,
  { avant: LigneDeGrille[] | undefined }
> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ droit, profil, accorde }): Promise<void> => {
      await api.put(`/permissions/${droit}/${profil}`, { accorde })
    },

    onMutate: async ({ droit, profil, accorde }) => {
      await client.cancelQueries({ queryKey: CLEF_DROITS })

      const avant = client.getQueryData<LigneDeGrille[]>(CLEF_DROITS)

      client.setQueryData<LigneDeGrille[]>(CLEF_DROITS, (grille) =>
        grille?.map((ligne) =>
          ligne.droit === droit
            ? {
                ...ligne,
                profils: ligne.profils.map((colonne) =>
                  colonne.profil === profil ? { ...colonne, accorde } : colonne,
                ),
              }
            : ligne,
        ),
      )

      return { avant }
    },

    onError: (_erreur, _variables, contexte) => {
      // On remet la grille telle qu'elle etait. Laisser la case cochee alors que le
      // serveur a refuse est pire que la lenteur : l'administrateur croirait avoir
      // regle quelque chose.
      if (contexte?.avant !== undefined) {
        client.setQueryData(CLEF_DROITS, contexte.avant)
      }
    },

    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: CLEF_DROITS }),
        client.invalidateQueries({ queryKey: CLEF_SESSION }),
      ])
    },
  })
}
