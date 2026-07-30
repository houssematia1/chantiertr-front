import { Link } from 'react-router'
import type { ComponentProps } from 'react'

/**
 * Lien de navigation interne.
 *
 * Il porte le vert de la marque, mais dans sa valeur ECRITE : `--green-strong`,
 * 5,16:1 sur `card` et 4,80:1 sur `bg`. `--green` ne vaut que 3,19:1 sur blanc —
 * MASTER § 3 lui reserve les aplats et les glyphes, jamais un texte.
 *
 * Le soulignement est reporte au survol : un texte vert au milieu d'un texte
 * marine est deja une distinction forte, et le survol confirme. Cette distinction
 * n'est pas portee par la couleur SEULE — le libelle dit ou il mene, et le lien
 * reste un `<a>` que toute technologie d'assistance annonce comme tel.
 *
 * AUCUNE ANIMATION au-dela de la couleur. Un lien est traverse des dizaines de
 * fois par jour : MASTER § 5 range les survols dans « reduire au minimum », et
 * une transition de couleur de 150 ms est ce minimum. Le soulignement, lui,
 * apparait sec.
 */
export type LienProps = ComponentProps<typeof Link>

export function Lien({ className = '', ...reste }: LienProps) {
  return (
    <Link
      className={[
        'text-green-strong rounded-4 font-medium hover:underline',
        'transition-[color] duration-150 ease-out',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...reste}
    />
  )
}
