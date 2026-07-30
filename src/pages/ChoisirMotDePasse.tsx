import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { z } from 'zod'

import { useChoixDeMotDePasse } from '@/api/motDePasse'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { Champ } from '@/components/ui/Champ'
import { Lien } from '@/components/ui/Lien'
import { PaveAuth } from '@/components/ui/PaveAuth'
import { erreurDeChamp, messageDErreur } from '@/lib/erreurs'

/**
 * Choix d'un mot de passe au bout d'un lien a usage unique.
 *
 * UN SEUL ECRAN POUR LES DEUX PARCOURS — acceptation d'une invitation et
 * reinitialisation —, comme il n'y a qu'une route cote API. Ce n'est pas un
 * raccourci : c'est le meme acte, un porteur de lien choisit un mot de passe, et
 * les six refus sont les memes. Deux ecrans auraient eu a les redire, et l'un des
 * deux en aurait oublie un.
 *
 * Le motif ne change QUE le texte. C'est ce que l'API fait de son cote :
 * `MotifDeJeton` ne decide que de la duree de validite et du segment de chemin.
 *
 * LE JETON ARRIVE PAR L'URL et repart dans le CORPS de la requete. L'adresse du
 * courriel est `/invitation/<jeton>` ou `/reinitialisation/<jeton>` — c'est le
 * frontend, il n'a pas de journal d'acces ; l'API, si. Un jeton en segment de
 * chemin cote API y survivrait a son usage unique.
 *
 * @see chantiertr-api/app/Domain/Identity/Enums/MotifDeJeton.php
 */

/** Les deux motifs, avec ce qui differe : trois phrases, et rien d'autre. */
export type Motif = 'invitation' | 'reinitialisation'

const TEXTES: Record<Motif, { titre: string; sousTitre: string; action: string }> = {
  invitation: {
    titre: 'Bienvenue',
    sousTitre: 'Un compte a été ouvert à votre nom. Choisissez votre mot de passe.',
    action: 'Activer mon compte',
  },
  reinitialisation: {
    titre: 'Nouveau mot de passe',
    sousTitre: 'Choisissez le mot de passe qui remplacera le précédent.',
    action: 'Enregistrer',
  },
}

/**
 * Le schema ne verifie que ce qui se verifie SANS l'API : la longueur et
 * l'egalite des deux saisies.
 *
 * Douze caracteres, comme `PasswordResetRequest` cote API. La regle
 * `uncompromised` — absence des bases de fuites — ne peut pas etre verifiee ici
 * et ne l'est pas : c'est l'API qui refuse, et son message est affiche tel quel.
 * Le front ne redit jamais une regle metier qu'il ne peut pas appliquer.
 */
const schema = z
  .object({
    password: z.string().min(12, 'Le mot de passe doit contenir au moins 12 caractères.'),
    password_confirmation: z.string().min(1, 'La confirmation est obligatoire.'),
  })
  .refine((valeurs) => valeurs.password === valeurs.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Les deux mots de passe ne correspondent pas.',
  })

type Formulaire = z.infer<typeof schema>

export interface ChoisirMotDePasseProps {
  motif: Motif
}

export function ChoisirMotDePasse({ motif }: ChoisirMotDePasseProps) {
  // Le segment de l'URL. La route l'exige, il est donc toujours present ; la
  // chaine vide couvre le cas ou l'adresse serait forgee a la main, et l'API la
  // refuse alors comme n'importe quel jeton inconnu.
  const { jeton = '' } = useParams<{ jeton: string }>()
  const choix = useChoixDeMotDePasse()
  const textes = TEXTES[motif]

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', password_confirmation: '' },
  })

  const soumettre = handleSubmit((valeurs) => {
    choix.mutate({ token: jeton, ...valeurs })
  })

  if (choix.data != null) {
    return (
      <PaveAuth titre="C'est fait" sousTitre="Votre mot de passe est enregistré.">
        {/* Message de l'API, mot pour mot : « Mot de passe enregistré. Vous
            pouvez vous connecter. » */}
        <Alerte ton="succes">{choix.data.message}</Alerte>

        {/* Aucune session n'a ete ouverte : l'API a au contraire ferme toutes
            celles du compte. On renvoie donc vers la connexion, on ne route pas
            vers l'application. */}
        <p className="text-13">
          <Lien to="/connexion">Se connecter</Lien>
        </p>
      </PaveAuth>
    )
  }

  // L'API rend UN SEUL message pour ses six refus — jeton inconnu, deja consomme,
  // revoque, perime, adresse changee, compte archive. Le front ne les devine pas :
  // dans les six cas le porteur legitime n'a qu'une chose a faire, demander un
  // nouveau lien, et c'est ce que l'ecran propose.
  const refusDuLien = erreurDeChamp(choix.error ?? null, 'token')

  return (
    <PaveAuth titre={textes.titre} sousTitre={textes.sousTitre}>
      {refusDuLien !== undefined && (
        <>
          <Alerte ton="erreur">{refusDuLien}</Alerte>
          <p className="mb-5 text-13">
            <Lien to="/mot-de-passe-oublie">Demander un nouveau lien</Lien>
          </p>
        </>
      )}

      <form
        onSubmit={(evenement) => {
          void soumettre(evenement)
        }}
        noValidate
      >
        <Champ
          libelle="Mot de passe"
          type="password"
          autoComplete="new-password"
          autoFocus
          obligatoire
          indication="12 caractères minimum."
          erreur={errors.password?.message ?? erreurDeChamp(choix.error ?? null, 'password')}
          {...register('password')}
        />

        <Champ
          libelle="Confirmation du mot de passe"
          type="password"
          autoComplete="new-password"
          obligatoire
          erreur={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />

        {/* Le bandeau de niveau formulaire ne parait que si l'API n'a rien
            attache a un champ — sinon le meme message s'afficherait deux fois. */}
        {choix.error != null &&
          refusDuLien === undefined &&
          erreurDeChamp(choix.error, 'password') === undefined && (
            <Alerte ton="erreur">{messageDErreur(choix.error)}</Alerte>
          )}

        <Bouton type="submit" pleineLargeur disabled={choix.isPending} aria-busy={choix.isPending}>
          {choix.isPending ? 'Enregistrement…' : textes.action}
        </Bouton>
      </form>
    </PaveAuth>
  )
}
