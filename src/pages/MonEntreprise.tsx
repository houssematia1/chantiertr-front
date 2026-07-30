import { Navigate } from 'react-router'

import { useSession } from '@/api/auth'
import { AdherentsDeLaPlateforme } from '@/pages/AdherentsDeLaPlateforme'

/**
 * « Mon entreprise » — ou « Mes entreprises » selon le compte.
 *
 * UNE ROUTE, DEUX ECRANS, et c'est le comportement du logiciel d'origine : son
 * menu « Administration » y met « Mes entreprises » pour le super-administrateur
 * et « Mon entreprise » sinon. La barre laterale change deja le libelle ; cette
 * route change le contenu.
 *
 * POUR UN COMPTE ORDINAIRE, C'EST SA PROPRE FICHE, et elle est deja ecrite :
 * `FicheEntreprise` sait tout faire, y compris montrer le bloc « Plateforme » —
 * `CompanyResource` rend `numero_adherent` a l'entreprise elle-meme. On redirige
 * donc vers `/entreprises/<son id>` plutot que de recopier l'ecran. Une
 * redirection est plus honnete qu'un second composant qui divergerait.
 *
 * `replace` : « Mon entreprise » n'est pas une etape d'un parcours, c'est un
 * raccourci. Sans lui, un retour arriere depuis la fiche reviendrait sur la
 * redirection et repartirait aussitot vers la fiche — l'utilisateur se
 * retrouverait bloque.
 */
export function MonEntreprise() {
  const session = useSession()

  if (session.data == null) return null

  const { utilisateur } = session.data

  // Le super-administrateur plateforme n'a pas « une » entreprise a montrer : il
  // a la liste des adherents, et le pouvoir d'en faire entrer.
  if (utilisateur.role === 'superadmin') {
    return <AdherentsDeLaPlateforme />
  }

  // `company_id` est nul pour un compte qui n'est rattache a aucune entreprise.
  // Le cas n'est pas cense se produire — l'API exige un tenant a la creation —
  // mais le type l'autorise, et une redirection vers `/entreprises/null` serait
  // une requete inutile suivie d'un 404.
  if (utilisateur.company_id == null) {
    return <Navigate to="/entreprises" replace />
  }

  return <Navigate to={`/entreprises/${utilisateur.company_id}`} replace />
}
