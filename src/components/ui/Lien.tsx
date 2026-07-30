import { Link } from 'react-router'
import type { ComponentProps } from 'react'

/**
 * Lien de navigation interne.
 *
 * Un lien EST une action : il prend donc l'orange de MASTER § 3. Mais un texte
 * de 13 px exige 4,5:1, et `--color-accent` ne vaut que 3,56:1 sur blanc — d'ou
 * `--color-accent-fonce`, 5,18:1 sur `card` et 4,95:1 sur `background`. Le
 * calcul est dans `tokens.css`.
 *
 * Le soulignement n'est pas retire, il est seulement reporte au survol : la
 * couleur seule ne doit pas porter l'information « ceci est cliquable » — c'est
 * l'esprit de MASTER § 7 —, et un texte orange au milieu d'un texte gris ardoise
 * est deja une distinction forte. Au survol, le soulignement confirme.
 *
 * AUCUNE ANIMATION. Un lien est traverse des dizaines de fois par jour :
 * MASTER § 5 range les survols dans « reduire au minimum », et une transition de
 * couleur de 150 ms est le minimum. Le soulignement, lui, apparait sec.
 */
export type LienProps = ComponentProps<typeof Link>

export function Lien({ className = '', ...reste }: LienProps) {
  return (
    <Link
      className={[
        'text-accent-fonce rounded-4 font-medium hover:underline',
        'transition-[color] duration-150 ease-out',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...reste}
    />
  )
}
