import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Bouton du produit.
 *
 * COULEUR. MASTER § 3 : « l'orange est reserve a l'action, et elle seule. » Il
 * n'y a donc qu'UNE variante orange — `action` —, et un ecran qui en affiche
 * deux se trompe sur l'une des deux. Les autres variantes sont grises ou
 * blanches : elles portent des actions secondaires, qui ne doivent pas se
 * disputer le regard avec la principale.
 *
 * L'orange employe est `--color-accent-fonce` et non `--color-accent`, dont la
 * valeur reste celle de MASTER : blanc sur `#EA580C` vaut 3,56:1, quand un
 * libelle de 13 px exige 4,5:1. Le calcul est dans `tokens.css`.
 *
 * GEOMETRIE. Rayon 4 px — MASTER § 6, « precision, pas douceur ». Aucune ombre :
 * l'elevation est reservee aux modales, un bouton se detache par sa couleur et
 * par son filet.
 *
 * MOUVEMENT. Un seul effet, et il est obligatoire : `scale(0.97)` sur `:active`,
 * 140 ms — MASTER § 5, « sans lui, l'interface parait morte ». Les proprietes
 * animees sont NOMMEES une par une ; `transition: all` ferait travailler celles
 * qu'on n'a pas voulu animer, a commencer par la geometrie.
 */

type Variante = 'action' | 'neutre' | 'destructif'
type Taille = 'md' | 'sm'

const VARIANTES: Record<Variante, string> = {
  // L'action principale. Une par ecran.
  action: 'bg-accent-fonce text-on-accent hover:bg-accent-tres-fonce',
  // Actions secondaires : fond de carte, filet, texte courant.
  neutre: 'bg-card text-foreground border border-border hover:bg-muted',
  // MASTER § 3 : le rouge garde son sens metier. Il ne decore pas un bouton
  // « Annuler » — seulement une action qui detruit ou qui retire.
  destructif: 'bg-card text-destructive border border-destructive hover:bg-muted',
}

/**
 * Deux hauteurs, et leur ecart n'est pas cosmetique.
 *
 * `md` fait 44 px : c'est la cible tactile minimale de MASTER § 7, et c'est la
 * taille des boutons de formulaire — y compris sur les ecrans sans session,
 * ouverts depuis un telephone dans un bureau de chantier.
 *
 * `sm` fait 36 px, soit exactement `--table-row-height` : c'est la taille des
 * boutons qui vivent DANS une barre d'actions ou une ligne de tableau, ou une
 * cible de 44 px casserait la densite que MASTER § 2 exige. 36 px reste tres
 * au-dela du minimum de 24 px de WCAG 2.5.8.
 */
const TAILLES: Record<Taille, string> = {
  md: 'h-11 px-4 text-14 rounded-4',
  sm: 'h-9 px-3 text-13 rounded-4',
}

export interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  taille?: Taille
  /** Occupe toute la largeur disponible et centre son contenu. */
  pleineLargeur?: boolean
  children: ReactNode
}

export function Bouton({
  variante = 'action',
  taille = 'md',
  pleineLargeur = false,
  className = '',
  type = 'button',
  children,
  ...reste
}: BoutonProps) {
  return (
    <button
      type={type}
      className={[
        // Un bouton est une ligne : il ne se coupe jamais.
        'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap',
        // Retour de clic. Trois proprietes nommees, jamais `all`.
        'transition-[background-color,border-color,transform] duration-140 ease-out',
        'active:scale-[0.97]',
        // Desactive, il ne repond plus et le dit. `--secondary` n'apparait que
        // la : WCAG 1.4.3 exempte les composants inactifs du seuil de contraste,
        // et c'est le seul emploi legitime de cette teinte.
        'disabled:border-secondary disabled:cursor-not-allowed disabled:opacity-50',
        'disabled:active:scale-100',
        VARIANTES[variante],
        TAILLES[taille],
        pleineLargeur ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...reste}
    >
      {children}
    </button>
  )
}
