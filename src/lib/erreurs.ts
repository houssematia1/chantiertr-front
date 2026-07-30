import { ApiError, ReseauError, SessionError } from '@/lib/http'

/**
 * Le texte a afficher pour une erreur remontee par une mutation.
 *
 * UN 419 N'EST PAS UN ECHEC D'IDENTIFIANTS. C'est une session non demarree ou un
 * jeton CSRF perime. Le client HTTP a deja rejoue la requete une fois ; s'il
 * echoue encore, l'origine appelante n'est pas declaree dans
 * `SANCTUM_STATEFUL_DOMAINS` cote API, et le message de l'API le dit — « le
 * domaine appelant n'est pas declare comme frontend de confiance ». L'afficher
 * tel quel envoie chercher le probleme au bon endroit, la ou « mot de passe
 * incorrect » enverrait au mauvais et couterait une demi-journee.
 *
 * Les trois classes d'erreur du client portent DEJA un message francais adapte a
 * leur cause. Cette fonction ne fait donc que le lire : elle n'en reecrit aucun,
 * et le dernier cas ne sert qu'a ce qu'une exception inattendue — un bug du front
 * — ne laisse pas l'ecran muet.
 */
export function messageDErreur(erreur: Error): string {
  if (erreur instanceof SessionError) return erreur.message
  if (erreur instanceof ReseauError) return erreur.message
  if (erreur instanceof ApiError) return erreur.message

  return "Une erreur inattendue s'est produite."
}

/**
 * Le message que l'API attache a un champ, s'il y en a un.
 *
 * Laravel rend ses refus de validation sous `errors.<champ>`. Les afficher SOUS
 * le champ concerne — MASTER § 7 — vaut mieux que de les empiler en tete de
 * formulaire : « le mot de passe doit contenir au moins 12 caracteres » n'a de
 * sens qu'a cote du champ qu'il decrit.
 */
export function erreurDeChamp(erreur: Error | null, champ: string): string | undefined {
  return erreur instanceof ApiError ? erreur.messageDeChamp(champ) : undefined
}
