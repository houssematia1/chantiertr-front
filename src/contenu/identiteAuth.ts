/**
 * Le contenu du volet d'identite de l'ecran sans session.
 *
 * Il vit ici et non dans le layout pour une seule raison : LES TROIS CHIFFRES
 * SONT DES AFFIRMATIONS. Un ecran de connexion qui annonce « 19 prestations »
 * l'affirme au nom du produit ; s'il se trompe, le produit ment des sa premiere
 * page. Les isoler dans un module qui porte leur provenance rend la verification
 * possible — et rend visible le jour ou le catalogue changera.
 *
 * Chaque chiffre est RELEVE dans le catalogue du logiciel d'origine
 * (`docs/legacy-index.html` du depot d'API, bloc metier lignes 16481 a 22692),
 * qui est la specification metier du produit. Aucun n'est arrondi, aucun n'est
 * choisi pour la composition.
 *
 * A REVERIFIER quand le catalogue metier bougera, au lot M1 : ces valeurs
 * deviendront alors les cardinalites de vraies tables, et l'API pourra les
 * exposer sur une route publique plutot que de les laisser figees ici.
 */

/** Un chiffre du catalogue, et la constante du legacy qui l'etablit. */
export interface ChiffreCatalogue {
  valeur: number
  libelle: string
  /** La constante du logiciel d'origine dont ce chiffre est le cardinal. */
  source: string
}

export const CHIFFRES_CATALOGUE: readonly ChiffreCatalogue[] = [
  // `PRESTATIONS` — P1 a P19, le bordereau de prix unitaires de reference.
  { valeur: 19, libelle: 'Prestations', source: 'PRESTATIONS' },
  // `TYPE_OFFRE` — logiciel, prorata classique, prorata ameliore, lot 00,
  // lot dechets, grand projet, avenant, ponctuel.
  { valeur: 8, libelle: "Types d'offre", source: 'TYPE_OFFRE' },
  // `CAT_ORDER` — maitre d'ouvrage, AMO, societe de facturation, entreprise de
  // BTP, entreprise de services, fournisseur.
  { valeur: 6, libelle: 'Catégories', source: 'CAT_ORDER' },
]

/**
 * Le titre d'affiche, en trois lignes.
 *
 * `accent` est la partie en ambre. Le decoupage est porte par la donnee et non
 * par du balisage dans le layout : c'est ce qui permet de le traduire ou de le
 * changer sans toucher a la mise en page.
 */
export const TITRE_AFFICHE = {
  debut: 'Dépenses communes,',
  accent: 'compte tenu',
} as const

/**
 * Ce que le produit fait, en une phrase et sans jargon.
 *
 * Elle est verifiable : « base vie, fluides, bennes, gardiennage » sont quatre
 * des dix-neuf prestations du bordereau, et « chiffre avant le premier coup de
 * pelle » decrit le devis previsionnel, qui est bien le point de depart du
 * parcours metier.
 */
export const PHRASE_AFFICHE =
  'Base vie, fluides, bennes, gardiennage. Ce que dix entreprises partagent sur un chantier, chiffré avant le premier coup de pelle.'
