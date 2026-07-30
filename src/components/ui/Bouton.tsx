import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { TAILLES, VARIANTES } from '@/components/ui/apparenceDeBouton'
import type { Taille, Variante } from '@/components/ui/apparenceDeBouton'

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
        //
        // LA GRAISSE N'EST PAS ICI mais dans chaque taille. Tailwind ne resout
        // pas les conflits d'utilitaires par l'ordre de la CHAINE de classes,
        // mais par l'ordre du CSS genere : un `font-medium` de base et un
        // `font-bold` de taille se disputeraient la propriete, et le gagnant
        // dependrait de l'ordre interne de Tailwind, pas du notre.
        'inline-flex items-center justify-center gap-2 whitespace-nowrap',
        // Retour de clic. Trois proprietes nommees, jamais `all`.
        'transition-[background-color,border-color,transform] duration-140 ease-out',
        'active:scale-[0.97]',
        // Desactive, il ne repond plus et le dit.
        'disabled:cursor-not-allowed disabled:opacity-50',
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
