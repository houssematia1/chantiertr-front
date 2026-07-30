/**
 * La recherche textuelle des annuaires.
 *
 * ELLE VIT ICI PLUTOT QUE DANS L'ECRAN parce que trois annuaires la partagent —
 * entreprises, contacts, comptes — et que sa partie delicate n'est pas la
 * recherche elle-meme mais la NEUTRALISATION DES ACCENTS. La recopier trois fois
 * garantirait trois comportements differents.
 *
 * ELLE EST COTE FRONT, et c'est le contrat de l'API : aucune de ses routes
 * d'annuaire n'accepte de parametre de recherche, et `index()` ne pagine pas —
 * elle rend la collection entiere. Chercher ici ne coute donc aucune requete. Le
 * jour ou l'API paginera, cette recherche devra remonter chez elle : chercher
 * dans une page, c'est chercher dans le hasard.
 */

/**
 * Minuscules, sans diacritiques.
 *
 * `NFD` decompose « â » en « a » suivi d'un accent combinant, que `\p{M}` retire
 * ensuite. C'est la SEULE facon fiable en JavaScript : il n'existe pas de
 * comparaison insensible aux accents pour une recherche de SOUS-CHAINE.
 * `localeCompare` avec `sensitivity: 'base'` compare des chaines ENTIERES, et
 * `Intl.Collator` n'expose pas d'`includes`.
 *
 * Le besoin est reel et pas theorique : un conducteur de travaux tape « batir »
 * pour trouver « Bâtir Ensemble », et personne ne compose un circonflexe sur le
 * clavier d'un telephone dans un bureau de chantier.
 */
export function sansAccent(valeur: string): string {
  return valeur.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/**
 * Le terme figure-t-il dans l'un de ces champs ?
 *
 * Les valeurs nulles sont ignorees, pas converties en chaine vide : `''` est
 * contenu dans toute chaine, et un champ absent ferait donc correspondre chaque
 * ligne des que le terme serait vide.
 */
export function contient(terme: string, champs: readonly (string | null | undefined)[]): boolean {
  const cherche = sansAccent(terme.trim())

  if (cherche === '') return true

  return champs
    .filter((valeur): valeur is string => valeur != null && valeur !== '')
    .some((valeur) => sansAccent(valeur).includes(cherche))
}

/**
 * Le terme figure-t-il dans ce numero, espaces et separateurs mis a part ?
 *
 * UN SIRET SE LIT « 790 151 831 00092 » ET SE TAPE PARFOIS COLLE. L'API le stocke
 * TEL QUE SAISI — sa regle de validation compte les chiffres, pas la longueur
 * brute — donc la base contient les deux formes, et une recherche litterale n'en
 * trouverait qu'une. Les deux cotes sont donc reduits a leurs chiffres.
 *
 * Vaut aussi pour un IBAN, un telephone, un numero de TVA.
 */
export function contientChiffres(terme: string, numero: string | null | undefined): boolean {
  const cherche = terme.replace(/\D/g, '')

  if (cherche === '') return false
  if (numero == null) return false

  return numero.replace(/\D/g, '').includes(cherche)
}
