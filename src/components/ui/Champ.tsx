import { useId, useState } from 'react'
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
 * LA BORDURE EST `--line-champ` ET NON `--line`. C'est WCAG 1.4.11 : la bordure
 * est la seule chose qui dise ou cliquer, donc elle doit tenir 3:1 contre le
 * fond. `--line`, le filet decoratif, ne vaut que 1,23:1 sur blanc — et la
 * bordure de champ du prototype, `#D5DDE7`, 1,37:1. Les deux echouent en usage
 * identifiant. Voir `tokens.css`, section « Deux filets ».
 *
 * PAS de bibliotheque de composants ici. La competence `pick-ui-library` reserve
 * `base-ui` a ce qui est reellement difficile — dialogues, menus, listes de
 * selection : piege de focus, positionnement flottant, navigation au clavier a
 * reinventer. Un champ de texte n'a rien de tout cela.
 */

/**
 * Deux geometries, et l'ecart n'est pas cosmetique.
 *
 * `auth` est celle de la maquette validee : 56 px de haut, texte de 16 px,
 * libelle en capitales condensees. Elle ne vaut que pour les ecrans sans
 * session, qui n'ont que deux champs a montrer et toute la hauteur pour eux.
 *
 * `md` fait 44 px — la cible tactile minimale de MASTER § 7 — et c'est celle des
 * formulaires de la surface de travail, ou la densite de MASTER § 2 s'applique.
 * Un formulaire d'entreprise a douze champs : a 56 px il ne tiendrait pas.
 */
type Taille = 'auth' | 'md'

const TAILLES: Record<Taille, { conteneur: string; libelle: string; saisie: string }> = {
  auth: {
    conteneur: 'mb-[22px]',
    libelle:
      'font-display text-[11.5px] font-semibold uppercase tracking-etiquette text-slate mb-2',
    saisie: 'h-14 rounded-6 px-4 text-16',
  },
  md: {
    conteneur: 'mb-3',
    libelle: 'text-13 font-medium text-navy-soft mb-1',
    saisie: 'h-11 rounded-4 px-3 text-14',
  },
}

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
  taille?: Taille
  /**
   * Les chiffres passent en chasse tabulaire — MASTER § 4. Un numero de
   * telephone, une reference, un montant se saisissent en tabulaire : les
   * groupes de trois chiffres restent alignes pendant la frappe.
   */
  numerique?: boolean
  /**
   * Ajoute la bascule « afficher / masquer ». N'a de sens que sur un champ de
   * mot de passe.
   *
   * Ce n'est pas un confort : un mot de passe genere, colle depuis un
   * gestionnaire ou dicte au telephone se verifie a l'oeil ou pas du tout. Son
   * absence est l'une des causes des trois echecs consecutifs qui declenchent le
   * blocage temporise cote API.
   */
  revelable?: boolean
}

export function Champ({
  libelle,
  erreur,
  indication,
  obligatoire = false,
  taille = 'md',
  numerique = false,
  revelable = false,
  className = '',
  type = 'text',
  ...reste
}: ChampProps) {
  const id = useId()
  const idErreur = `${id}-erreur`
  const idIndication = `${id}-indication`
  const [revele, setRevele] = useState(false)

  const geometrie = TAILLES[taille]
  const typeEffectif = revelable && revele ? 'text' : type

  const decrit = [erreur === undefined ? null : idErreur, indication == null ? null : idIndication]
    .filter((valeur): valeur is string => valeur !== null)
    .join(' ')

  return (
    <div className={geometrie.conteneur}>
      <label htmlFor={id} className={`block ${geometrie.libelle}`}>
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

      <div className="relative">
        <input
          id={id}
          type={typeEffectif}
          required={obligatoire}
          aria-invalid={erreur === undefined ? undefined : true}
          aria-describedby={decrit === '' ? undefined : decrit}
          className={[
            'text-navy bg-card w-full border-[1.5px]',
            'placeholder:text-slate',
            geometrie.saisie,
            // La bordure passe au vert de la marque au focus, comme dans la
            // maquette. L'ANNEAU, lui, vient de la regle globale
            // `:focus-visible` d'`index.css`. Ce composant n'ecrit JAMAIS
            // `outline-none` : la bordure verte est un renfort, pas un
            // remplacement.
            //
            // La maquette de reference ajoutait en plus un halo vert de 3 px. Il
            // est retire ici : superpose a l'anneau marine global, il faisait
            // deux cercles concentriques de deux couleurs autour d'un meme champ.
            'focus:border-green-strong',
            'hover:border-slate',
            'transition-[border-color] duration-150 ease-out',
            erreur === undefined ? 'border-line-champ' : 'border-danger',
            numerique ? 'chiffres' : '',
            // Place pour la bascule, sans quoi le texte passe dessous.
            revelable ? (taille === 'auth' ? 'pr-13' : 'pr-11') : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...reste}
        />

        {revelable && (
          <button
            type="button"
            // Le nom accessible CHANGE avec l'etat, et il n'y a pas
            // d'`aria-pressed` en plus : les deux ensemble font annoncer l'etat
            // deux fois. C'est le motif que recommande le WAI pour une bascule
            // dont le libelle dit deja ce que l'activation va faire.
            aria-label={revele ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onClick={() => {
              setRevele((etat) => !etat)
            }}
            // LE FOCUS NE BOUGE PAS. La maquette de reference le renvoyait dans
            // le champ ; au clavier, c'est desorientant — on perd le bouton
            // qu'on vient d'actionner et on ne peut plus le rebasculer.
            className={[
              'text-slate hover:text-navy absolute top-0 right-0 grid place-items-center',
              'transition-[color] duration-150 ease-out',
              taille === 'auth' ? 'h-14 w-13' : 'h-11 w-11',
            ].join(' ')}
          >
            <IconeOeil barre={revele} />
          </button>
        )}
      </div>

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

/**
 * L'oeil de la bascule.
 *
 * `barre` le raye quand le mot de passe est visible : le glyphe dit ce que
 * l'activation FERA, comme le nom accessible. Les deux restent d'accord.
 *
 * `aria-hidden` : le bouton porte deja son nom, l'icone n'ajouterait qu'un
 * doublon a l'annonce.
 */
function IconeOeil({ barre }: { barre: boolean }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1.8 12S5.4 5.2 12 5.2 22.2 12 22.2 12 18.6 18.8 12 18.8 1.8 12 1.8 12z" />
      <circle cx="12" cy="12" r="3.1" />
      {barre && <path d="M4 20 20 4" />}
    </svg>
  )
}
