import { Link } from 'react-router'

import type { Entreprise } from '@/api/entreprises'
import { LogoEntreprise } from '@/components/donnees/LogoEntreprise'

/**
 * Une entreprise, en carte.
 *
 * LA COMPOSITION EST CELLE DE `ClientCard.vue` de l'application Vue de l'equipe,
 * reprise au pixel depuis son SCSS : carte exterieure a 20 px de rayon et 4 px de
 * rembourrage, carte interieure blanche a 16 px et 16 px, `gap: 16px`, logo de
 * 168 x 130 a gauche, nom en titre, adresse a pictogramme, grille
 * « libelle : valeur » sur deux colonnes, puce de categorie en pied, et une
 * colonne de droite pour le numero d'adherent et les actions.
 *
 * IL N'Y A PAS DE BANDEAU COLORE en tete de carte. La premiere version en portait
 * un — « Adhérente », « Annuaire de référence » sur toute la largeur — et le
 * client l'a refuse. La qualification est passee en etiquette a cote du nom, la ou
 * leur application place ses `VTag`, et elle ne perdait rien : la colonne de droite
 * la disait deja.
 *
 * AUCUNE ANIMATION. Une liste d'annuaire est parcourue des dizaines de fois par
 * jour ; leur `.client-item-card` porte une transition d'une seconde sur le fond,
 * et une seconde sur une carte survolee au passage de la souris fait traîner
 * l'interface. C'est le seul endroit ou l'on s'ecarte de leur feuille de style, et
 * c'est deliberé.
 *
 * LA LIGNE N'EST PAS UN LIEN. C'est le nom qui l'est. Rendre toute la carte
 * cliquable par `onClick` la retirerait du parcours au clavier, du menu contextuel
 * et de l'ouverture dans un nouvel onglet — et la carte porte deja des boutons,
 * qu'un clic sur le conteneur avalerait.
 */
export interface CarteEntrepriseProps {
  entreprise: Entreprise
  /** Rendu des actions de la colonne de droite. Absent, la colonne se tait. */
  actions?: React.ReactNode
}

export function CarteEntreprise({ entreprise, actions }: CarteEntrepriseProps) {
  const qualification = qualificationDe(entreprise)

  return (
    <div className="rounded-20 p-1">
      <div className="bg-card border-line flex gap-4 rounded-16 border p-4">
        <LogoEntreprise url={entreprise.logo_url} nom={entreprise.name} />

        {/* `min-w-0` : sans lui, une raison sociale longue pousse la carte au-dela
            de sa colonne au lieu de se couper. */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h5 className="min-w-0 text-[1.05rem] leading-tight">
                <Link
                  to={`/entreprises/${entreprise.id}`}
                  className="text-navy hover:text-green-strong font-semibold"
                >
                  {entreprise.name}
                </Link>
              </h5>

              {qualification !== null && (
                <Etiquette ton={qualification.ton}>{qualification.libelle}</Etiquette>
              )}
            </div>

            {/* La denomination legale ne parait que si elle DIFFERE de la raison
                sociale. Les deux cote a cote, identiques, ne disent rien. */}
            {entreprise.legal != null && entreprise.legal !== entreprise.name && (
              <p className="text-slate mt-px text-12">{entreprise.legal}</p>
            )}

            <Adresse entreprise={entreprise} />

            <div className="mt-2 grid gap-x-6 leading-tight sm:grid-cols-2">
              <Valeur libelle="SIRET" valeur={entreprise.siret} numerique />
              <Valeur libelle="Téléphone" valeur={entreprise.tel} numerique />
              <Valeur libelle="SIREN" valeur={entreprise.siren} numerique />
              <Valeur libelle="TVA" valeur={entreprise.tva} numerique />
              <Valeur libelle="Gérant" valeur={entreprise.gerant} />
              <Valeur libelle="Forme" valeur={entreprise.forme_juridique} />
            </div>
          </div>

          {entreprise.categorie != null && entreprise.categorie !== '' && (
            <div className="flex flex-wrap gap-2">
              <Puce>{entreprise.categorie}</Puce>
            </div>
          )}
        </div>

        {/* La colonne de droite : ce que la plateforme sait, et les actions. Elle
            garde sa largeur meme vide, sinon le bloc central se decale d'une carte
            a l'autre. */}
        <div className="flex w-[132px] shrink-0 flex-col items-end justify-between gap-3 text-right">
          <Plateforme entreprise={entreprise} />
          {actions != null && <div className="flex gap-1.5">{actions}</div>}
        </div>
      </div>
    </div>
  )
}

/**
 * L'adresse, avec son pictogramme.
 *
 * Les trois champs sont joints par un espace et non par des virgules : c'est la
 * forme d'une adresse postale francaise, et c'est ce que leur carte affiche —
 * `{{ client.address }} {{ client.postal_code }} {{ client.city }}`.
 *
 * La ligne DISPARAIT entierement si les trois sont vides. Un pictogramme de
 * localisation suivi de rien laisse chercher une adresse qui n'existe pas.
 */
function Adresse({ entreprise }: { entreprise: Entreprise }) {
  const morceaux = [entreprise.adresse, entreprise.cp, entreprise.ville].filter(
    (valeur): valeur is string => valeur != null && valeur !== '',
  )

  if (morceaux.length === 0) return null

  return (
    <p className="text-slate mt-0.5 flex items-center gap-1">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
        className="size-3.5 shrink-0"
      >
        <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
      {morceaux.join(' ')}
    </p>
  )
}

/**
 * Un couple « libelle : valeur ».
 *
 * IL DISPARAIT QUAND LA VALEUR MANQUE, et c'est l'inverse du choix fait sur la
 * fiche : un registre affiche « — » parce qu'il inventorie des champs, une carte
 * affiche ce qu'elle sait. Six lignes de tirets dans une liste d'annuaire
 * n'apprennent rien et occupent la place de ce qui est renseigne.
 *
 * `numerique` passe la valeur en chasse tabulaire : deux SIRET l'un sous l'autre
 * se comparent alors chiffre a chiffre.
 */
function Valeur({
  libelle,
  valeur,
  numerique = false,
}: {
  libelle: string
  valeur: string | null | undefined
  numerique?: boolean
}) {
  if (valeur == null || valeur === '') return null

  return (
    <p className="truncate">
      <span className="text-navy font-medium">{libelle} :</span>{' '}
      <span className={numerique ? 'chiffres' : ''}>{valeur}</span>
    </p>
  )
}

/**
 * La puce de categorie.
 *
 * `rounded-34` — un demi-cercle, la mesure de leur `.client-dumpster-chips`. Le
 * fond est `--line` et non leur `#DBDBDB` : le gris neutre jurerait avec le
 * bleu-gris de la palette, et `--line` est deja le gris de cette palette.
 */
function Puce({ children }: { children: string }) {
  return (
    <span className="bg-line text-navy rounded-34 px-2.5 py-1 text-12 whitespace-nowrap">
      {children}
    </span>
  )
}

/**
 * L'etiquette de qualification, a cote du nom.
 *
 * Le vert et le marine, jamais l'ambre : MASTER § 3 reserve l'ambre a l'alerte, et
 * « adherente » n'est pas une alerte. Blanc sur `--green-strong` vaut 5,16:1,
 * blanc sur `--navy` 12,49:1.
 */
function Etiquette({ ton, children }: { ton: 'vert' | 'marine'; children: string }) {
  return (
    <span
      className={[
        'rounded-34 px-2 py-0.5 text-12 font-medium whitespace-nowrap',
        ton === 'vert' ? 'bg-green-strong text-on-green-strong' : 'bg-navy text-on-navy',
      ].join(' ')}
    >
      {children}
    </span>
  )
}

/**
 * Ce que la plateforme sait de cette fiche.
 *
 * `numero_adherent` N'EST RENDU QU'A LA PLATEFORME ET A L'ENTREPRISE ELLE-MEME —
 * `CompanyResource` le tait aux autres. Pour eux le champ est ABSENT de la reponse,
 * pas `null` : c'est la difference entre « je ne sais pas » et « elle n'adhere
 * pas », et afficher un tiret confondrait les deux.
 *
 * `nombre_de_comptes` suit la meme regle, pour une raison de meme nature : c'est un
 * effectif, et le rendre a tout detenteur d'une fiche donnerait la taille de ses
 * concurrents.
 */
function Plateforme({ entreprise }: { entreprise: Entreprise }) {
  // `undefined` — le champ n'a pas ete rendu. On ne sait rien, on ne dit rien.
  if (entreprise.numero_adherent === undefined) {
    return <span className="text-slate text-12">{mentionDeFiche(entreprise)}</span>
  }

  if (entreprise.numero_adherent === null) {
    return <span className="text-slate text-12">{mentionDeFiche(entreprise)}</span>
  }

  return (
    <div>
      <p className="text-navy chiffres font-semibold">{entreprise.numero_adherent}</p>
      <p className="text-slate text-12">Numéro d&apos;adhérent</p>

      {entreprise.nombre_de_comptes !== undefined && (
        <p className="text-slate mt-1 text-12">
          <span className="chiffres">{entreprise.nombre_de_comptes}</span>
          {entreprise.nombre_de_comptes === 1 ? ' compte' : ' comptes'}
        </p>
      )}
    </div>
  )
}

/** Ce que la fiche est, quand elle n'est pas adherente. */
function mentionDeFiche(entreprise: Entreprise): string {
  if (entreprise.is_platform) return 'Éditeur de la plateforme'
  if (entreprise.annuaire_reference) return 'Tenue par la plateforme'

  return ''
}

/** La qualification a afficher a cote du nom, ou `null`. */
function qualificationDe(
  entreprise: Entreprise,
): { libelle: string; ton: 'vert' | 'marine' } | null {
  if (entreprise.is_platform) return { libelle: 'Éditeur', ton: 'marine' }
  if (entreprise.annuaire_reference) return { libelle: 'Annuaire de référence', ton: 'marine' }
  if (entreprise.numero_adherent != null) return { libelle: 'Adhérente', ton: 'vert' }

  return null
}
