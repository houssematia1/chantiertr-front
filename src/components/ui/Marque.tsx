/**
 * Bloc de marque : le glyphe dans son carre, puis le nom sur deux lignes.
 *
 * LE TRACE VIENT DU LOGO FOURNI par le client — la lentille inclinee, pointue
 * aux deux bouts, posee a gauche d'un nom sur deux lignes. Il ne vient plus de
 * la feuille du logiciel d'origine, ni le `®` qu'elle portait : le logo n'en a
 * pas, et le plan interdit les marques heritees du legacy.
 *
 * LA COULEUR, ELLE, VIENT DE MASTER. Le logo est marine et vert ; la palette
 * Construction / Architecture ne connait ni l'un ni l'autre, et MASTER § 3
 * reserve l'orange a l'action — un logo n'est pas une action. Le glyphe prend
 * donc `--primary`, le chrome structurant, et le nom `--foreground`. La FORME
 * reste celle du logo, la teinte celle du systeme : c'est le seul arbitrage
 * possible sans introduire deux hexadecimaux hors palette.
 *
 * Le nom est en Fira Code 600 — MASTER § 4 le range dans les titres. Deux
 * lignes avec un interligne de 1.1, comme le logo : 1.5 les separerait.
 */

type Echelle = 'connexion' | 'barre'

const ECHELLES: Record<Echelle, { pastille: string; nom: string }> = {
  // L'ecran sans session : le bloc doit se voir sans etre un titre surdimensionne.
  connexion: { pastille: 'size-10', nom: 'text-20' },
  // Le pied de barre laterale et l'en-tete de 56 px — MASTER § 2.
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
        className={`bg-primary text-on-primary grid shrink-0 place-items-center rounded-4 ${pastille}`}
      >
        {/* La lentille du logo : deux arcs symetriques entre (5,19) et (19,5).
            `currentColor` et non un hexadecimal — la teinte vient du parent. */}
        <svg
          viewBox="0 0 24 24"
          className="size-[62%]"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 19A14 14 0 0 1 19 5A14 14 0 0 1 5 19Z" />
        </svg>
      </div>

      <div className={`text-foreground font-mono leading-marque font-semibold ${nom}`}>
        Chantier
        <br />
        Tranquille
      </div>
    </div>
  )
}
