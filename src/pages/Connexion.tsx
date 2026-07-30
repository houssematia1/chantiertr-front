import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'
import { z } from 'zod'

import { useConnexion, useSession } from '@/api/auth'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { Champ } from '@/components/ui/Champ'
import { Lien } from '@/components/ui/Lien'
import { PaveAuth } from '@/components/ui/PaveAuth'
import { messageDErreur } from '@/lib/erreurs'

/**
 * Ecran de connexion.
 *
 * Le chrome — pave, marque, titre, entree — est dans `PaveAuth`. Il ne reste ici
 * que le formulaire et la conduite a tenir sur les refus.
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
 * Indication de bas de pave.
 *
 * Le logiciel d'origine y affichait le compte de demonstration et son mot de
 * passe, en dur dans la source. C'est l'une des raisons pour lesquelles ce
 * produit est reecrit : le contenu vient donc d'une variable d'environnement,
 * absente du depot et vide en production, ou le bloc disparait entierement.
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
    <PaveAuth titre="Connexion" sousTitre="Accédez à votre espace de gestion">
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
          autoComplete="current-password"
          erreur={errors.password?.message}
          {...register('password')}
        />

        {connexion.error != null && <Alerte ton="erreur">{messageDErreur(connexion.error)}</Alerte>}

        <Bouton
          type="submit"
          pleineLargeur
          disabled={connexion.isPending}
          aria-busy={connexion.isPending}
        >
          {connexion.isPending ? 'Connexion…' : 'Se connecter'}
        </Bouton>
      </form>

      {/* Le seul chemin vers la reinitialisation. Sans lui, un oubli de mot de
          passe se reglait par un appel a l'administrateur, qui en imposait un
          nouveau — donc le connaissait. */}
      <p className="mt-4 text-13">
        <Lien to="/mot-de-passe-oublie">Mot de passe oublié ?</Lien>
      </p>

      {INDICATION !== undefined && INDICATION !== '' && (
        <p className="text-slate bg-bg border-line mt-5 rounded-4 border px-3 py-2 text-12">
          {INDICATION}
        </p>
      )}
    </PaveAuth>
  )
}
