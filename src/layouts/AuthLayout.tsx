import { Outlet } from 'react-router'

/**
 * Enveloppe des ecrans sans session : connexion, acceptation d'invitation, mot
 * de passe oublie.
 *
 * La STRUCTURE vient de `orvea-io/wastern-vue`, `src/layouts/AuthLayout.vue` :
 * un unique conteneur qui centre son enfant, et rien d'autre. Leur fichier fait
 * quatre lignes — un `div.auth-wrapper` autour d'un `<slot>`. Le patron est
 * juste et il est repris tel quel ; le style, lui, vient de MASTER.
 *
 * `place-items-center` et non `place-content-start` : c'est le SEUL endroit du
 * produit ou MASTER § 6 tolere du blanc — un ecran sans session n'a rien a
 * afficher d'autre, et centrer un pave de 360 px n'est pas « un vide au centre
 * de l'ecran », c'est la seule mise en page possible. Derriere la garde, la
 * densite reprend.
 *
 * Le rembourrage de 16 px est la marge qui empeche le pave de toucher les bords
 * sur un telephone.
 */
export function AuthLayout() {
  return (
    <div className="bg-bg grid min-h-screen place-items-center p-4">
      <Outlet />
    </div>
  )
}
