import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useDemandeDeLien } from '@/api/motDePasse'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { Champ } from '@/components/ui/Champ'
import { Lien } from '@/components/ui/Lien'
import { EnteteAuth } from '@/components/ui/EnteteAuth'
import { erreurDeChamp, messageDErreur } from '@/lib/erreurs'

/**
 * Mot de passe oublie — la demande du lien.
 *
 * CET ECRAN NE SAIT RIEN, et c'est sa propriete la plus importante. L'API repond
 * la meme chose que l'adresse existe ou non ; le front n'a donc aucun moyen — et
 * aucun droit — de dire « adresse introuvable ». Toute tentative de rendre
 * l'ecran « plus utile » en distinguant les cas rouvrirait l'oracle d'existence
 * que l'API ferme volontairement.
 *
 * Le formulaire DISPARAIT apres l'envoi. Le laisser inviterait a reessayer, et
 * les deux compteurs de tentatives de l'API — par couple adresse + origine, et
 * par origine seule — comptent CHAQUE demande, y compris celles qui aboutissent.
 * Un utilisateur qui clique trois fois se bloquerait lui-meme.
 */

const schema = z.object({
  email: z
    .string()
    .min(1, 'Le champ e-mail est obligatoire.')
    .pipe(z.email('Le champ e-mail doit être une adresse e-mail valide.')),
})

type Formulaire = z.infer<typeof schema>

export function MotDePasseOublie() {
  const demande = useDemandeDeLien()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const soumettre = handleSubmit((valeurs) => {
    demande.mutate(valeurs.email)
  })

  if (demande.data != null) {
    return (
      <>
        <EnteteAuth titre="Lien envoyé" sousTitre="Consultez votre boîte de réception." />

        {/* Le message vient de l'API, mot pour mot : « Si un compte existe pour
            cette adresse, un lien vient d'être envoyé. » Sa formulation
            conditionnelle EST la protection — la reecrire au present la
            supprimerait. */}
        <Alerte ton="succes">{demande.data.message}</Alerte>

        <p className="text-slate mb-4 text-13">
          Le lien est valable une heure et ne peut servir qu&apos;une fois. Pensez à regarder dans
          les indésirables.
        </p>

        <p className="text-13">
          <Lien to="/connexion">Retour à la connexion</Lien>
        </p>
      </>
    )
  }

  return (
    <>
      <EnteteAuth
        titre="Mot de passe oublié"
        sousTitre="Nous vous envoyons un lien pour en choisir un nouveau."
      />

      <form
        onSubmit={(evenement) => {
          void soumettre(evenement)
        }}
        noValidate
      >
        <Champ
          taille="auth"
          libelle="Adresse e-mail"
          type="email"
          placeholder="nom@domaine.fr"
          autoComplete="username"
          autoFocus
          obligatoire
          erreur={errors.email?.message ?? erreurDeChamp(demande.error ?? null, 'email')}
          {...register('email')}
        />

        {/* L'erreur de niveau formulaire ne parait que si l'API n'a rien attache
            au champ — sinon le meme message s'afficherait deux fois. Le cas
            reellement vise est le blocage par tentatives, qui arrive sur `email`
            cote API : il est donc affiche sous le champ. */}
        {demande.error != null && erreurDeChamp(demande.error, 'email') === undefined && (
          <Alerte ton="erreur">{messageDErreur(demande.error)}</Alerte>
        )}

        <Bouton
          type="submit"
          taille="auth"
          pleineLargeur
          disabled={demande.isPending}
          aria-busy={demande.isPending}
        >
          {demande.isPending ? 'Envoi…' : 'Envoyer le lien'}
        </Bouton>
      </form>

      <p className="mt-4 text-13">
        <Lien to="/connexion">Retour à la connexion</Lien>
      </p>
    </>
  )
}
