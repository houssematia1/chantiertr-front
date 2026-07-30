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
 * l'information, le texte du message la porte aussi.
 *
 * Filet et non ombre, rayon 4 px, aucune animation : un refus doit se lire tout
 * de suite, et 150 ms de fondu sont 150 ms pendant lesquelles il ne se lit pas.
 */

type Ton = 'erreur' | 'succes'

const TONS: Record<Ton, string> = {
  erreur: 'border-destructive text-destructive',
  succes: 'border-success text-success',
}

export interface AlerteProps {
  ton: Ton
  children: ReactNode
}

export function Alerte({ ton, children }: AlerteProps) {
  return (
    <p role="alert" className={`bg-card mb-3 rounded-4 border px-3 py-2 text-13 ${TONS[ton]}`}>
      {children}
    </p>
  )
}
