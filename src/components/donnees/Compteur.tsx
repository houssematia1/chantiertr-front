/**
 * Une carte de comptage — 9rem x 7rem.
 *
 * Les mesures sont celles de l'application Vue de l'equipe, ou la meme carte
 * s'ecrit `wa-w-36 wa-h-28` : 144 x 112 px, blanc, filet, rayon 8 px, gros
 * chiffre en gras et libelle en dessous.
 *
 * LE CHIFFRE EST TABULAIRE. Deux compteurs cote a cote dont l'un passe de 9 a 10
 * decaleraient leur libelle si la chasse ne l'etait pas.
 *
 * `<p>` et non `<h2>` : ce n'est pas un titre de section, c'est une valeur. Un
 * lecteur d'ecran qui liste les titres d'un ecran n'a rien a faire de « 4 ».
 *
 * LE LIBELLE NE S'ACCORDE PAS EN NOMBRE, et c'est deliberé. « 1 Adhérente » au
 * singulier se lisait exactement comme l'etiquette « Adhérente » d'une carte,
 * posee quinze pixels plus bas : deux choses differentes, le meme mot. Le libelle
 * d'un compteur nomme une CATEGORIE, pas un sujet — il reste invariable, comme
 * dans l'application de l'equipe.
 */
export interface CompteurProps {
  nombre: number
  libelle: string
}

export function Compteur({ nombre, libelle }: CompteurProps) {
  return (
    <div className="bg-card border-line flex h-28 w-36 flex-col items-center justify-center gap-2 rounded-8 border p-4">
      <p className="text-navy chiffres text-2xl font-bold">{nombre}</p>
      <p className="text-slate text-center text-13 font-medium">{libelle}</p>
    </div>
  )
}
