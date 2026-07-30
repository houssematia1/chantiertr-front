/**
 * Les categories d'intervenant.
 *
 * LA LISTE N'EST PAS FERMEE, et c'est fidele au logiciel d'origine. Son
 * `compCats` construit les cartes de filtre a partir de `CAT_ORDER`, mais y
 * AJOUTE toute categorie inconnue rencontree dans les donnees. L'API fait le
 * meme choix : `CompanyRequest` valide `categorie` en `string|max:190`, sans
 * `Rule::in`. Fermer la liste ici rejetterait des fiches que le serveur accepte,
 * et ferait disparaitre du filtre des entreprises pourtant presentes.
 *
 * L'ordre de `CAT_ORDER` est celui du logiciel d'origine : il va du maitre
 * d'ouvrage au fournisseur, soit de haut en bas de la chaine contractuelle. Ce
 * n'est pas l'ordre alphabetique, et ce n'est pas un hasard.
 */

/** `CAT_ORDER`, releve dans le logiciel d'origine. */
export const CATEGORIES_CONNUES: readonly string[] = [
  "Maître d'ouvrage",
  'AMO',
  'Société de facturation',
  'Entreprise de BTP',
  'Entreprise de services',
  'Fournisseur',
]

/**
 * Les categories a proposer en filtre : celles du referentiel, puis celles que
 * les donnees ajoutent.
 *
 * Les connues gardent leur ordre contractuel ; les inconnues suivent, classees
 * alphabetiquement — elles n'ont pas de rang legitime, autant qu'elles soient
 * previsibles.
 */
export function categoriesDisponibles(trouvees: readonly (string | null)[]): string[] {
  const presentes = new Set(
    trouvees.filter((valeur): valeur is string => valeur !== null && valeur !== ''),
  )

  const inconnues = [...presentes]
    .filter((categorie) => !CATEGORIES_CONNUES.includes(categorie))
    .sort((a, b) => a.localeCompare(b, 'fr'))

  // Les connues paraissent MEME SI aucune fiche ne les porte : le filtre dit ce
  // que le referentiel prevoit, et un filtre qui apparait au fil des saisies
  // deplace ses propres boutons sous le curseur.
  return [...CATEGORIES_CONNUES, ...inconnues]
}
