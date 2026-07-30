import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'

/**
 * Champ de saisie avec son libelle.
 *
 * Geometrie relevee dans le legacy, lignes 16073 a 16078 : libelle de 12,5 px
 * en 600 au-dessus, champ a 11 px sur 13 px, coins a 10 px, 16 px sous le
 * bloc. Trois valeurs impaires sur quatre — c'est la densite du produit, et
 * l'arrondir a une grille de 4 px la ferait disparaitre.
 *
 * L'anneau de focus est celui de la source (16077) : la bordure passe au vert
 * et un halo de 3 px l'entoure. Rien n'est anime au-dela de ces deux
 * proprietes, nommees.
 *
 * PAS de bibliotheque de composants ici. Un champ de texte n'est pas un
 * composant difficile : ni piege de focus, ni positionnement flottant, ni
 * navigation au clavier a reinventer. La competence `pick-ui-library` reserve
 * `base-ui` aux dialogues, menus et listes de selection — ce sera le lot 3.
 */
// `ComponentPropsWithRef` et non `InputHTMLAttributes` : `react-hook-form`
// transmet une `ref` par `register()`, et React 19 la passe comme une prop
// ordinaire — encore faut-il qu'elle soit declaree.
export interface ChampProps extends Omit<ComponentPropsWithRef<'input'>, 'id'> {
  libelle: string
  /** Message de l'API ou du schema. Affiche tel quel, jamais reecrit. */
  erreur?: string | undefined
  /** Precision sous le champ, 16078. */
  indication?: ReactNode
  obligatoire?: boolean
}

export function Champ({
  libelle,
  erreur,
  indication,
  obligatoire = false,
  className = '',
  ...reste
}: ChampProps) {
  const id = useId()
  const idErreur = `${id}-erreur`
  const idIndication = `${id}-indication`

  const decrit = [erreur === undefined ? null : idErreur, indication == null ? null : idIndication]
    .filter((valeur): valeur is string => valeur !== null)
    .join(' ')

  return (
    // 16073 : `.field { margin-bottom: 16px }`
    <div className="mb-16">
      {/* 16074 */}
      <label htmlFor={id} className="text-navy-soft mb-6 block text-12.5 font-semibold">
        {libelle}
        {/* 16075 : l'asterisque de champ obligatoire est en rouge. */}
        {obligatoire && <span className="text-danger"> *</span>}
      </label>

      <input
        id={id}
        aria-invalid={erreur === undefined ? undefined : true}
        aria-describedby={decrit === '' ? undefined : decrit}
        className={[
          // 16076
          'text-navy w-full rounded-10 border bg-white px-13 py-11',
          // 16077 : bordure verte et halo de 3 px au focus. Le contour natif est
          // remplace, pas supprime — l'anneau vert est parfaitement visible au
          // clavier.
          'focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-l)] focus:outline-none',
          'transition-[border-color,box-shadow] duration-150 ease-out',
          // Un champ en erreur porte la couleur de l'erreur sur sa bordure.
          erreur === undefined ? 'border-line' : 'border-danger',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...reste}
      />

      {erreur !== undefined && (
        <p id={idErreur} className="text-danger mt-5 text-11">
          {erreur}
        </p>
      )}

      {/* 16078 : `.field .hint` */}
      {indication != null && erreur === undefined && (
        <p id={idIndication} className="text-slate mt-5 text-11">
          {indication}
        </p>
      )}
    </div>
  )
}
