import type { ReactNode } from 'react'

/**
 * Un registre : des couples libelle / valeur, en lignes de 36 px.
 *
 * LE REGISTRE PLUTOT QUE LES TUILES. Le prototype affichait ce genre de donnees
 * en pastilles de 190 px arrangees en grille fluide. Ici ce sont des lignes,
 * libelle a gauche, valeur alignee a DROITE : c'est ce qui fait que deux SIRET,
 * deux codes postaux, deux montants tombent l'un sous l'autre au chiffre pres.
 * MASTER § 4 : « un tableau de budget doit se lire comme un registre, pas comme
 * un tableau web. »
 *
 * IL EST EXTRAIT DE `MonCompte`, ou il vivait en double. Trois ecrans de ce lot
 * l'emploient — mon compte, fiche entreprise, fiche contact — et le quatrieme
 * viendra. Une regle de densite tenue une fois ici vaut mieux que la meme regle
 * recopiee quatre fois.
 *
 * `<dl>` et non un tableau : ce sont des couples, pas des lignes comparables
 * entre elles. Un `<table>` promettrait des colonnes qu'on peut trier et
 * comparer, ce qui n'a aucun sens sur une fiche.
 *
 * AUCUNE TRANSITION sur le survol. MASTER § 5 : une ligne est survolee cent fois
 * par jour, et la liste de rejet du plan nomme « une animation sur un tableau ».
 * Le fond change sec.
 */

export interface LigneDeRegistre {
  cle: string
  /** `null` et `undefined` s'affichent tous deux en tiret. */
  valeur?: string | null
  /**
   * Chiffres tabulaires. A poser sur tout ce qui se compare chiffre a chiffre —
   * SIRET, IBAN, code postal, montant, identifiant.
   */
  numerique?: boolean
  /** Un rendu libre, quand la valeur n'est pas du texte — une pastille d'etat. */
  contenu?: ReactNode
}

export interface RegistreProps {
  titre: string
  lignes: readonly LigneDeRegistre[]
  /**
   * La route de l'API dont ces valeurs viennent.
   *
   * Elle n'est pas decorative : quand une fiche montre une valeur inattendue, la
   * premiere question est « d'ou sort-elle ». L'ecrire ici epargne une fouille
   * dans le code. Elle est en chasse fixe, comme toute chaine technique.
   */
  source?: string
}

export function Registre({ titre, lignes, source }: RegistreProps) {
  return (
    <section className="bg-card border-line mb-3 overflow-hidden rounded-6 border">
      {/* En-tete de panneau a la hauteur d'une ligne de tableau, 36 px. */}
      <div className="border-line bg-bg flex h-9 items-center justify-between gap-3 border-b px-3">
        <h2 className="text-13">{titre}</h2>
        {source !== undefined && <span className="text-slate font-mono text-12">{source}</span>}
      </div>

      <dl>
        {lignes.map((ligne) => (
          <div
            key={ligne.cle}
            className="border-line hover:bg-bg grid min-h-9 grid-cols-[minmax(110px,220px)_1fr] items-center gap-3 border-b px-3 last:border-b-0"
          >
            {/* Libelle de colonne : Barlow Condensed, capitales, interlettrage
                ouvert — MASTER § 4. `--slate` sur `--card` vaut 5,44:1. */}
            <dt className="text-slate font-display tracking-colonne text-12 uppercase">
              {ligne.cle}
            </dt>

            <dd
              className={[
                'min-w-0 break-words',
                ligne.numerique === true ? 'colonne-chiffres' : 'text-right',
                ligne.contenu != null
                  ? ''
                  : ligne.valeur == null || ligne.valeur === ''
                    ? 'text-slate'
                    : 'text-navy',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {ligne.contenu ?? (ligne.valeur == null || ligne.valeur === '' ? '—' : ligne.valeur)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
