import { Navigate, createBrowserRouter } from 'react-router'

import { AuthLayout } from '@/layouts/AuthLayout'
import { ChoisirMotDePasse } from '@/pages/ChoisirMotDePasse'
import { Connexion } from '@/pages/Connexion'
import { Comptes } from '@/pages/Comptes'
import { Contacts } from '@/pages/Contacts'
import { Entreprises } from '@/pages/Entreprises'
import { FicheContact } from '@/pages/FicheContact'
import { FicheEntreprise } from '@/pages/FicheEntreprise'
import { GrilleDesDroits } from '@/pages/GrilleDesDroits'
import { Introuvable } from '@/pages/Introuvable'
import { MonCompte } from '@/pages/MonCompte'
import { MonEntreprise } from '@/pages/MonEntreprise'
import { NouveauCompte } from '@/pages/NouveauCompte'
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
 * IL N'Y A PLUS AUCUN `EcranAVenir`. La dette du lot est soldee : les six ecrans
 * de la barre laterale menent tous a un ecran reel. Le composant est retire avec
 * cette tache — le garder pour un usage futur serait garder une facon de livrer
 * un ecran vide.
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
      { path: '/comptes', element: <Comptes /> },
      { path: '/comptes/nouveau', element: <NouveauCompte /> },
      { path: '/droits', element: <GrilleDesDroits /> },

      { path: '/mon-compte', element: <MonCompte /> },

      // Toute autre adresse passe par la garde, donc retombe sur la connexion si
      // la session manque. Avec une session, elle atterrit ici — DANS le shell,
      // barre laterale comprise : une adresse fautive ne doit pas priver de
      // navigation.
      { path: '*', element: <Introuvable /> },
    ],
  },
])
