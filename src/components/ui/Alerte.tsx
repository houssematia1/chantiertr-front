import type { ReactNode } from 'react'

/**
 * Message de niveau formulaire : le refus de l'API, ou sa confirmation.
 *
 * Distinct de l'erreur portee par `Champ`, qui vise UN champ. Celui-ci vise
 * l'operation entiere — « e-mail ou mot de passe incorrect », « lien perime »,
 * « mot de passe enregistre » — et le texte affiche est celui de l'API, mot pour
 * mot. Le reecrire cote front creerait une seconde source de verite qui
 * divergerait au premier changement de regle metier.
 *
 * `role="alert"` et non `aria-live="polite"` : le message parait en reponse a une
 * action que l'utilisateur vient de declencher, il doit etre annonce sans
 * attendre la fin de l'enonce en cours.
 *
 * MASTER § 3 : le rouge et le vert gardent leur sens metier — refuse, valide — et
 * ne servent jamais a decorer. MASTER § 7 : la couleur ne porte pas seule
 * l'information, le texte du message la porte aussi — c'est ce qui dispense
 * d'introduire un jeu d'icones pour un bandeau de deux lignes.
 *
 * Filet et non ombre, rayon 4 px, aucune animation : un refus doit se lire tout
 * de suite, et 150 ms de fondu sont 150 ms pendant lesquelles il ne se lit pas.
 */

type Ton = 'erreur' | 'succes'

/**
 * `--green-strong` et non `--green` : c'est le vert qui s'ECRIT — 5,16:1 sur
 * `card`, 4,60:1 sur `--green-wash`. `--green-wash` est designe par MASTER § 3
 * comme « fond valide, avec texte `--green-strong` dessus » : la confirmation
 * emploie donc exactement ce couple.
 */
const TONS: Record<Ton, string> = {
  erreur: 'bg-card border-danger text-danger',
  succes: 'bg-green-wash border-green-strong text-green-strong',
}

export interface AlerteProps {
  ton: Ton
  children: ReactNode
}

export function Alerte({ ton, children }: AlerteProps) {
  return (
    <p role="alert" className={`mb-3 rounded-4 border px-3 py-2 text-13 ${TONS[ton]}`}>
      {children}
    </p>
  )
}
