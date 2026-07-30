/**
 * Bloc de marque : la feuille dans son carre vert, puis le nom sur deux lignes.
 *
 * Le trace de la feuille est celui du legacy, ligne 4009 — repris a
 * l'identique, pas redessine. Le logo fourni par le client le confirme : une
 * feuille verte, un nom bleu marine sur deux lignes.
 *
 * Deux tailles seulement, celles de la source : le pave de connexion (46 px de
 * pastille, 20 px de nom — 16002 et 4009) et la barre laterale (34 px de
 * pastille, 17 px de nom — 15979 et 15980). La seconde servira au lot 2.
 */

type Echelle = 'connexion' | 'barre'

const ECHELLES: Record<
  Echelle,
  { pastille: string; feuille: number; nom: string; marque: string }
> = {
  // 16002 : 46 x 46, rayon 12. 4009 : nom a 20 px, `®` a 12 px.
  connexion: { pastille: 'size-46 rounded-12', feuille: 26, nom: 'text-20', marque: 'text-12' },
  // 15979 : 34 x 34, rayon 9. 15980 : nom a 17 px, `®` a 11 px.
  barre: { pastille: 'size-34 rounded-9', feuille: 20, nom: 'text-17', marque: 'text-11' },
}

export interface MarqueProps {
  echelle?: Echelle
}

export function Marque({ echelle = 'connexion' }: MarqueProps) {
  const { pastille, feuille, nom, marque } = ECHELLES[echelle]

  return (
    // 16001 : `.login-brand { display:flex; align-items:center; gap:13px }`
    <div className="flex items-center gap-13">
      <div className={`bg-green grid shrink-0 place-items-center ${pastille}`}>
        <svg
          viewBox="0 0 32 32"
          width={feuille}
          height={feuille}
          fill="#fff"
          aria-hidden="true"
          focusable="false"
        >
          {/* Trace releve ligne 4009. */}
          <path d="M6 26C6 14 14 6 27 5c1 13-7 21-21 21z" />
        </svg>
      </div>

      {/* 4009 : graisse 800, interligne 1.05, nom sur deux lignes. */}
      <div className={`text-navy font-extrabold ${nom} leading-marque`}>
        Chantier
        <br />
        Tranquille
        <span className={`align-super ${marque}`}>®</span>
      </div>
    </div>
  )
}
