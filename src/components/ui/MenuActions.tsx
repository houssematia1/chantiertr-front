import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Le menu d'actions d'une ligne — leur bouton « Réglages ».
 *
 * IL EST ECRIT A LA MAIN ET NON PRIS DANS UNE BIBLIOTHEQUE, et il faut justifier
 * ce choix : la competence `pick-ui-library` reserve `base-ui` a ce qui est
 * reellement difficile, et un menu en fait partie — piege de focus,
 * positionnement flottant, navigation aux fleches. Trois raisons de l'ecrire
 * quand meme :
 *
 * 1. c'est le SEUL menu du lot. Introduire une dependance de composants pour un
 *    usage unique coute plus que les cinquante lignes ci-dessous ;
 * 2. il n'a pas besoin de flotter. Il est ancre a droite de son bouton, dans une
 *    ligne de tableau, et la zone de contenu defile — aucun placement dynamique ;
 * 3. le piege de focus n'a pas lieu d'etre : ce n'est pas une modale. Un menu se
 *    quitte par Echap, par un clic dehors, ou en continuant a tabuler.
 *
 * CE QU'IL TIENT, ET QU'UN `div` CLIQUABLE NE TIENDRAIT PAS :
 *
 * - `aria-expanded` et `aria-haspopup` sur le declencheur, sans quoi un lecteur
 *   d'ecran annonce un bouton ordinaire et n'attend rien ;
 * - `role="menu"` et `role="menuitem"` sur le contenu ;
 * - **Echap ferme et rend le focus au declencheur.** Sans ce retour, le focus
 *   reste sur un element qui vient de disparaitre, et la tabulation repart du
 *   debut du document ;
 * - un clic dehors ferme. `mousedown` et non `click` : un `click` se declenche
 *   apres le `mouseup`, donc apres qu'un autre bouton a deja recu le sien.
 *
 * PAS D'ANIMATION D'OUVERTURE. MASTER § 5 range les menus dans « reduire
 * drastiquement », et celui-ci s'ouvre plusieurs fois par minute quand on
 * administre une liste de comptes.
 *
 * LA FERMETURE PASSE PAR UN CONTEXTE ET NON PAR UN RENDU-FONCTION. La premiere
 * version servait `children(fermer)`, et le compilateur React l'a refusee :
 * « Cannot access refs during render » — une fonction creee au rendu, passee au
 * rendu, et qui lit une `ref`. Le contexte n'est pas un detour pour contourner
 * l'outil : il supprime aussi le `fermer()` que chaque entree devait appeler avant
 * son action, et qu'il suffisait d'oublier une fois pour laisser un menu ouvert
 * derriere une navigation.
 */

/**
 * La fermeture du menu courant.
 *
 * `null` hors d'un menu : une entree rendue ailleurs n'a rien a fermer, et le
 * silence vaut mieux qu'une erreur — le composant reste utilisable seul.
 */
const ContexteDeMenu = createContext<(() => void) | null>(null)
export interface MenuActionsProps {
  /** Le libelle du declencheur. */
  declencheur: string
  /** Ce qui distingue ce menu des autres, pour les technologies d'assistance. */
  pour: string
  children: ReactNode
}

export function MenuActions({ declencheur, pour, children }: MenuActionsProps) {
  const [ouvert, setOuvert] = useState(false)
  const enveloppe = useRef<HTMLDivElement>(null)
  const bouton = useRef<HTMLButtonElement>(null)
  const id = useId()

  /**
   * Ferme, et rend le focus au declencheur.
   *
   * `useCallback` N'EST PAS UNE OPTIMISATION ICI. Cette fonction est passee aux
   * enfants PENDANT le rendu — `children(fermerEtRendreLeFocus)` —, et le
   * compilateur React refuse qu'une fonction creee au rendu lise une `ref` :
   * « Cannot access refs during render ». Memorisee, elle n'est plus une valeur du
   * rendu, et la `ref` n'est lue qu'a l'appel, apres le montage.
   */
  const fermerEtRendreLeFocus = useCallback((): void => {
    setOuvert(false)
    bouton.current?.focus()
  }, [])

  useEffect(() => {
    if (!ouvert) return

    const surClicDehors = (evenement: MouseEvent): void => {
      if (!enveloppe.current?.contains(evenement.target as Node)) setOuvert(false)
    }

    const surTouche = (evenement: KeyboardEvent): void => {
      if (evenement.key === 'Escape') {
        setOuvert(false)
        bouton.current?.focus()
      }
    }

    // `mousedown` et non `click` : un `click` arrive apres le `mouseup`, donc apres
    // qu'un autre bouton de la page a deja recu le sien — le menu se fermerait
    // alors APRES l'action, et un second menu s'ouvrirait dans le meme geste.
    document.addEventListener('mousedown', surClicDehors)
    document.addEventListener('keydown', surTouche)

    return () => {
      document.removeEventListener('mousedown', surClicDehors)
      document.removeEventListener('keydown', surTouche)
    }
  }, [ouvert])

  return (
    <div ref={enveloppe} className="relative">
      <button
        ref={bouton}
        type="button"
        // LE NOM ACCESSIBLE EST POSE, PAS COMPOSE. La premiere version laissait le
        // calcul concatener le texte visible et un complement en `sr-only`, et le
        // resultat perdait l'espace avant le tiret : « Réglages— Thomas Nguyen ».
        // Le texte VISIBLE et le NOM ACCESSIBLE sont deux choses, et seule la
        // seconde se cherche par programme — la laisser au hasard de la
        // concatenation, c'est la laisser au hasard.
        aria-label={`${declencheur} — ${pour}`}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? id : undefined}
        onClick={() => {
          setOuvert((etat) => !etat)
        }}
        className="bg-card text-navy border-line hover:bg-bg inline-flex h-8 items-center gap-2 rounded-8 border px-3 text-13 font-medium"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
        </svg>
        {declencheur}
      </button>

      {ouvert && (
        <div
          id={id}
          role="menu"
          aria-label={`${declencheur} — ${pour}`}
          className="bg-card border-line shadow-calque absolute top-9 right-0 z-20 w-[290px] rounded-8 border p-1.5"
        >
          <ContexteDeMenu.Provider value={fermerEtRendreLeFocus}>
            {children}
          </ContexteDeMenu.Provider>
        </div>
      )}
    </div>
  )
}

/**
 * Une entree de menu.
 *
 * `role="menuitem"` sur un `<button>` : le bouton porte l'activation au clavier et
 * a la souris, le role dit ce que c'est. Un `<a href="#">` aurait ajoute une
 * navigation qui n'existe pas.
 *
 * Le libelle est sur DEUX LIGNES, comme leur menu : un intitule court, puis ce que
 * l'action fait. « Se connecter en tant que » sans « session en lecture seule et
 * tracée » laisserait croire a une prise de controle complete.
 */
export function ItemDeMenu({
  titre,
  detail,
  icone,
  ton = 'neutre',
  desactive = false,
  onClick,
}: {
  titre: string
  detail: string
  icone: ReactNode
  ton?: 'neutre' | 'destructif'
  desactive?: boolean
  onClick: () => void
}) {
  const fermer = useContext(ContexteDeMenu)

  return (
    <button
      type="button"
      role="menuitem"
      disabled={desactive}
      onClick={() => {
        // L'ACTION D'ABORD, LA FERMETURE ENSUITE. L'inverse demonterait le menu —
        // donc ce bouton — avant que son gestionnaire n'ait fini, et une navigation
        // declenchee depuis un element demonte ne part pas toujours.
        onClick()
        fermer?.()
      }}
      className="hover:bg-bg flex w-full items-start gap-2.5 rounded-6 p-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={[
          'grid size-7 shrink-0 place-items-center rounded-6',
          ton === 'destructif'
            ? 'bg-danger/10 text-danger'
            : 'bg-green-strong/10 text-green-strong',
        ].join(' ')}
      >
        {icone}
      </span>

      <span className="min-w-0">
        <span
          className={`block text-13 font-medium ${ton === 'destructif' ? 'text-danger' : 'text-navy'}`}
        >
          {titre}
        </span>
        <span className="text-slate block text-12 leading-snug">{detail}</span>
      </span>
    </button>
  )
}
