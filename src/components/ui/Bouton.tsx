import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Bouton du produit.
 *
 * Geometrie relevee dans le legacy, lignes 16016 a 16026 : coins a 10 px,
 * 13,5 px de texte en 600, 10 px sur 17 px de rembourrage. Ce n'est pas un
 * gros bouton — il est fait pour cohabiter avec cinq autres dans une barre
 * d'actions.
 *
 * DEUX CORRECTIONS sur la source. Le legacy ecrit `transition:.15s`, soit
 * `all` : chaque propriete animable travaille, y compris celles qu'on n'a pas
 * voulu animer. Ici les proprietes sont nommees. Et le legacy n'a AUCUN retour
 * de clic ; `scale(0.97)` sur `:active` est ajoute, sans quoi l'interface
 * parait morte sous le doigt.
 */

type Variante = 'primary' | 'navy' | 'ghost' | 'danger'
type Taille = 'md' | 'sm'

/** Les quatre variantes du legacy, 16017 a 16025. */
const VARIANTES: Record<Variante, string> = {
  primary: 'bg-green text-white hover:bg-green-d', // 16017-16018
  navy: 'bg-navy text-white hover:bg-navy-soft', // 16019-16020
  ghost: 'bg-white text-navy border border-line hover:border-slate', // 16021-16022
  danger: 'bg-white text-danger border border-danger-line hover:bg-[#fdf2f2]', // 16024-16025
}

const TAILLES: Record<Taille, string> = {
  md: 'px-17 py-10 text-13.5 rounded-10', // 16016
  sm: 'px-12 py-7 text-12.5 rounded-8', // 16023
}

export interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  taille?: Taille
  /** Occupe toute la largeur disponible et centre son contenu. */
  pleineLargeur?: boolean
  children: ReactNode
}

export function Bouton({
  variante = 'primary',
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
        // 16016 : le bouton est une ligne, il ne se coupe jamais.
        'inline-flex items-center gap-7 font-semibold whitespace-nowrap',
        // Retour de clic. `duration-140` est dans la fourchette 100-160 ms, et
        // les proprietes sont nommees une par une — jamais `all`.
        'transition-[background-color,border-color,transform] duration-140 ease-out',
        'active:scale-[0.97]',
        // 16026 : desactive, il ne repond plus et le dit.
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale-[0.3]',
        'disabled:active:scale-100',
        VARIANTES[variante],
        TAILLES[taille],
        pleineLargeur ? 'w-full justify-center' : '',
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
