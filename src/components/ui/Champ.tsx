import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'

/**
 * Champ de saisie avec son libelle.
 *
 * QUATRE EXIGENCES DE MASTER § 7 sont tenues ici, et nulle part ailleurs — ce
 * qui est la raison d'etre du composant :
 *
 *  1. « Libelle visible sur chaque champ — jamais un placeholder seul. » Le
 *     libelle n'est donc PAS optionnel dans le type : un champ sans libelle ne
 *     compile pas.
 *  2. « Erreur affichee SOUS le champ concerne. » Elle porte le message de l'API
 *     ou du schema, mot pour mot.
 *  3. « Zone `aria-live` sur les erreurs de formulaire. » Le conteneur de
 *     l'erreur existe TOUJOURS dans le document, meme vide : une region vivante
 *     inseree en meme temps que son contenu n'est pas annoncee.
 *  4. « Anneau de focus visible. Ne jamais le retirer. » Il vient de la regle
 *     globale `:focus-visible` d'`index.css`. Ce composant ajoute un changement
 *     de bordure ; il ne touche pas a `outline`.
 *
 * MASTER § 4 range les formulaires dans le texte courant : le libelle est en
 * Fira Sans 500, pas en Fira Code. Fira Code est reservee aux titres, aux
 * libelles de COLONNES et aux chiffres.
 *
 * La hauteur est de 44 px — la cible tactile minimale de MASTER § 7. Rayon
 * 4 px, un filet, aucune ombre.
 *
 * PAS de bibliotheque de composants ici. La competence `pick-ui-library` reserve
 * `base-ui` a ce qui est reellement difficile — dialogues, menus, listes de
 * selection : piege de focus, positionnement flottant, navigation au clavier a
 * reinventer. Un champ de texte n'a rien de tout cela.
 */
// `ComponentPropsWithRef` et non `InputHTMLAttributes` : `react-hook-form`
// transmet une `ref` par `register()`, et React 19 la passe comme une prop
// ordinaire — encore faut-il qu'elle soit declaree.
export interface ChampProps extends Omit<ComponentPropsWithRef<'input'>, 'id'> {
  libelle: string
  /** Message de l'API ou du schema. Affiche tel quel, jamais reecrit. */
  erreur?: string | undefined
  /** Precision sous le champ, quand le libelle ne suffit pas. */
  indication?: ReactNode
  obligatoire?: boolean
  /**
   * Les chiffres passent en chasse tabulaire — MASTER § 4. Un numero de
   * telephone, une reference, un montant se saisissent en Fira Code : les
   * groupes de trois chiffres restent alignes pendant la frappe.
   */
  numerique?: boolean
}

export function Champ({
  libelle,
  erreur,
  indication,
  obligatoire = false,
  numerique = false,
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
    <div className="mb-3">
      <label htmlFor={id} className="text-navy-soft mb-1 block text-13 font-medium">
        {libelle}
        {/* MASTER § 7 : la couleur ne porte jamais seule une information —
            l'asterisque est un GLYPHE, et le champ est aussi marque `required`
            pour les technologies d'assistance. */}
        {obligatoire && (
          <span className="text-danger" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>

      <input
        id={id}
        required={obligatoire}
        aria-invalid={erreur === undefined ? undefined : true}
        aria-describedby={decrit === '' ? undefined : decrit}
        className={[
          'text-navy bg-card h-11 w-full rounded-4 border px-3 text-14',
          'placeholder:text-slate',
          // La bordure passe au vert de la marque au focus, comme dans le
          // prototype. `--green` sur `--card` vaut 3,19:1 : au-dela du seuil de
          // 3:1 des elements non textuels, et c'est bien une bordure.
          //
          // L'ANNEAU, lui, vient de la regle globale `:focus-visible`
          // d'`index.css`. Ce composant n'ecrit JAMAIS `outline-none` : la
          // bordure verte est un renfort, pas un remplacement.
          'focus:border-green',
          'transition-[border-color] duration-150 ease-out',
          erreur === undefined ? 'border-line' : 'border-danger',
          numerique ? 'chiffres' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...reste}
      />

      {/* La region vivante est presente meme sans erreur : c'est ce qui fait
          qu'un message insere plus tard est ANNONCE. Vide, un bloc sans contenu
          ne prend aucune hauteur. */}
      <div aria-live="polite">
        {erreur !== undefined && (
          <p id={idErreur} className="text-danger mt-1 text-12">
            {erreur}
          </p>
        )}
      </div>

      {indication != null && erreur === undefined && (
        <p id={idIndication} className="text-slate mt-1 text-12">
          {indication}
        </p>
      )}
    </div>
  )
}
