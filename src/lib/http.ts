/**
 * Client HTTP de l'API Chantier Tranquille.
 *
 * L'authentification est portee par un cookie de session Sanctum, `HttpOnly` et
 * signe par le serveur. AUCUN jeton d'identite ne transite par JavaScript :
 * c'est precisement le modele dont le produit sort — le logiciel d'origine
 * gardait l'identifiant de session en clair dans `localStorage`, et
 * `localStorage.setItem(<cle>, 'u_admin')` suffisait pour devenir
 * super-administrateur.
 *
 * Ce fichier ne connait donc qu'une chose du navigateur : le cookie `XSRF-TOKEN`
 * que Laravel depose EN CLAIR a dessein, pour que le client le recopie dans un
 * en-tete. Il ne prouve pas l'identite, il prouve l'origine de la requete.
 */

/** Racine de l'API. Le port 8000 est celui de `php artisan serve`. */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** Prefixe de version, commun a toutes les routes metier (`routes/api.php`). */
const API_PREFIX = '/api/v1'

/** Les methodes que Laravel soumet a la verification du jeton CSRF. */
const METHODES_ECRITURE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export type Methode = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Erreurs de validation Laravel : un champ, une liste de messages. */
export type ErreursDeChamp = Record<string, string[]>

/**
 * Une reponse d'erreur de l'API.
 *
 * Le message est celui de l'API, DEJA EN FRANCAIS. Il est affiche tel quel :
 * le reecrire cote front creerait une seconde source de verite qui divergerait
 * au premier changement de regle metier.
 */
export class ApiError extends Error {
  readonly status: number
  readonly errors: ErreursDeChamp

  constructor(status: number, message: string, errors: ErreursDeChamp = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  /** Le premier message de l'API pour un champ, s'il y en a un. */
  messageDeChamp(champ: string): string | undefined {
    return this.errors[champ]?.[0]
  }
}

/**
 * L'API n'a pas repondu du tout : coupure reseau, serveur eteint, CORS refuse.
 *
 * Distincte d'`ApiError` parce que la conduite a tenir n'est pas la meme —
 * ici rien n'a ete recu, donc rien de ce que dit l'API n'est disponible.
 */
export class ReseauError extends Error {
  constructor(cause?: unknown) {
    super('Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.')
    this.name = 'ReseauError'
    this.cause = cause
  }
}

/**
 * La session n'a pas pu etre etablie apres une nouvelle tentative.
 *
 * Un 419 signifie « pas de session » ou « jeton CSRF perime » — JAMAIS
 * « identifiants refuses ». La confusion des deux est le piege classique de
 * Sanctum en mode SPA : elle fait afficher « mot de passe incorrect » a
 * quelqu'un qui a tape le bon, et envoie chercher le bug du mauvais cote.
 *
 * Le client amorce la session et rejoue la requete une fois. S'il retombe sur
 * un 419, la cause n'est plus un jeton perime : l'origine appelante n'est pas
 * declaree dans `SANCTUM_STATEFUL_DOMAINS` cote API. Le message de l'API le dit
 * — « le domaine appelant n'est pas declare comme frontend de confiance » — et
 * il est conserve.
 */
export class SessionError extends Error {
  readonly status = 419

  constructor(message: string) {
    super(message)
    this.name = 'SessionError'
  }
}

/**
 * Le jeton CSRF depose par `/sanctum/csrf-cookie`.
 *
 * Lu a CHAQUE requete et jamais mis en cache : la connexion regenere la session
 * — `$request->session()->regenerate()`, `AuthController::login()` — donc le
 * jeton d'avant la connexion est perime juste apres. Un jeton memorise en
 * variable provoquerait un 419 sur la premiere ecriture qui suit la connexion.
 */
function jetonCsrf(): string | null {
  const cookie = document.cookie.split('; ').find((part) => part.startsWith('XSRF-TOKEN='))

  if (cookie === undefined) return null

  return decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
}

/**
 * Amorce la session : depose le cookie de session et le cookie `XSRF-TOKEN`.
 *
 * Appele avant la premiere ecriture, et rejoue apres un 419. La route est hors
 * du prefixe `/api/v1` — elle est servie par Sanctum lui-meme.
 */
export async function amorcerSession(): Promise<void> {
  const reponse = await appelBrut('GET', `${API_URL}/sanctum/csrf-cookie`)

  if (reponse.ok) return

  // L'echec est rendu en `SessionError` et NON en `ApiError`, y compris sur un
  // 500. C'est ce qui tient l'invariant du fichier de bout en bout : rien de ce
  // qui touche a l'etablissement de la session ne peut etre confondu avec un
  // refus d'identifiants. Un `ApiError` ici remonterait avec un statut que
  // l'appelant interpreterait comme un verdict sur le mot de passe.
  const { message } = lireErreur(reponse, await corpsJson(reponse))

  throw new SessionError(
    message === `Le serveur a répondu ${String(reponse.status)}.`
      ? "La session n'a pas pu être initialisée auprès du serveur."
      : message,
  )
}

/** Un `fetch` avec les identifiants de session, sans aucune interpretation. */
async function appelBrut(methode: Methode, url: string, corps?: unknown): Promise<Response> {
  const entetes = new Headers({ Accept: 'application/json' })

  // UN `FormData` NE PORTE PAS `Content-Type`, et il ne faut surtout pas le lui
  // poser. Cet en-tete doit contenir la frontiere de separation des parties —
  // `multipart/form-data; boundary=----WebKitFormBoundary…` — que seul le
  // navigateur connait, puisque c'est lui qui la tire. L'ecrire a la main donne un
  // en-tete sans frontiere, et PHP rend alors un `$_FILES` vide sans erreur : le
  // televersement echoue en silence, et l'API repond « le champ logo est
  // obligatoire » sur une requete qui portait bien le fichier.
  if (corps !== undefined && !(corps instanceof FormData)) {
    entetes.set('Content-Type', 'application/json')
  }

  // `X-Requested-With` fait rendre 401 plutot que 302 vers une page de
  // connexion HTML : Laravel reconnait ainsi une requete AJAX.
  entetes.set('X-Requested-With', 'XMLHttpRequest')

  if (METHODES_ECRITURE.has(methode)) {
    const jeton = jetonCsrf()
    if (jeton !== null) entetes.set('X-XSRF-TOKEN', jeton)
  }

  try {
    return await fetch(url, {
      method: methode,
      headers: entetes,
      // LA LIGNE QUI PORTE TOUT : sans elle le cookie de session ne part pas,
      // et toute requete authentifiee rend 401.
      credentials: 'include',
      ...(corps === undefined
        ? {}
        : { body: corps instanceof FormData ? corps : JSON.stringify(corps) }),
    })
  } catch (cause) {
    throw new ReseauError(cause)
  }
}

/** Le corps JSON de la reponse, ou `null` si elle n'en a pas. */
async function corpsJson(reponse: Response): Promise<unknown> {
  if (reponse.status === 204) return null

  const texte = await reponse.text()
  if (texte === '') return null

  try {
    return JSON.parse(texte) as unknown
  } catch {
    return null
  }
}

/** Extrait `message` et `errors` du corps d'erreur standard de Laravel. */
function lireErreur(
  reponse: Response,
  corps: unknown,
): { message: string; errors: ErreursDeChamp } {
  const defaut = `Le serveur a répondu ${String(reponse.status)}.`

  if (typeof corps !== 'object' || corps === null) {
    return { message: defaut, errors: {} }
  }

  const enveloppe = corps as { message?: unknown; errors?: unknown }

  const message =
    typeof enveloppe.message === 'string' && enveloppe.message !== '' ? enveloppe.message : defaut

  const errors: ErreursDeChamp = {}

  if (typeof enveloppe.errors === 'object' && enveloppe.errors !== null) {
    for (const [champ, valeur] of Object.entries(enveloppe.errors)) {
      if (Array.isArray(valeur)) {
        errors[champ] = valeur.filter((item): item is string => typeof item === 'string')
      }
    }
  }

  return { message, errors }
}

/**
 * Appelle l'API et rend le corps deserialise.
 *
 * Le seul traitement particulier est celui du 419, decrit sur `SessionError`.
 */
async function appeler<T>(methode: Methode, chemin: string, corps?: unknown): Promise<T> {
  const url = `${API_URL}${API_PREFIX}${chemin}`

  // Une ecriture sans jeton CSRF est un 419 garanti. Autant amorcer la session
  // maintenant plutot que de payer un aller-retour pour se le faire dire.
  if (METHODES_ECRITURE.has(methode) && jetonCsrf() === null) {
    await amorcerSession()
  }

  let reponse = await appelBrut(methode, url, corps)

  if (reponse.status === 419) {
    // Session absente ou jeton perime. Les deux se reparent de la meme facon,
    // et une seule fois : si le second essai retombe sur un 419, la cause est
    // structurelle (origine non declaree cote API) et rejouer n'y changerait
    // rien.
    await amorcerSession()
    reponse = await appelBrut(methode, url, corps)

    if (reponse.status === 419) {
      const { message } = lireErreur(reponse, await corpsJson(reponse))
      throw new SessionError(message)
    }
  }

  const charge = await corpsJson(reponse)

  if (!reponse.ok) {
    const { message, errors } = lireErreur(reponse, charge)
    throw new ApiError(reponse.status, message, errors)
  }

  return charge as T
}

/**
 * Reponse d'une API Resource Laravel : la charge utile est sous `data`.
 *
 * @see chantiertr-api/app/Http/Resources/UserResource.php
 */
export interface Enveloppe<T> {
  data: T
}

export const api = {
  get: <T>(chemin: string): Promise<T> => appeler<T>('GET', chemin),
  post: <T>(chemin: string, corps?: unknown): Promise<T> => appeler<T>('POST', chemin, corps ?? {}),
  patch: <T>(chemin: string, corps?: unknown): Promise<T> =>
    appeler<T>('PATCH', chemin, corps ?? {}),
  put: <T>(chemin: string, corps?: unknown): Promise<T> => appeler<T>('PUT', chemin, corps ?? {}),
  delete: <T>(chemin: string): Promise<T> => appeler<T>('DELETE', chemin),

  /**
   * Un POST qui porte un fichier.
   *
   * Il existe a part pour que le type le dise : `post()` accepte `unknown` et
   * serialise en JSON, ce qui transformerait silencieusement un `FormData` en
   * `{}`. Ici la signature n'accepte que `FormData`, et le corps traverse
   * `appelBrut` sans etre serialise.
   */
  postFichier: <T>(chemin: string, corps: FormData): Promise<T> =>
    appeler<T>('POST', chemin, corps),
}
