import { createBrowserRouter } from 'react-router'

import { AuthLayout } from '@/layouts/AuthLayout'
import { Connexion } from '@/pages/Connexion'
import { Profil } from '@/pages/Profil'
import { GardeDeSession } from '@/router/GardeDeSession'

/**
 * Routes de l'application.
 *
 * Deux branches, comme dans `orvea-io/wastern-vue` : les ecrans sans session
 * sous `AuthLayout`, les ecrans avec session derriere `GardeDeSession`.
 *
 * Le lot 2 remplacera `Profil` par `AppLayout` et sa barre laterale filtree par
 * role. La structure est en place ; il n'y a qu'un enfant a substituer.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/connexion', element: <Connexion /> }],
  },
  {
    element: <GardeDeSession />,
    children: [
      { path: '/', element: <Profil /> },
      // Toute autre adresse passe par la garde, donc retombe sur la connexion si
      // la session manque. Un veritable ecran 404 viendra au lot 2, avec le
      // shell qui l'encadre.
      { path: '*', element: <Profil /> },
    ],
  },
])
