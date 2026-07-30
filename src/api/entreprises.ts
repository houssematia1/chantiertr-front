import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { api } from '@/lib/http'
import type { Enveloppe } from '@/lib/http'

/**
 * L'annuaire des entreprises.
 *
 * @see chantiertr-api/app/Http/Controllers/Api/CompanyController.php
 * @see chantiertr-api/app/Http/Resources/CompanyResource.php
 */

/**
 * Une fiche entreprise, telle que l'API la rend.
 *
 * DEUX CHAMPS SONT OPTIONNELS POUR UNE RAISON DE CONFIDENTIALITE, pas par
 * negligence de schema. `numero_adherent` et `default_emetteur` ne sont rendus
 * qu'a la plateforme et a l'entreprise elle-meme : le SIREN est public, la
 * qualite de CLIENT de la plateforme ne l'est pas. Les rendre a tout detenteur
 * d'une fiche donnerait a chaque adherent le moyen de trier ses concurrents
 * entre clients et non-clients de l'editeur.
 *
 * Ils sont donc `undefined` — absents de la reponse — et non `null`. Le front ne
 * doit jamais conclure « pas adherent » de leur absence : il ne sait pas.
 */
export interface Entreprise {
  id: string
  name: string
  legal: string | null
  categorie: string | null
  forme_juridique: string | null
  capital: string | null
  siren: string | null
  siret: string | null
  ape: string | null
  rcs: string | null
  rcs_ville: string | null
  adresse: string | null
  cp: string | null
  ville: string | null
  tva: string | null
  iban: string | null
  bic: string | null
  assureur: string | null
  couverture_rc: string | null
  gerant: string | null
  qualite: string | null
  tel: string | null

  /**
   * L'URL publique du logo, ou `null`.
   *
   * Elle est CONSTRUITE par l'API a la lecture ; la base ne porte qu'un chemin
   * relatif. Le front ne la fabrique jamais — le jour d'un passage sur un
   * stockage objet, seule la configuration du disque changera cote serveur.
   */
  logo_url: string | null

  /** Date d'inscription, en ISO 8601. */
  created_at: string | null

  /** L'editeur du produit. Une seule ligne dans toute la table. */
  is_platform: boolean

  /**
   * La fiche vient de l'annuaire de reference tenu par la plateforme : lisible
   * par tous les adherents, modifiable par la seule plateforme.
   */
  annuaire_reference: boolean

  /** Absent si le lecteur n'est ni la plateforme ni l'entreprise elle-meme. */
  numero_adherent?: string | null
  default_emetteur?: boolean

  /**
   * Le nombre de comptes heberges. Absent sous la meme regle que le numero
   * d'adherent, et pour une raison de meme nature : c'est un EFFECTIF. Le rendre
   * a tout detenteur d'une fiche donnerait a chaque adherent la taille de ses
   * concurrents et de ses sous-traitants, tenue a jour.
   */
  nombre_de_comptes?: number
}

/**
 * Les vingt champs que l'API accepte en creation et en modification.
 *
 * `is_platform`, `default_emetteur`, `numero_adherent` et `annuaire_reference`
 * n'y sont PAS, et c'est le meme garde que cote API : ce sont des decisions de
 * la plateforme — identite de l'editeur, entreprise emettrice des documents,
 * qualite de tenant, et qui voit la fiche. Le numero d'adherent a sa propre
 * route ; la publication ne se pose qu'a la creation.
 */
export type FormulaireEntreprise = Pick<
  Entreprise,
  | 'name'
  | 'legal'
  | 'categorie'
  | 'forme_juridique'
  | 'capital'
  | 'siren'
  | 'siret'
  | 'ape'
  | 'rcs'
  | 'rcs_ville'
  | 'adresse'
  | 'cp'
  | 'ville'
  | 'tva'
  | 'iban'
  | 'bic'
  | 'assureur'
  | 'couverture_rc'
  | 'gerant'
  | 'qualite'
  | 'tel'
>

/** La creation accepte en plus la publication a l'annuaire de reference. */
export type CreationEntreprise = FormulaireEntreprise & { annuaire_reference?: boolean }

export const CLEF_ENTREPRISES = ['entreprises'] as const

/** La clef d'une fiche. Prefixee par celle de la liste, pour tout invalider d'un coup. */
export function clefEntreprise(id: string): readonly unknown[] {
  return [...CLEF_ENTREPRISES, id]
}

/**
 * L'annuaire visible depuis le compte courant.
 *
 * AUCUNE PAGINATION, et c'est le contrat de l'API : `index()` rend la collection
 * entiere, triee par raison sociale. Le perimetre est deja etroit — sa propre
 * fiche, son carnet, et l'annuaire de reference —, sauf pour le
 * super-administrateur plateforme qui voit tout. Le jour ou cette liste
 * depassera le millier de lignes, c'est l'API qu'il faudra paginer, pas le front
 * qu'il faudra virtualiser.
 *
 * `categorie` est passee a l'API et non filtree ici : c'est elle qui normalise
 * les apostrophes typographiques — `normaliserCategorie` —, et le meme filtre
 * applique cote front sur une valeur non normalisee viderait la liste sans rien
 * expliquer.
 */
export function useEntreprises(categorie?: string): UseQueryResult<Entreprise[]> {
  return useQuery({
    queryKey: [...CLEF_ENTREPRISES, { categorie: categorie ?? null }],
    queryFn: async (): Promise<Entreprise[]> => {
      const requete = categorie === undefined ? '' : `?categorie=${encodeURIComponent(categorie)}`
      const { data } = await api.get<Enveloppe<Entreprise[]>>(`/companies${requete}`)
      return data
    },
  })
}

export function useEntreprise(id: string): UseQueryResult<Entreprise> {
  return useQuery({
    queryKey: clefEntreprise(id),
    queryFn: async (): Promise<Entreprise> => {
      const { data } = await api.get<Enveloppe<Entreprise>>(`/companies/${id}`)
      return data
    },
  })
}

export function useCreerEntreprise(): UseMutationResult<Entreprise, Error, CreationEntreprise> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (valeurs: CreationEntreprise): Promise<Entreprise> => {
      const { data } = await api.post<Enveloppe<Entreprise>>('/companies', valeurs)
      return data
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: CLEF_ENTREPRISES })
    },
  })
}

export function useModifierEntreprise(
  id: string,
): UseMutationResult<Entreprise, Error, Partial<FormulaireEntreprise>> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (valeurs: Partial<FormulaireEntreprise>): Promise<Entreprise> => {
      const { data } = await api.patch<Enveloppe<Entreprise>>(`/companies/${id}`, valeurs)
      return data
    },
    onSuccess: (entreprise) => {
      // La fiche rendue est posee directement : elle EST la reponse, et un
      // `GET` de plus n'apprendrait rien. La liste, elle, est invalidee — la
      // raison sociale ou la categorie viennent peut-etre de changer.
      client.setQueryData(clefEntreprise(id), entreprise)
      void client.invalidateQueries({ queryKey: CLEF_ENTREPRISES, exact: false })
    },
  })
}

/**
 * Retire la fiche du carnet du compte.
 *
 * `DELETE` NE DETRUIT PAS, et le nom du hook le dit : cote API, la fiche sort du
 * carnet et reste en base. Elle n'est detruite que si elle n'est adherente
 * d'aucune plateforme, ne porte ni compte ni contact, et ne figure dans aucun
 * autre carnet — et c'est l'API qui en decide, jamais le front.
 *
 * Nommer ce hook `useSupprimerEntreprise` aurait suffi a faire ecrire un
 * « Supprimer definitivement » dans une interface, pour une action qui ne
 * supprime pas.
 */
export function useRetirerDuCarnet(): UseMutationResult<void, Error, string> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/companies/${id}`)
    },
    onSuccess: async (_, id) => {
      client.removeQueries({ queryKey: clefEntreprise(id) })
      await client.invalidateQueries({ queryKey: CLEF_ENTREPRISES })
    },
  })
}

/**
 * Attribue le numero d'adherent — la qualite de tenant.
 *
 * ROUTE DEDIEE, ET RESERVEE AU SUPER-ADMINISTRATEUR PLATEFORME. Ce n'est pas un
 * champ de `PATCH /companies/{id}` et cela ne le sera pas : le numero vaut droit
 * d'heberger des comptes et d'ouvrir des projets. Le logiciel d'origine ne
 * l'accorde que par « + Nouvel adherent ».
 *
 * Deux refus en 409, que le front affiche tels quels : la plateforme n'adhere
 * pas a elle-meme, et une fiche de l'annuaire de reference n'adhere pas non plus
 * — ce second refus est un anti-oracle, l'attribution ferait disparaitre la
 * fiche de la vue de tous les adherents et daterait chaque signature.
 */
export function useAttribuerAdhesion(): UseMutationResult<Entreprise, Error, string> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Entreprise> => {
      const { data } = await api.post<Enveloppe<Entreprise>>(`/companies/${id}/adherent`)
      return data
    },
    onSuccess: async (entreprise) => {
      client.setQueryData(clefEntreprise(entreprise.id), entreprise)
      await client.invalidateQueries({ queryKey: CLEF_ENTREPRISES })
    },
  })
}

/**
 * Remplace le logo de la fiche.
 *
 * `FormData` ET NON JSON, et ce n'est pas un choix : un fichier ne se serialise
 * pas en JSON, et PHP ne peuple `$_FILES` que sur un POST en
 * `multipart/form-data`. Le client HTTP doit donc laisser le navigateur poser
 * lui-meme l'en-tete `Content-Type` — celui-ci porte la frontiere de separation
 * des parties, que nous ne pouvons pas deviner.
 *
 * L'API refuse le SVG. Ce n'est pas une restriction de confort : un SVG est un
 * document XML, il porte du JavaScript, et servi depuis le domaine du produit il
 * s'executerait avec le cookie de session de qui l'affiche.
 */
export function useTeleverserLogo(id: string): UseMutationResult<Entreprise, Error, File> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (fichier: File): Promise<Entreprise> => {
      const corps = new FormData()
      corps.append('logo', fichier)

      const { data } = await api.postFichier<Enveloppe<Entreprise>>(`/companies/${id}/logo`, corps)

      return data
    },
    onSuccess: (entreprise) => {
      client.setQueryData(clefEntreprise(id), entreprise)
      void client.invalidateQueries({ queryKey: CLEF_ENTREPRISES })
    },
  })
}

/** Retire le logo de la fiche. L'API efface aussi le fichier. */
export function useRetirerLogo(id: string): UseMutationResult<Entreprise, Error, void> {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<Entreprise> => {
      const { data } = await api.delete<Enveloppe<Entreprise>>(`/companies/${id}/logo`)
      return data
    },
    onSuccess: (entreprise) => {
      client.setQueryData(clefEntreprise(id), entreprise)
      void client.invalidateQueries({ queryKey: CLEF_ENTREPRISES })
    },
  })
}
