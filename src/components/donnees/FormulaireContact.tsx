import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { Contact, FormulaireContact as Valeurs } from '@/api/contacts'
import { useEntreprises } from '@/api/entreprises'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { Champ } from '@/components/ui/Champ'
import { Selecteur } from '@/components/ui/Selecteur'
import { erreurDeChamp, messageDErreur } from '@/lib/erreurs'

/**
 * La fiche contact, en saisie.
 *
 * L'EMPLOYEUR EST OBLIGATOIRE, et il est LIBRE : c'est tout l'objet du carnet —
 * enregistrer l'interlocuteur d'un fournisseur ou d'un sous-traitant. Le designer
 * n'ouvre aucun acces a l'entreprise choisie : `company_id` dit qui emploie la
 * personne, pas qui detient la fiche.
 *
 * La liste des employeurs vient de l'annuaire visible depuis le compte, donc de
 * `visiblesDepuis()` cote API. On ne peut rattacher un contact qu'a une entreprise
 * qu'on voit — et c'est le serveur qui en decide, `exists:companies,id` puis les
 * policies.
 *
 * `access_role` N'EST PAS CONTRAINT cote API (`string|max:50`). Un `datalist`
 * propose les trois valeurs du logiciel d'origine sans interdire les autres : un
 * `<select>` ferme rejetterait ce que le serveur accepte.
 */

const ROLES_CONNUS = ['Administrateur', 'Superviseur', 'Agent'] as const

/**
 * Le schema ne verifie que ce qui se verifie SANS l'API.
 *
 * Les longueurs sont celles de `ContactRequest`. La QUALITE a definir un role
 * d'acces, elle, n'est pas reimplementee : `definirAcces` est une ability cote
 * serveur, et la deviner ici donnerait deux verites.
 */
const schema = z.object({
  company_id: z.string().min(1, 'Le champ entreprise est obligatoire.'),
  prenom: z.string().min(1, 'Le champ prénom est obligatoire.').max(100),
  nom: z.string().min(1, 'Le champ nom est obligatoire.').max(100),
  email: z
    .string()
    .max(190)
    .transform((valeur) => (valeur.trim() === '' ? null : valeur.trim()))
    .nullable()
    // `pipe` APRES la transformation : un champ vide devient `null` et ne doit pas
    // etre soumis a la regle d'adresse, sinon « laissez vide » devient impossible.
    .refine((valeur) => valeur === null || /.+@.+\..+/.test(valeur), {
      message: 'Le champ e-mail doit être une adresse e-mail valide.',
    }),
  portable: texte(30),
  poste: texte(100),
  access_role: texte(50),
})

function texte(max: number) {
  return z
    .string()
    .max(max, `Ce champ ne peut pas dépasser ${String(max)} caractères.`)
    .transform((valeur) => (valeur.trim() === '' ? null : valeur.trim()))
    .nullable()
}

type Saisie = z.input<typeof schema>
type Sortie = z.output<typeof schema>

export interface FormulaireContactProps {
  contact?: Contact
  /** L'employeur pre-choisi, quand on cree depuis une fiche entreprise. */
  employeurParDefaut?: string
  enCours: boolean
  erreur: Error | null
  onEnvoyer: (valeurs: Valeurs) => void
  onAnnuler: () => void
  libelleAction: string
}

export function FormulaireContact({
  contact,
  employeurParDefaut,
  enCours,
  erreur,
  onEnvoyer,
  onAnnuler,
  libelleAction,
}: FormulaireContactProps) {
  const entreprises = useEntreprises()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Saisie, unknown, Sortie>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_id: contact?.company_id ?? employeurParDefaut ?? '',
      prenom: contact?.prenom ?? '',
      nom: contact?.nom ?? '',
      email: contact?.email ?? '',
      portable: contact?.portable ?? '',
      poste: contact?.poste ?? '',
      access_role: contact?.access_role ?? '',
    },
  })

  const soumettre = handleSubmit((valeurs) => {
    onEnvoyer(valeurs)
  })

  const messagePour = (champ: keyof Valeurs): string | undefined =>
    errors[champ]?.message ?? erreurDeChamp(erreur, champ)

  return (
    <form
      onSubmit={(evenement) => {
        void soumettre(evenement)
      }}
      noValidate
    >
      <fieldset className="bg-card border-line rounded-16 border p-5">
        <legend className="text-navy px-1 text-[1.05rem]">Identité</legend>

        <div className="mt-3 grid gap-x-4 sm:grid-cols-2">
          <Champ
            libelle="Prénom"
            obligatoire
            autoFocus
            erreur={messagePour('prenom')}
            {...register('prenom')}
          />
          <Champ libelle="Nom" obligatoire erreur={messagePour('nom')} {...register('nom')} />

          <div className="mb-3 sm:col-span-2">
            <Selecteur
              libelle="Entreprise"
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
              L&apos;employeur de la personne. Le désigner n&apos;ouvre aucun accès à cette
              entreprise.
            </p>
          </div>

          <Champ
            libelle="E-mail"
            type="email"
            inputMode="email"
            erreur={messagePour('email')}
            {...register('email')}
          />
          <Champ
            libelle="Téléphone"
            type="tel"
            inputMode="tel"
            numerique
            placeholder="06 12 45 78 90"
            erreur={messagePour('portable')}
            {...register('portable')}
          />
          <Champ
            libelle="Poste"
            placeholder="Conducteur de travaux…"
            erreur={messagePour('poste')}
            {...register('poste')}
          />
          <Champ
            libelle="Rôle d'accès"
            list="roles-acces-connus"
            indication="Laissez vide si la personne n'a pas d'accès à la plateforme."
            erreur={messagePour('access_role')}
            {...register('access_role')}
          />
          <datalist id="roles-acces-connus">
            {ROLES_CONNUS.map((role) => (
              <option key={role} value={role} />
            ))}
          </datalist>
        </div>
      </fieldset>

      {erreur != null && !erreurEstAttachee(erreur) && (
        <div className="mt-4">
          <Alerte ton="erreur">{messageDErreur(erreur)}</Alerte>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Bouton type="submit" disabled={enCours} aria-busy={enCours}>
          {enCours ? 'Enregistrement…' : libelleAction}
        </Bouton>
        <Bouton variante="neutre" onClick={onAnnuler} disabled={enCours}>
          Annuler
        </Bouton>
      </div>
    </form>
  )
}

/** L'API a-t-elle attache son refus a un champ ? Sinon le bandeau ferait un doublon. */
function erreurEstAttachee(erreur: Error): boolean {
  const champs: (keyof Valeurs)[] = [
    'company_id',
    'prenom',
    'nom',
    'email',
    'portable',
    'poste',
    'access_role',
  ]

  return champs.some((champ) => erreurDeChamp(erreur, champ) !== undefined)
}
