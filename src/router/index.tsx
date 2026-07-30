import { Navigate, createBrowserRouter } from 'react-router'

import { AuthLayout } from '@/layouts/AuthLayout'
import { ChoisirMotDePasse } from '@/pages/ChoisirMotDePasse'
import { Connexion } from '@/pages/Connexion'
import { EcranAVenir } from '@/pages/EcranAVenir'
import { Introuvable } from '@/pages/Introuvable'
import { MonCompte } from '@/pages/MonCompte'
import { MotDePasseOublie } from '@/pages/MotDePasseOublie'
import { GardeDeSession } from '@/router/GardeDeSession'

/**
 * Routes de l'application.
 *
 * Deux branches, comme dans `orvea-io/wastern-vue` : les ecrans sans session sous
 * `AuthLayout`, les ecrans avec session derriere `GardeDeSession` — qui rend le
 * shell, barre laterale comprise.
 *
 * LES DEUX CHEMINS PORTEURS DE JETON NE SONT PAS NEGOCIABLES. Ils sont ecrits
 * dans le courriel que l'API envoie — `MotifDeJeton::segmentDeLien()` construit
 * `<frontend>/invitation/<jeton>` et `<frontend>/reinitialisation/<jeton>`. Les
 * renommer casserait tous les liens deja partis, y compris les invitations
 * valables sept jours.
 *
 * LES CINQ `EcranAVenir` DOIVENT AVOIR DISPARU A LA FIN DU LOT S0-B. Ce sont les
 * taches 3 a 5 du plan, et chacune remplace le sien. Ils existent pour que la
 * barre laterale soit traversable : avec des entrees qui menent a une page
 * introuvable, ni la route active, ni le comportement du bandeau d'emprunt d'un
 * ecran a l'autre ne se verifient.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/connexion', element: <Connexion /> },
      { path: '/mot-de-passe-oublie', element: <MotDePasseOublie /> },
      // Le meme ecran, le meme appel : seul le texte change.
      { path: '/invitation/:jeton', element: <ChoisirMotDePasse motif="invitation" /> },
      {
        path: '/reinitialisation/:jeton',
        element: <ChoisirMotDePasse motif="reinitialisation" />,
      },
    ],
  },
  {
    element: <GardeDeSession />,
    children: [
      // La racine mene a l'annuaire des entreprises, premiere entree de la barre
      // laterale. Elle menera au tableau de bord quand M1 l'apportera : c'est la
      // premiere entree du menu du logiciel d'origine.
      { index: true, element: <Navigate to="/entreprises" replace /> },

      {
        path: '/entreprises',
        element: (
          <EcranAVenir
            titre="Entreprises"
            tache={3}
            objet="L'annuaire des entreprises : la liste, les filtres par catégorie, la fiche, et l'attribution du numéro d'adhérent."
          />
        ),
      },
      {
        path: '/contacts',
        element: (
          <EcranAVenir
            titre="Contacts"
            tache={4}
            objet="Les contacts et le carnet d'adresses : la liste, la création, et le retrait du carnet."
          />
        ),
      },
      {
        path: '/mon-entreprise',
        element: (
          <EcranAVenir
            titre="Mon entreprise"
            tache={3}
            objet="La fiche de votre entreprise et ses mentions légales — et, pour un super-administrateur, la liste des adhérents de la plateforme."
          />
        ),
      },
      {
        path: '/comptes',
        element: (
          <EcranAVenir
            titre="Utilisateurs"
            tache={5}
            objet="L'annuaire des comptes de votre organisation : invitation, archivage, réactivation."
          />
        ),
      },
      {
        path: '/droits',
        element: (
          <EcranAVenir
            titre="Grille des droits"
            tache={5}
            objet="Les six facultés que la grille sait retirer, profil par profil. Réglable par le super-administrateur seul."
          />
        ),
      },

      { path: '/mon-compte', element: <MonCompte /> },

      // Toute autre adresse passe par la garde, donc retombe sur la connexion si
      // la session manque. Avec une session, elle atterrit ici — DANS le shell,
      // barre laterale comprise : une adresse fautive ne doit pas priver de
      // navigation.
      { path: '*', element: <Introuvable /> },
    ],
  },
])
