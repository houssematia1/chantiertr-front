/**
 * Bloc de marque : la feuille dans son carre vert, puis le nom marine sur deux
 * lignes.
 *
 * LA CHARTE DU PROTOTYPE EST CONSERVEE — MASTER § 3. Le vert `--green` et le
 * marine `--navy` sont l'identite de la marque, et le logo fourni par le client
 * le confirme : une feuille verte, un nom bleu marine sur deux lignes. Le trace
 * de la feuille est celui du prototype, ligne 4009, repris a l'identique et non
 * redessine.
 *
 * TROIS CHOSES CHANGENT, et aucune n'est une couleur :
 *
 *  - `fill="#fff"` devient `currentColor`. Un hexadecimal en dur dans un
 *    composant est le premier critere de rejet du plan.
 *  - le rayon des pastilles passe de 9 et 12 px a 4 px — MASTER § 6 plafonne a
 *    6 px. La charte donne les couleurs, MASTER donne la geometrie.
 *  - le `®` disparait. Le logo fourni ne le porte pas ; il venait du prototype,
 *    et le plan interdit les marques heritees du logiciel d'origine.
 *
 * LE BLANC SUR LE VERT est ici un GLYPHE et non du texte : 3,19:1, au-dela du
 * seuil de 3:1 de MASTER § 7 et sous celui de 4,5:1. C'est pour cela que le jeton
 * s'appelle `--glyphe-sur-green` — l'employer sur un libelle se verrait a la
 * relecture. Le nom, lui, est marine sur la surface claire : 15,77:1.
 *
 * Le nom est en Fira Code 600 — MASTER § 4 le range dans les titres — avec un
 * interligne de 1.1 : 1.5 separerait les deux lignes du bloc.
 */

type Echelle = 'connexion' | 'barre'

const ECHELLES: Record<Echelle, { pastille: string; nom: string }> = {
  // L'ecran sans session : le bloc se voit sans devenir un titre surdimensionne.
  connexion: { pastille: 'size-10', nom: 'text-20' },
  // L'en-tete de 56 px et le pied de barre laterale — MASTER § 2.
  barre: { pastille: 'size-8', nom: 'text-14' },
}

export interface MarqueProps {
  echelle?: Echelle
}

export function Marque({ echelle = 'connexion' }: MarqueProps) {
  const { pastille, nom } = ECHELLES[echelle]

  return (
    <div className="flex items-center gap-2">
      <div
        className={`bg-green text-glyphe-sur-green grid shrink-0 place-items-center rounded-4 ${pastille}`}
      >
        <svg
          viewBox="0 0 32 32"
          className="size-[62%]"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          {/* Trace releve ligne 4009 du prototype. */}
          <path d="M6 26C6 14 14 6 27 5c1 13-7 21-21 21z" />
        </svg>
      </div>

      <div className={`text-navy font-mono leading-marque font-semibold ${nom}`}>
        Chantier
        <br />
        Tranquille
      </div>
    </div>
  )
}
