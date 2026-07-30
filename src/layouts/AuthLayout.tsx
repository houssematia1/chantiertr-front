import { Outlet } from 'react-router'

/**
 * Enveloppe des ecrans sans session : connexion, acceptation d'invitation, mot
 * de passe oublie.
 *
 * La STRUCTURE vient de `orvea-io/wastern-vue`, `src/layouts/AuthLayout.vue` :
 * un unique conteneur qui centre son enfant, et rien d'autre. Leur fichier fait
 * quatre lignes — un `div.auth-wrapper` autour d'un `<slot>`. Le patron est
 * juste et il est repris tel quel ; le style, lui, ne vient pas de chez eux.
 *
 * Le style vient du legacy, ligne 15999 :
 *   `.login-screen { min-height:100vh; display:grid; place-items:center;
 *                    background:var(--bg); padding:24px }`
 *
 * Le rembourrage de 24 px n'est pas decoratif : c'est la seule marge qui
 * empeche le pave de toucher les bords sur un petit ecran.
 */
export function AuthLayout() {
  return (
    <div className="bg-bg grid min-h-screen place-items-center p-24">
      <Outlet />
    </div>
  )
}
