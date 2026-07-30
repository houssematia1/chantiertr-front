/**
 * Le logo de Chantier Tranquille.
 *
 * C'EST LE FICHIER OFFICIEL DU CLIENT, pas une reconstitution. Ce composant
 * portait auparavant un trace SVG releve dans le prototype — une feuille dans un
 * carre vert, plus le nom en deux lignes de texte. C'etait une approximation
 * faite avant de disposer de l'asset, et elle est retiree : quarante lignes de
 * SVG qui imitaient un logo valent moins qu'une balise qui l'affiche.
 *
 * DEUX TONS, et ils ne sont pas interchangeables :
 *
 *   `blanc`   le trace inverse, feuille verte conservee. Pour un aplat marine —
 *             le volet d'identite, et plus tard le bandeau de prise de controle.
 *   `couleur` le trace marine et vert. Pour une surface claire — l'en-tete, le
 *             pied de barre laterale, les documents.
 *
 * Les fichiers sont en WebP sans perte et non en PNG : le PNG fourni pesait
 * 258 Ko pour un affichage a 186 px de large, soit 25 fois le necessaire. Sans
 * perte, parce qu'un logo a aplats et bords nets ne supporte pas la compression
 * avec perte — elle salit les contours. 560 px de large, soit 3x l'affichage le
 * plus grand du produit.
 *
 * `width` et `height` sont TOUJOURS servis : sans eux le navigateur ne connait
 * pas le rapport de l'image avant de l'avoir chargee, et la mise en page saute
 * — sur l'ecran de connexion, le titre d'affiche remonterait de 40 px.
 */

/** Le rapport intrinseque du fichier : 560 x 159. */
const RAPPORT = 560 / 159

type Ton = 'blanc' | 'couleur'

const FICHIERS: Record<Ton, string> = {
  blanc: '/logo-blanc.webp',
  couleur: '/logo.webp',
}

export interface MarqueProps {
  ton?: Ton
  /** Largeur d'affichage en pixels. La hauteur en decoule. */
  largeur?: number
  className?: string
}

export function Marque({ ton = 'couleur', largeur = 186, className = '' }: MarqueProps) {
  return (
    <img
      src={FICHIERS[ton]}
      // Le logo EST le nom du produit : il porte donc un texte alternatif, et
      // non `alt=""`. Sur l'ecran de connexion c'est la seule mention du nom.
      alt="Chantier Tranquille"
      width={largeur}
      height={Math.round(largeur / RAPPORT)}
      className={`block h-auto ${className}`}
    />
  )
}
