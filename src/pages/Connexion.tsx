import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'
import { z } from 'zod'

import { useConnexion, useSession } from '@/api/auth'
import { Bouton } from '@/components/ui/Bouton'
import { Champ } from '@/components/ui/Champ'
import { Marque } from '@/components/ui/Marque'
import { ApiError, ReseauError, SessionError } from '@/lib/http'

/**
 * Ecran de connexion.
 *
 * La geometrie est celle du legacy, lignes 15999-16003 pour le pave et 4009 a
 * 4046 pour son contenu. Le pave fait 382 px de large et 34 px sur 32 px de
 * rembourrage ; le titre est a 20 px et non a 32. Rien n'y est plus aere que
 * dans la source.
 *
 * MOUVEMENT. Cet ecran est vu une fois par jour : une entree discrete est le
 * seul endroit du lot ou une animation se justifie. Elle part de `scale(0.98)`
 * et `opacity:0` — jamais de `scale(0)`, rien n'apparait de rien — sur 200 ms
 * en `ease-out`. Sous `prefers-reduced-motion`, le deplacement et l'echelle
 * tombent, le fondu reste.
 *
 * Le message d'erreur, lui, n'est PAS anime : il doit se lire tout de suite.
 */

/**
 * Le schema ne verifie que la PRESENCE et la forme de l'adresse.
 *
 * Les libelles sont ceux que l'API rend elle-meme pour les memes cas — verifies
 * contre `POST /api/v1/login` — et non une reformulation. Aucun message metier
 * n'est ecrit ici : « E-mail ou mot de passe incorrect. », « Compte archive »,
 * « Trop de tentatives » viennent de l'API et d'elle seule.
 */
const schema = z.object({
  // `min(1)` puis `pipe(z.email())` : l'ordre compte, sans quoi un champ vide
  // rendrait « adresse invalide » au lieu de « champ obligatoire ».
  email: z
    .string()
    .min(1, 'Le champ adresse e-mail est obligatoire.')
    .pipe(z.email('Le champ adresse e-mail doit être une adresse e-mail valide.')),
  password: z.string().min(1, 'Le champ mot de passe est obligatoire.'),
})

type Formulaire = z.infer<typeof schema>

/**
 * Indication de bas de pave, 16003.
 *
 * Le legacy y affichait le compte de demonstration et son mot de passe, en dur
 * dans la source. C'est l'une des raisons pour lesquelles ce produit est
 * reecrit : le contenu vient donc d'une variable d'environnement, absente du
 * depot et vide en production, ou le bloc disparait entierement.
 */
const INDICATION = import.meta.env.VITE_INDICATION_CONNEXION

export function Connexion() {
  const session = useSession()
  const connexion = useConnexion()
  const emplacement = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  // Deja connecte : on ne repropose pas l'ecran. La destination memorisee par la
  // garde a la priorite sur la racine.
  if (session.data != null) {
    const etat = emplacement.state as { origine?: string } | null
    return <Navigate to={etat?.origine ?? '/'} replace />
  }

  const soumettre = handleSubmit((valeurs) => {
    connexion.mutate(valeurs)
  })

  return (
    // 16000 : `.login-card`. Rayon 18 px, ombre `--shadow`, 382 px de large.
    <div
      className={[
        'bg-card w-full max-w-[382px] rounded-18 border border-line px-32 py-34 shadow-card',
        // Entree : 200 ms, `ease-out`, depart a 0.98 et 4 px plus bas.
        'transition-[opacity,transform] duration-200 ease-out',
        'starting:translate-y-4 starting:scale-[0.98] starting:opacity-0',
        'motion-reduce:starting:translate-y-0 motion-reduce:starting:scale-100',
      ].join(' ')}
    >
      <Marque />

      {/* 4009 : titre a 20 px, 20 px au-dessus, 4 px en dessous. */}
      <h1 className="mt-20 mb-4 text-20">Connexion</h1>
      <p className="text-slate mb-18 text-13">Accédez à votre espace de gestion</p>

      {/* `void` explicite : `handleSubmit` rend une promesse, et un gestionnaire
          d'evenement ne l'attend pas. La signaler evite qu'un rejet reste muet. */}
      <form
        onSubmit={(evenement) => {
          void soumettre(evenement)
        }}
        noValidate
      >
        <Champ
          libelle="E-mail"
          type="email"
          placeholder="nom@domaine.fr"
          autoComplete="username"
          autoFocus
          erreur={errors.email?.message}
          {...register('email')}
        />

        <Champ
          libelle="Mot de passe"
          type="password"
          placeholder="Mot de passe"
          autoComplete="current-password"
          erreur={errors.password?.message}
          {...register('password')}
        />

        {/* _hoisted_7, ligne 45-48 : une seule ligne d'erreur, remontee de 6 px
            dans la marge du champ precedent. Elle porte le message de l'API mot
            pour mot. */}
        {connexion.error != null && (
          <p role="alert" className="text-danger -mt-6 mb-12 text-12.5">
            {messageDErreur(connexion.error)}
          </p>
        )}

        {/* 4035-4039 : bouton pleine largeur, rembourrage porte a 12 px. */}
        <Bouton
          type="submit"
          pleineLargeur
          className="py-12"
          disabled={connexion.isPending}
          aria-busy={connexion.isPending}
        >
          {connexion.isPending ? 'Connexion…' : 'Se connecter'}
        </Bouton>
      </form>

      {INDICATION !== undefined && INDICATION !== '' && (
        // 16003 : `.login-hint`
        <div className="bg-bg text-slate mt-16 rounded-9 border border-line px-11 py-9 text-center text-11.5 leading-corps">
          {INDICATION}
        </div>
      )}
    </div>
  )
}

/**
 * Le texte a afficher pour une erreur de connexion.
 *
 * Un 419 n'est PAS un echec d'identifiants — c'est une session non demarree ou
 * un jeton perime. Le client HTTP a deja rejoue la requete une fois ; s'il
 * echoue encore, l'origine appelante n'est pas declaree cote API et le message
 * de l'API le dit. L'afficher tel quel envoie chercher le probleme au bon
 * endroit, la ou « mot de passe incorrect » enverrait au mauvais.
 */
function messageDErreur(erreur: Error): string {
  if (erreur instanceof SessionError) return erreur.message
  if (erreur instanceof ReseauError) return erreur.message
  if (erreur instanceof ApiError) return erreur.message

  return "Une erreur inattendue s'est produite."
}
