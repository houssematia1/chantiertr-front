import { NavLink } from 'react-router'

import type { ContexteDeSession, Role } from '@/api/auth'
import { useDeconnexion } from '@/api/auth'
import { Marque } from '@/components/ui/Marque'
import { libelleDe, menuPour } from '@/navigation/menu'

/**
 * La barre laterale du shell.
 *
 * LA STRUCTURE VIENT DE `orvea-io/wastern-vue`, `src/layouts/AppLayout.vue` : une
 * colonne fixe, des groupes titres, une entree active explicite, et un menu
 * utilisateur en pied. C'est leur patron ; le style vient de MASTER.
 *
 * 240 px — `--sidebar-width`, MASTER § 2. Ce n'est pas une valeur ronde choisie a
 * l'oeil : c'est la largeur qui laisse « Super-administrateur membre » tenir sur
 * deux lignes dans le pied sans casser un mot.
 *
 * AUCUNE ANIMATION, ET C'EST UNE REGLE, PAS UN OUBLI. MASTER § 5 : ce qui parait
 * plus de cent fois par jour ne s'animera jamais. Une barre laterale est
 * traversee a chaque changement d'ecran ; un survol qui met 150 ms a s'installer
 * rend l'application molle. Seule la COULEUR change, et elle change sec.
 *
 * L'etat actif est porte par DEUX marques et non par la seule couleur — MASTER
 * § 7 : un filet vert a gauche, et un fond. Le vert `--green` y est un aplat et
 * une bordure, jamais un texte : blanc dessus ne vaut que 3,19:1.
 */
export interface BarreLateraleProps {
  contexte: ContexteDeSession
}

export function BarreLaterale({ contexte }: BarreLateraleProps) {
  const role = contexte.utilisateur.role as Role
  const groupes = menuPour(role)

  return (
    <nav
      aria-label="Navigation principale"
      className="bg-card border-line flex w-(--sidebar-width) shrink-0 flex-col border-r"
    >
      {/* L'en-tete de la barre fait la meme hauteur que celui du contenu : les
          deux filets horizontaux se rejoignent, sans marche d'une colonne a
          l'autre. */}
      <div className="border-line flex h-(--header-height) shrink-0 items-center border-b px-3">
        <Marque largeur={124} />
      </div>

      {/* `overflow-y-auto` : sept groupes tiendront mal sur un portable de
          768 px de haut. C'est la liste qui defile, pas la page. */}
      <div className="flex-1 overflow-y-auto py-3">
        {groupes.map((groupe) => (
          <div key={groupe.titre} className="mb-4 last:mb-0">
            <h2 className="text-slate mb-1 px-3 text-12 font-semibold tracking-colonne uppercase">
              {groupe.titre}
            </h2>

            <ul>
              {groupe.entrees.map((entree) => (
                <li key={entree.chemin}>
                  <NavLink to={entree.chemin} className={classesDEntree}>
                    {libelleDe(entree, role)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <PiedDeBarre contexte={contexte} />
    </nav>
  )
}

/**
 * Les classes d'une entree, selon qu'elle est active.
 *
 * `NavLink` sert `isActive` : c'est lui qui compare l'adresse, pas nous. Un
 * `useLocation` suivi d'un `startsWith` se serait trompe sur `/contacts` contre
 * `/contacts-archives`.
 *
 * Le filet vert est un `border-l-2` TOUJOURS present, transparent au repos :
 * sans cela, l'apparition de la bordure decalerait le libelle de 2 px a chaque
 * changement d'ecran.
 */
function classesDEntree({ isActive }: { isActive: boolean }): string {
  return [
    'block border-l-2 py-1.5 pr-3 pl-[calc(0.75rem-2px)] text-14',
    // Pas de transition : MASTER § 5, une entree de navigation ne s'anime pas.
    isActive
      ? 'border-green bg-green-wash text-green-strong font-semibold'
      : 'text-navy border-transparent hover:bg-bg',
  ].join(' ')
}

/**
 * Le pied de la barre : qui est connecte, et par ou l'on sort.
 *
 * L'entreprise y figure sous le nom, et c'est utile au-dela de l'agrement : un
 * super-administrateur qui traverse le cloisonnement doit voir a tout moment
 * dans quel tenant il se trouve. Pendant un emprunt, le bandeau le redit en
 * haut — les deux ne sont pas redondants, ils repondent a deux questions
 * differentes.
 */
function PiedDeBarre({ contexte }: BarreLateraleProps) {
  const deconnexion = useDeconnexion()
  const { utilisateur } = contexte

  return (
    <div className="border-line shrink-0 border-t p-3">
      <p className="text-navy truncate text-13 font-medium">
        {utilisateur.prenom} {utilisateur.nom}
      </p>
      <p className="text-slate truncate text-12">{utilisateur.role_label}</p>

      {utilisateur.company_name != null && utilisateur.company_name !== '' && (
        <p className="text-slate mt-1 truncate text-12">{utilisateur.company_name}</p>
      )}

      {/*
       * La deconnexion est un lien de texte et non un bouton pleine largeur : ce
       * n'est pas l'action principale de l'ecran, et elle est cliquee une fois
       * par jour. Lui donner l'aspect d'un bouton la mettrait au meme rang que
       * « Enregistrer ».
       */}
      <button
        type="button"
        disabled={deconnexion.isPending}
        onClick={() => {
          deconnexion.mutate()
        }}
        className="text-slate hover:text-danger mt-2 text-12 font-medium disabled:opacity-50"
      >
        {deconnexion.isPending ? 'Déconnexion…' : 'Se déconnecter'}
      </button>
    </div>
  )
}
