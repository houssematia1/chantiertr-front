import { Navigate, Outlet, useLocation } from 'react-router'

import { useSession } from '@/api/auth'

/**
 * Garde de route : au-dela de ce point, il y a forcement une session.
 *
 * L'interface MASQUE, le serveur INTERDIT. Cette garde evite d'afficher un
 * ecran vide a quelqu'un qui n'est pas connecte ; elle ne protege rien. Chaque
 * route de l'API est gardee par `auth:sanctum` et par une policy, et c'est la
 * que se joue le controle d'acces.
 *
 * Aucune animation, aucun indicateur de chargement anime : cette garde se
 * resout a chaque ouverture de l'application, et `GET /me` repond en quelques
 * dizaines de millisecondes. Un rouage qui tourne 40 ms est un clignotement,
 * pas une information.
 */
export function GardeDeSession() {
  const session = useSession()
  const emplacement = useLocation()

  if (session.isPending) {
    // Le fond du produit, et rien de plus : pas de saut de mise en page quand
    // l'ecran arrive.
    return <div className="bg-bg min-h-screen" />
  }

  if (session.data == null) {
    // La destination demandee est memorisee pour y revenir apres la connexion.
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ origine: emplacement.pathname + emplacement.search }}
      />
    )
  }

  return <Outlet />
}
