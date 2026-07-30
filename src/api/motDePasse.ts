import { useMutation } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'

import { api } from '@/lib/http'

/**
 * Les deux surfaces publiques du socle, avec la connexion.
 *
 * Elles sont publiques par construction : celui qui a oublie son mot de passe ne
 * peut pas s'authentifier, et celui qui accepte une invitation n'a pas encore de
 * compte ouvert.
 *
 * @see chantiertr-api/app/Http/Controllers/Api/PasswordResetController.php
 */

/** La reponse des deux routes : un message, et lui seul. */
interface Message {
  message: string
}

/**
 * Demande d'un lien de reinitialisation.
 *
 * L'API REPOND LA MEME CHOSE DANS TOUS LES CAS — adresse inconnue, compte en
 * attente d'invitation, compte archive, lien effectivement parti. C'est
 * deliberé cote API : distinguer les cas ferait de la route un oracle qui
 * repond « cette personne a un compte », donc « son employeur est client de la
 * plateforme ». Les adresses professionnelles etant devinables, le portefeuille
 * commercial se cartographierait au rythme du reseau.
 *
 * LE FRONT NE DOIT DONC RIEN AJOUTER a cette reponse. Pas de « adresse
 * introuvable », pas de verification prealable, pas de message different selon
 * ce qu'on croit savoir : le message de l'API est affiche tel quel, et c'est
 * tout ce que l'ecran sait.
 */
export function useDemandeDeLien(): UseMutationResult<Message, Error, string> {
  return useMutation({
    mutationFn: (email: string): Promise<Message> => api.post<Message>('/password/forgot', { email }),
  })
}

export interface ChoixDeMotDePasse {
  /**
   * Le jeton du lien, EN CLAIR.
   *
   * Il arrive par l'URL du courriel — `/invitation/<jeton>` ou
   * `/reinitialisation/<jeton>` — et repart dans le CORPS de la requete. Jamais
   * dans l'URL de l'API : un jeton en segment de chemin finirait dans les
   * journaux d'acces du serveur, ou il survivrait a son usage unique.
   */
  token: string
  password: string
  password_confirmation: string
}

/**
 * Choix d'un mot de passe au bout d'un lien.
 *
 * UNE SEULE ROUTE POUR LES DEUX PARCOURS, cote API comme ici : accepter une
 * invitation et reinitialiser un mot de passe sont le meme acte — un porteur de
 * lien choisit un mot de passe —, avec les memes six refus. Le motif du lien ne
 * change que le texte de l'ecran, jamais l'appel.
 *
 * L'API rend UN SEUL message pour les six refus : jeton inconnu, deja consomme,
 * revoque, perime, adresse changee depuis l'emission, compte archive entre-temps.
 * Le front n'a pas a les deviner — dans les six cas, le porteur legitime n'a
 * qu'une chose a faire, demander un nouveau lien, et c'est ce que l'ecran
 * propose.
 *
 * Aucune session n'est ouverte au passage : l'API enregistre le mot de passe et
 * ferme au contraire toutes les sessions du compte. L'ecran renvoie donc vers la
 * connexion, il ne route pas vers l'application.
 */
export function useChoixDeMotDePasse(): UseMutationResult<Message, Error, ChoixDeMotDePasse> {
  return useMutation({
    mutationFn: (choix: ChoixDeMotDePasse): Promise<Message> =>
      api.post<Message>('/password/reset', choix),
  })
}
