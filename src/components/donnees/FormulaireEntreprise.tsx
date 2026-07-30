import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { Entreprise, FormulaireEntreprise as Valeurs } from '@/api/entreprises'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { Champ } from '@/components/ui/Champ'
import { CATEGORIES_CONNUES } from '@/contenu/categories'
import { erreurDeChamp, messageDErreur } from '@/lib/erreurs'

/**
 * La fiche entreprise, en saisie.
 *
 * UN SEUL FORMULAIRE POUR LA CREATION ET LA MODIFICATION. Les vingt champs sont
 * les memes, les regles sont les memes a une exception pres, et deux composants
 * auraient diverge au premier ajout de champ.
 *
 * L'EXCEPTION EST LE SIRET : `required` a la creation, `nullable` ensuite. Ce
 * n'est pas une incoherence de l'API mais une regle metier — une fiche existante
 * saisie avant cette contrainte ne doit pas devenir immodifiable parce qu'il lui
 * manque un SIRET.
 *
 * CE QUI N'EST PAS ICI, ET N'Y SERA PAS : `is_platform`, `default_emetteur`,
 * `numero_adherent`, `annuaire_reference`. Ce sont les quatre decisions de la
 * plateforme — identite de l'editeur, entreprise emettrice des documents,
 * qualite de tenant, et qui voit la fiche. Cote API elles sont hors de
 * `CHAMPS_DE_FORMULAIRE`, donc une charge utile qui les porterait ne les ferait
 * pas entrer. Les absenter ici aussi evite qu'un champ paraisse, soit rempli, et
 * n'ait aucun effet.
 *
 * LES SIX GROUPES suivent l'ordre d'un extrait Kbis : identite, adresse,
 * immatriculation, banque, assurance, representant. Ce n'est pas un rangement
 * esthetique — c'est l'ordre dans lequel quelqu'un recopie un document qu'il a
 * sous les yeux.
 */

/**
 * Le schema ne verifie que ce qui se verifie SANS l'API.
 *
 * Les longueurs sont celles de `CompanyRequest`, a l'identique : les depasser
 * ferait un aller-retour pour un refus previsible. La VALIDITE du SIRET, en
 * revanche, n'est pas reimplementee — l'API a sa propre regle (`regleSiret`), et
 * la dupliquer ici ferait deux verites qui divergeraient.
 */
function schemaPour(creation: boolean) {
  const texte = (max: number) =>
    z
      .string()
      .max(max, `Ce champ ne peut pas dépasser ${String(max)} caractères.`)
      // Un champ vide devient `null` et non `''` : l'API attend `nullable`, et
      // une chaine vide en base est une valeur, pas une absence.
      .transform((valeur) => (valeur.trim() === '' ? null : valeur.trim()))
      .nullable()

  // LE SIRET GARDE LA MEME FORME DANS LES DEUX CAS, et son caractere obligatoire
  // passe par `superRefine`. C'est une contrainte de typage, pas un detour :
  // rendre `siret` tantot `string` tantot `string | null` donnerait DEUX types de
  // schema, donc deux types de formulaire, et `useForm` refuserait le second.
  return z
    .object({
      name: z
        .string()
        .min(1, 'Le champ raison sociale est obligatoire.')
        .max(190, 'Ce champ ne peut pas dépasser 190 caractères.'),
      siret: texte(20),
      legal: texte(190),
      categorie: texte(190),
      forme_juridique: texte(190),
      capital: texte(50),
      siren: texte(20),
      ape: texte(10),
      rcs: texte(190),
      rcs_ville: texte(100),
      adresse: texte(190),
      cp: texte(10),
      ville: texte(100),
      tva: texte(30),
      iban: texte(34),
      bic: texte(11),
      assureur: texte(190),
      couverture_rc: texte(100),
      gerant: texte(190),
      qualite: texte(100),
      tel: texte(30),
    })
    .superRefine((valeurs, contexte) => {
      // `required` a la creation, `nullable` ensuite — c'est la regle de
      // `CompanyRequest`. Elle n'est pas une incoherence : une fiche saisie avant
      // cette contrainte ne doit pas devenir immodifiable faute de SIRET.
      if (creation && valeurs.siret === null) {
        contexte.addIssue({
          code: 'custom',
          path: ['siret'],
          message: 'Le champ SIRET est obligatoire.',
        })
      }
    })
}

/** Ce que le formulaire porte pendant la saisie : vingt chaines. */
type Saisie = z.input<ReturnType<typeof schemaPour>>

/** Ce que le schema rend une fois valide : les vides devenus `null`. */
type Sortie = z.output<ReturnType<typeof schemaPour>>

export interface FormulaireEntrepriseProps {
  /** La fiche a modifier. Absente, le formulaire cree. */
  entreprise?: Entreprise
  enCours: boolean
  erreur: Error | null
  onEnvoyer: (valeurs: Valeurs) => void
  onAnnuler: () => void
  /** Libelle du bouton d'envoi. « Créer la fiche », « Enregistrer ». */
  libelleAction: string
}

export function FormulaireEntreprise({
  entreprise,
  enCours,
  erreur,
  onEnvoyer,
  onAnnuler,
  libelleAction,
}: FormulaireEntrepriseProps) {
  const creation = entreprise === undefined
  const schema = schemaPour(creation)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Saisie, unknown, Sortie>({
    resolver: zodResolver(schema),
    defaultValues: valeursInitiales(entreprise),
  })

  const soumettre = handleSubmit((valeurs) => {
    onEnvoyer(valeurs)
  })

  /** Le message de l'API pour ce champ, ou celui du schema. Jamais les deux. */
  const messagePour = (champ: keyof Valeurs): string | undefined =>
    errors[champ]?.message ?? erreurDeChamp(erreur, champ)

  return (
    <form
      onSubmit={(evenement) => {
        void soumettre(evenement)
      }}
      noValidate
    >
      <div className="flex flex-col gap-3">
        <Groupe titre="Identité">
          <Champ
            libelle="Raison sociale"
            obligatoire
            autoFocus
            erreur={messagePour('name')}
            {...register('name')}
          />
          <Champ
            libelle="Dénomination légale"
            indication="Si elle diffère de la raison sociale."
            erreur={messagePour('legal')}
            {...register('legal')}
          />
          {/*
           * UNE LISTE OUVERTE et non un `<select>`. Le logiciel d'origine
           * construit ses filtres a partir de `CAT_ORDER` mais accepte toute
           * categorie rencontree, et l'API valide `string|max:190` sans
           * `Rule::in`. Un `<select>` ferme rejetterait des valeurs que le
           * serveur accepte ; `list` propose les six connues sans interdire les
           * autres.
           */}
          <Champ
            libelle="Catégorie"
            list="categories-connues"
            erreur={messagePour('categorie')}
            {...register('categorie')}
          />
          <datalist id="categories-connues">
            {CATEGORIES_CONNUES.map((categorie) => (
              <option key={categorie} value={categorie} />
            ))}
          </datalist>
          <Champ
            libelle="Forme juridique"
            placeholder="SAS, SARL, EURL…"
            erreur={messagePour('forme_juridique')}
            {...register('forme_juridique')}
          />
          {/* `tel` et non `text` : sur mobile, le clavier numerique s'ouvre. */}
          <Champ
            libelle="Téléphone"
            type="tel"
            inputMode="tel"
            numerique
            placeholder="04 67 12 34 56"
            erreur={messagePour('tel')}
            {...register('tel')}
          />
        </Groupe>

        <Groupe titre="Immatriculation">
          <Champ libelle="SIREN" numerique erreur={messagePour('siren')} {...register('siren')} />
          <Champ
            libelle="SIRET"
            numerique
            obligatoire={creation}
            indication={creation ? undefined : 'Non modifiable si déjà vide.'}
            erreur={messagePour('siret')}
            {...register('siret')}
          />
          <Champ libelle="Code APE" erreur={messagePour('ape')} {...register('ape')} />
          <Champ libelle="RCS" erreur={messagePour('rcs')} {...register('rcs')} />
          <Champ
            libelle="Ville du RCS"
            erreur={messagePour('rcs_ville')}
            {...register('rcs_ville')}
          />
          <Champ
            libelle="Capital social"
            numerique
            erreur={messagePour('capital')}
            {...register('capital')}
          />
          <Champ libelle="Numéro de TVA" erreur={messagePour('tva')} {...register('tva')} />
        </Groupe>

        <Groupe titre="Adresse">
          <Champ libelle="Adresse" erreur={messagePour('adresse')} {...register('adresse')} />
          <Champ libelle="Code postal" numerique erreur={messagePour('cp')} {...register('cp')} />
          <Champ libelle="Ville" erreur={messagePour('ville')} {...register('ville')} />
        </Groupe>

        <Groupe titre="Coordonnées bancaires">
          <Champ libelle="IBAN" numerique erreur={messagePour('iban')} {...register('iban')} />
          <Champ libelle="BIC" erreur={messagePour('bic')} {...register('bic')} />
        </Groupe>

        <Groupe titre="Assurance">
          <Champ libelle="Assureur" erreur={messagePour('assureur')} {...register('assureur')} />
          <Champ
            libelle="Couverture RC"
            erreur={messagePour('couverture_rc')}
            {...register('couverture_rc')}
          />
        </Groupe>

        <Groupe titre="Représentant">
          <Champ libelle="Gérant" erreur={messagePour('gerant')} {...register('gerant')} />
          <Champ
            libelle="Qualité"
            placeholder="Président, gérant…"
            erreur={messagePour('qualite')}
            {...register('qualite')}
          />
        </Groupe>
      </div>

      {/* Le bandeau de niveau formulaire ne parait que si l'API n'a rien attache
          a un champ — sinon le meme message s'afficherait deux fois. */}
      {erreur != null && !erreurEstAttachee(erreur) && (
        <div className="mt-3">
          <Alerte ton="erreur">{messageDErreur(erreur)}</Alerte>
        </div>
      )}

      {/*
       * `sticky bottom-0` : le formulaire fait vingt champs, et un bouton
       * d'enregistrement qu'il faut aller chercher en bas est un bouton qu'on
       * n'atteint pas depuis le champ qu'on vient de corriger.
       */}
      <div className="bg-bg border-line sticky bottom-0 mt-3 flex items-center gap-2 border-t py-3">
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

/**
 * Un groupe de champs.
 *
 * `<fieldset>` et `<legend>` et non un `<div>` avec un titre : c'est ce qui fait
 * qu'un lecteur d'ecran annonce « Identité » en entrant dans le groupe, et le
 * seul balisage que les technologies d'assistance comprennent comme un
 * regroupement de saisie.
 *
 * Deux colonnes au-dela de 640 px. Vingt champs sur une colonne font un
 * formulaire de deux mille pixels ; sur deux, l'oeil balaye. Au-dela de deux, le
 * regard perd la ligne.
 */
function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <fieldset className="bg-card border-line rounded-6 border p-3">
      <legend className="font-display text-slate px-1 text-12 font-semibold tracking-colonne uppercase">
        {titre}
      </legend>

      <div className="mt-2 grid gap-x-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

/**
 * Les valeurs de depart.
 *
 * `?? ''` sur chaque champ : un `<input>` non controle par `undefined` devient
 * controle a la premiere frappe, et React avertit en console a chaque fois. Une
 * chaine vide est convertie en `null` par le schema au moment de l'envoi.
 */
function valeursInitiales(entreprise?: Entreprise): Saisie {
  const champs = [
    'name',
    'legal',
    'categorie',
    'forme_juridique',
    'capital',
    'siren',
    'siret',
    'ape',
    'rcs',
    'rcs_ville',
    'adresse',
    'cp',
    'ville',
    'tva',
    'iban',
    'bic',
    'assureur',
    'couverture_rc',
    'gerant',
    'qualite',
    'tel',
  ] as const

  return Object.fromEntries(champs.map((champ) => [champ, entreprise?.[champ] ?? ''])) as Saisie
}

/**
 * L'API a-t-elle attache son refus a un champ ?
 *
 * Si oui, le message est deja sous le champ concerne et le bandeau ferait un
 * doublon. Les vingt champs sont interroges, pas seulement `name` : un refus sur
 * le SIRET est le plus probable de tous.
 */
function erreurEstAttachee(erreur: Error): boolean {
  const champs: (keyof Valeurs)[] = [
    'name',
    'legal',
    'categorie',
    'forme_juridique',
    'capital',
    'siren',
    'siret',
    'ape',
    'rcs',
    'rcs_ville',
    'adresse',
    'cp',
    'ville',
    'tva',
    'iban',
    'bic',
    'assureur',
    'couverture_rc',
    'gerant',
    'qualite',
    'tel',
  ]

  return champs.some((champ) => erreurDeChamp(erreur, champ) !== undefined)
}
