import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { api } from '@/lib/http'
import type { Enveloppe } from '@/lib/http'

/**
 * Les contacts, et le carnet d'adresses.
 *
 * LE MODELE A DEUX AXES, et les confondre est la faute que le socle a corrigee :
 *
 *   `company_id` dit QUI EMPLOIE la personne — son entreprise ;
 *   le carnet dit QUI LA DETIENT — l'entreprise qui a saisi ou repris la fiche.
 *
 * Les deux sont independants. Enregistrer l'interlocuteur d'un fournisseur ne
 * donne aucun acces a ce fournisseur, et deux concurrents peuvent detenir la meme
 * fiche sans se voir.
 *
 * @see chantiertr-api/app/Http/Controllers/Api/ContactController.php
 */

/** Une fiche contact, telle que l'API la rend. */
export interface Contact {
  id: string

  /** L'EMPLOYEUR, pas le detenteur. Voir l'en-tete de ce fichier. */
  company_id: string
  company_name: string | null

  prenom: string
  nom: string
  /** `prenom nom`, deja assemble par l'API — on ne le recompose pas ici. */
  nom_complet: string

  email: string | null
  portable: string | null
  poste: string | null

  /**
   * Le role d'acces, quand la personne en a un.
   *
   * CE N'EST PAS UNE LISTE FERMEE cote API — `string|max:50`, sans `Rule::in`. Le
   * logiciel d'origine l'attribue par `accessRole` sur une fiche contact, avec
   * Administrateur, Superviseur et Agent, mais accepte ce qu'il trouve.
   */
  access_role: string | null
}

/** Les champs que l'API accepte en creation et en modification. */
export interface FormulaireContact {
  company_id: string
  prenom: string
  nom: string
  email: string | null
  portable: string | null
  poste: string | null
  access_role: string | null
}

export const CLEF_CONTACTS = ['contacts'] as const

export function clefContact(id: string): readonly unknown[] {
  return [...CLEF_CONTACTS, id]
}

/**
 * Les contacts visibles depuis le compte courant.
 *
 * `company_id` RESTREINT, IL N'ELARGIT JAMAIS. Cote API le filtre de perimetre
 * precede le filtre demande : passer l'identifiant d'une entreprise dont on ne
 * detient aucune fiche rend une liste vide, pas les contacts de cette entreprise.
 *
 * Aucune pagination : `index()` rend la collection entiere, triee par nom.
 */
export function useContacts(companyId?: string): UseQueryResult<Contact[]> {
  return useQuery({
    queryKey: [...CLEF_CONTACTS, { company_id: companyId ?? null }],
    queryFn: async (): Promise<Contact[]> => {
      const requete = companyId === undefined ? '' : `?company_id=${encodeURIComponent(companyId)}`
      const { data } = await api.get<Enveloppe<Contact[]>>(`/contacts${requete}`)
      return data
    },
  })
}

export function useContact(id: string): UseQueryResult<Contact> {
  return useQuery({
    queryKey: clefContact(id),
    queryFn: async (): Promise<Contact> => {
      const { data } = await api.get<Enveloppe<Contact>>(`/contacts/${id}`)
      return data
    },
  })
}

/**
 * Cree une fiche, et la depose dans le carnet du compte.
 *
 * LE RATTACHEMENT EST AUTOMATIQUE, en une transaction cote API. Ce n'est pas une
 * commodite : un rattachement en deux appels laisserait entre les deux une fiche
 * que son createur ne voit deja plus — il l'aurait creee et perdue.
 */
export function useCreerContact(): UseMutationResult<Contact, Error, FormulaireContact> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (valeurs: FormulaireContact): Promise<Contact> => {
      const { data } = await api.post<Enveloppe<Contact>>('/contacts', valeurs)
      return data
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: CLEF_CONTACTS })
    },
  })
}

export function useModifierContact(
  id: string,
): UseMutationResult<Contact, Error, Partial<FormulaireContact>> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (valeurs: Partial<FormulaireContact>): Promise<Contact> => {
      const { data } = await api.patch<Enveloppe<Contact>>(`/contacts/${id}`, valeurs)
      return data
    },
    onSuccess: (contact) => {
      client.setQueryData(clefContact(id), contact)
      void client.invalidateQueries({ queryKey: CLEF_CONTACTS })
    },
  })
}

/**
 * Retire la fiche du carnet du compte.
 *
 * `DELETE` NE DETRUIT PAS, sauf pour le super-administrateur plateforme. Deux
 * concurrents peuvent detenir la meme fiche : detruire au premier retrait
 * effacerait l'interlocuteur de l'autre, qui n'a rien demande. La fiche ne
 * disparait que lorsque le dernier carnet la lache.
 *
 * Le nom du hook le dit, et c'est deliberé : `useSupprimerContact` aurait suffi a
 * faire ecrire un « Supprimer définitivement » dans une interface, pour une action
 * qui ne supprime pas.
 */
export function useRetirerContactDuCarnet(): UseMutationResult<void, Error, string> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/contacts/${id}`)
    },
    onSuccess: async (_, id) => {
      client.removeQueries({ queryKey: clefContact(id) })
      await client.invalidateQueries({ queryKey: CLEF_CONTACTS })
    },
  })
}
