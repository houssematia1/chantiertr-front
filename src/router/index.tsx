import { Navigate, createBrowserRouter } from 'react-router'

import { AuthLayout } from '@/layouts/AuthLayout'
import { ChoisirMotDePasse } from '@/pages/ChoisirMotDePasse'
import { Connexion } from '@/pages/Connexion'
import { Contacts } from '@/pages/Contacts'
import { EcranAVenir } from '@/pages/EcranAVenir'
import { Entreprises } from '@/pages/Entreprises'
import { FicheContact } from '@/pages/FicheContact'
import { FicheEntreprise } from '@/pages/FicheEntreprise'
import { Introuvable } from '@/pages/Introuvable'
import { MonCompte } from '@/pages/MonCompte'
import { MonEntreprise } from '@/pages/MonEntreprise'
import { NouveauContact } from '@/pages/NouveauContact'
import { NouvelleEntreprise } from '@/pages/NouvelleEntreprise'
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
 * LES `EcranAVenir` RESTANTS DOIVENT AVOIR DISPARU A LA FIN DU LOT S0-B. Il en
 * reste DEUX — les comptes et la grille des droits, tache 5. Les taches 3 et 4 ont
 * retire les quatre autres.
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

      { path: '/entreprises', element: <Entreprises /> },

      // AVANT `/entreprises/:id`, et l'ordre compte : « nouvelle » serait sinon
      // pris pour un identifiant, et l'API rendrait 404 sur une fiche inexistante.
      { path: '/entreprises/nouvelle', element: <NouvelleEntreprise /> },
      { path: '/entreprises/:id', element: <FicheEntreprise /> },
      { path: '/contacts', element: <Contacts /> },

      // AVANT `/contacts/:id`, sans quoi « nouveau » serait pris pour un identifiant.
      { path: '/contacts/nouveau', element: <NouveauContact /> },
      { path: '/contacts/:id', element: <FicheContact /> },
      { path: '/mon-entreprise', element: <MonEntreprise /> },
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
