import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'

import { useSession } from '@/api/auth'
import type { Role } from '@/api/auth'
import { useCreerCompte } from '@/api/comptes'
import { useEntreprises } from '@/api/entreprises'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { Champ } from '@/components/ui/Champ'
import { Selecteur } from '@/components/ui/Selecteur'
import { erreurDeChamp, messageDErreur } from '@/lib/erreurs'

/**
 * L'invitation d'un compte.
 *
 * IL N'Y A PAS DE CHAMP MOT DE PASSE, et c'est une regle de securite, pas une
 * commodite : `password` est declare `prohibited` cote API. C'est la correction de
 * la prise de controle complete trouvee au socle — un administrateur d'entreprise
 * changeait le mot de passe d'un super-administrateur, sans aucune trace au journal
 * puisque le mot de passe en est exclu.
 *
 * Le compte nait donc au statut `invite`, et son titulaire choisit lui-meme son mot
 * de passe par un lien a usage unique. Personne d'autre ne le connait jamais.
 *
 * LES ROLES PROPOSES SONT FILTRES par ce que l'API refuse d'avance : elle interdit
 * de creer un compte d'un privilege superieur au sien — `reglePrivilege` — et
 * reserve `super_admin_membre` a la plateforme. Le reste, notamment
 * `regleEntrepriseDAccueil` qui gouverne le rattachement, reste au serveur : son
 * refus est affiche tel quel.
 */

const schema = z.object({
  company_id: z.string().min(1, 'Le champ entreprise est obligatoire.'),
  prenom: z.string().min(1, 'Le champ prénom est obligatoire.').max(100),
  nom: z.string().min(1, 'Le champ nom est obligatoire.').max(100),
  email: z
    .string()
    .min(1, 'Le champ e-mail est obligatoire.')
    .pipe(z.email('Le champ e-mail doit être une adresse e-mail valide.')),
  role: z.string().min(1, 'Le champ rôle est obligatoire.'),
  tel: z
    .string()
    .max(30)
    .transform((valeur) => (valeur.trim() === '' ? null : valeur.trim()))
    .nullable(),
  poste: z
    .string()
    .max(100)
    .transform((valeur) => (valeur.trim() === '' ? null : valeur.trim()))
    .nullable(),
})

type Saisie = z.input<typeof schema>
type Sortie = z.output<typeof schema>

/**
 * Les roles offerts, du plus faible au plus fort.
 *
 * `superadmin` N'Y EST PAS : l'API refuse qu'un compte cree un privilege egal ou
 * superieur au sien par cette route, et un super-administrateur plateforme se pose
 * autrement. `super_admin_membre` non plus — il est reserve, et l'offrir ne
 * servirait qu'a essuyer un refus.
 */
const ROLES: { valeur: Role; libelle: string }[] = [
  { valeur: 'agent', libelle: 'Agent' },
  { valeur: 'membre', libelle: 'Membre' },
  { valeur: 'superviseur', libelle: 'Superviseur' },
  { valeur: 'admin', libelle: 'Administrateur' },
]

export function NouveauCompte() {
  const navigate = useNavigate()
  const session = useSession()
  const entreprises = useEntreprises()
  const creation = useCreerCompte()

  const moi = session.data?.utilisateur

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Saisie, unknown, Sortie>({
    resolver: zodResolver(schema),
    defaultValues: {
      // L'entreprise du compte courant par defaut : c'est le cas de loin le plus
      // fréquent, et un super-administrateur peut la changer.
      company_id: moi?.company_id ?? '',
      prenom: '',
      nom: '',
      email: '',
      role: 'membre',
      tel: '',
      poste: '',
    },
  })

  const soumettre = handleSubmit((valeurs) => {
    creation.mutate(
      { ...valeurs, role: valeurs.role as Role },
      {
        onSuccess: () => {
          void navigate('/comptes', { replace: true })
        },
      },
    )
  })

  const messagePour = (champ: string): string | undefined =>
    (errors as Record<string, { message?: string } | undefined>)[champ]?.message ??
    erreurDeChamp(creation.error, champ)

  return (
    <>
      <EnteteEcran
        titre="Inviter un compte"
        precision="Le titulaire choisit lui-même son mot de passe par un lien à usage unique."
      />

      <div className="max-w-[900px] p-6">
        <form
          onSubmit={(evenement) => {
            void soumettre(evenement)
          }}
          noValidate
        >
          <fieldset className="bg-card border-line rounded-16 border p-5">
            <legend className="text-navy px-1 text-[1.05rem]">Le compte</legend>

            <div className="mt-3 grid gap-x-4 sm:grid-cols-2">
              <Champ
                libelle="Prénom"
                obligatoire
                autoFocus
                erreur={messagePour('prenom')}
                {...register('prenom')}
              />
              <Champ libelle="Nom" obligatoire erreur={messagePour('nom')} {...register('nom')} />

              <Champ
                libelle="Adresse e-mail"
                type="email"
                inputMode="email"
                obligatoire
                indication="C'est à cette adresse que le lien d'invitation partira."
                erreur={messagePour('email')}
                {...register('email')}
              />
              <Champ
                libelle="Téléphone"
                type="tel"
                inputMode="tel"
                numerique
                erreur={messagePour('tel')}
                {...register('tel')}
              />

              <Champ libelle="Poste" erreur={messagePour('poste')} {...register('poste')} />

              <div className="mb-3">
                <Selecteur
                  libelle="Rôle"
                  value={watch('role')}
                  onChange={(valeur) => {
                    setValue('role', valeur, { shouldValidate: true })
                  }}
                  options={ROLES.map((role) => ({ valeur: role.valeur, libelle: role.libelle }))}
                />
                {messagePour('role') !== undefined && (
                  <p className="text-danger mt-1 text-12">{messagePour('role')}</p>
                )}
              </div>

              <div className="mb-3 sm:col-span-2">
                <Selecteur
                  libelle="Entreprise d'accueil"
                  value={watch('company_id')}
                  onChange={(valeur) => {
                    setValue('company_id', valeur, { shouldValidate: true })
                  }}
                  options={[
                    { valeur: '', libelle: 'Choisir une entreprise…' },
                    ...(entreprises.data ?? []).map((e) => ({ valeur: e.id, libelle: e.name })),
                  ]}
                />
                {messagePour('company_id') !== undefined && (
                  <p className="text-danger mt-1 text-12">{messagePour('company_id')}</p>
                )}
                <p className="text-slate mt-1 text-12">
                  Seule une entreprise adhérente peut héberger un compte.
                </p>
              </div>
            </div>
          </fieldset>

          {creation.error != null && messagePour('email') === undefined && (
            <div className="mt-4">
              <Alerte ton="erreur">{messageDErreur(creation.error)}</Alerte>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Bouton type="submit" disabled={creation.isPending} aria-busy={creation.isPending}>
              {creation.isPending ? 'Envoi…' : "Envoyer l'invitation"}
            </Bouton>
            <Bouton
              variante="neutre"
              disabled={creation.isPending}
              onClick={() => {
                void navigate('/comptes')
              }}
            >
              Annuler
            </Bouton>
          </div>
        </form>
      </div>
    </>
  )
}
