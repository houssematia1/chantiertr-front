import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, ReseauError, SessionError, api } from './http'

/**
 * La racine attendue est LUE de l'environnement, comme le fait `http.ts`.
 *
 * Elle y etait ecrite en dur, ce qui faisait echouer trois tests des que
 * `.env.local` pointait ailleurs que sur le port 8000 — l'API de developpement
 * ecoute sur 8010. Un test qui recopie une valeur de configuration ne verifie
 * plus le code, il verifie que les deux copies sont d'accord.
 */
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** Une reponse JSON, comme `fetch` la rendrait. */
function reponse(status: number, corps: unknown): Response {
  return new Response(corps === null ? null : JSON.stringify(corps), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Pose le cookie `XSRF-TOKEN` que Laravel deposerait. */
function poserJeton(valeur: string): void {
  document.cookie = `XSRF-TOKEN=${encodeURIComponent(valeur)}`
}

function effacerJeton(): void {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

describe('client HTTP', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    effacerJeton()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envoie toute requête avec les identifiants de session', async () => {
    fetchMock.mockResolvedValue(reponse(200, { data: { id: '1' } }))

    await api.get('/me')

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API}/api/v1/me`)
    expect(options.credentials).toBe('include')
  })

  it("n'expose aucun jeton d'identité : seul le cookie CSRF est lu", async () => {
    poserJeton('jeton-csrf')
    fetchMock.mockResolvedValue(reponse(200, { data: {} }))

    await api.post('/login', { email: 'a@b.fr', password: 'x' })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const entetes = new Headers(options.headers)
    expect(entetes.get('X-XSRF-TOKEN')).toBe('jeton-csrf')
    // Rien qui ressemble a un porteur de jeton d'identite.
    expect(entetes.get('Authorization')).toBeNull()
  })

  it('appelle /sanctum/csrf-cookie avant la première écriture', async () => {
    fetchMock
      .mockImplementationOnce(() => {
        poserJeton('frais')
        return Promise.resolve(new Response(null, { status: 204 }))
      })
      .mockResolvedValueOnce(reponse(200, { data: {} }))

    await api.post('/login', { email: 'a@b.fr', password: 'x' })

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API}/sanctum/csrf-cookie`)
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${API}/api/v1/login`)
  })

  it("n'amorce pas la session pour une lecture", async () => {
    fetchMock.mockResolvedValue(reponse(200, { data: {} }))

    await api.get('/me')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  describe('419', () => {
    it('rejoue la requête une fois après avoir réamorcé la session', async () => {
      poserJeton('perime')
      fetchMock
        .mockResolvedValueOnce(reponse(419, { message: 'CSRF token mismatch.' }))
        .mockImplementationOnce(() => {
          poserJeton('frais')
          return Promise.resolve(new Response(null, { status: 204 }))
        })
        .mockResolvedValueOnce(reponse(200, { data: { id: '1' } }))

      const resultat = await api.post<{ data: { id: string } }>('/login', {})

      expect(resultat.data.id).toBe('1')
      expect(fetchMock.mock.calls[1]?.[0]).toBe(`${API}/sanctum/csrf-cookie`)
      // Le second essai porte le jeton renouvele, pas l'ancien.
      const [, options] = fetchMock.mock.calls[2] as [string, RequestInit]
      expect(new Headers(options.headers).get('X-XSRF-TOKEN')).toBe('frais')
    })

    it("n'est JAMAIS présenté comme un échec d'identifiants", async () => {
      poserJeton('quelconque')
      const message =
        "Session absente : le domaine appelant n'est pas déclaré comme frontend de confiance."

      fetchMock
        .mockResolvedValueOnce(reponse(419, { message }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(reponse(419, { message }))

      const erreur = await api.post('/login', {}).catch((e: unknown) => e)

      expect(erreur).toBeInstanceOf(SessionError)
      expect(erreur).not.toBeInstanceOf(ApiError)
      expect((erreur as SessionError).status).toBe(419)
      // Le message de l'API est conserve mot pour mot.
      expect((erreur as SessionError).message).toBe(message)
      // requete, amorcage, requete — et on s'arrete.
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('rend une SessionError si /sanctum/csrf-cookie échoue lui-même', async () => {
      poserJeton('quelconque')
      fetchMock
        .mockResolvedValueOnce(reponse(419, { message: 'Session absente.' }))
        .mockResolvedValueOnce(reponse(500, { message: 'Erreur serveur.' }))

      const erreur = await api.post('/login', {}).catch((e: unknown) => e)

      // Un 500 sur l'amorcage reste une erreur de SESSION : le confondre avec
      // un `ApiError` ferait afficher un verdict sur le mot de passe.
      expect(erreur).toBeInstanceOf(SessionError)
      expect(erreur).not.toBeInstanceOf(ApiError)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('erreurs de l’API', () => {
    it('conserve le message français de l’API sans le réécrire', async () => {
      poserJeton('x')
      fetchMock.mockResolvedValue(
        reponse(422, {
          message: 'E-mail ou mot de passe incorrect.',
          errors: { email: ['E-mail ou mot de passe incorrect.'] },
        }),
      )

      const erreur = (await api.post('/login', {}).catch((e: unknown) => e)) as ApiError

      expect(erreur).toBeInstanceOf(ApiError)
      expect(erreur.status).toBe(422)
      expect(erreur.message).toBe('E-mail ou mot de passe incorrect.')
      expect(erreur.messageDeChamp('email')).toBe('E-mail ou mot de passe incorrect.')
      expect(erreur.messageDeChamp('password')).toBeUndefined()
    })

    it('supporte un corps d’erreur vide ou non JSON', async () => {
      fetchMock.mockResolvedValue(new Response('<html>502</html>', { status: 502 }))

      const erreur = (await api.get('/me').catch((e: unknown) => e)) as ApiError

      expect(erreur).toBeInstanceOf(ApiError)
      expect(erreur.message).toBe('Le serveur a répondu 502.')
    })

    it('distingue une API injoignable d’une API qui refuse', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      const erreur = await api.get('/me').catch((e: unknown) => e)

      expect(erreur).toBeInstanceOf(ReseauError)
      expect(erreur).not.toBeInstanceOf(ApiError)
    })

    it('rend null sur un 204 sans corps', async () => {
      poserJeton('x')
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

      await expect(api.delete('/impersonation')).resolves.toBeNull()
    })
  })
})
