import type { ReactNode } from 'react'

/**
 * Le tableau souple — celui des personnes.
 *
 * DEUX MISES EN PAGE COEXISTENT DANS LE PRODUIT, et c'est le choix de
 * l'application Vue de l'equipe, valide par le client : **cartes pour les
 * entreprises, tableau pour les personnes.** Ce n'est pas une incoherence. Une
 * entreprise a un logo et vingt champs, on la lit une par une ; une personne a
 * cinq colonnes qu'on compare d'une ligne a l'autre.
 *
 * LES MESURES VIENNENT DE LEUR `_table.scss`, relevees et non approchees :
 *
 *   en-tete    `0.8rem`, capitales, gris, `padding: 0 10px 10px`
 *   ligne      `min-height: 60px`, blanc, filet, `padding: 8px`
 *   cellule    `flex: 1 1 0`, `padding: 0 10px`
 *
 * EN MODE COMPACT — le seul employe ici — LES LIGNES FORMENT UN BLOC : la
 * premiere arrondit son haut, la derniere son bas, et rien ne les separe que leur
 * filet. Sans cela chaque ligne serait une carte de 60 px, et une liste de vingt
 * personnes ressemblerait a vingt objets sans rapport.
 *
 * CE N'EST PAS `Tableau`, LE COMPOSANT RETIRE AU LOT 3. Celui-la etait un vrai
 * `<table>` avec tri par colonne et `aria-sort`. Ici la structure est en `flex`,
 * comme la leur, et il n'y a pas de tri : l'API trie deja par nom, et un tri
 * client sur une liste non paginee serait une fonctionnalite de plus a maintenir
 * pour un besoin que personne n'a exprime.
 *
 * `role="table"` ET SES ROLES ENFANTS SONT POSES A LA MAIN. Une grille en `flex`
 * n'a aucune semantique de tableau : sans ces attributs, un lecteur d'ecran
 * annonce une suite de `div` et l'utilisateur perd le rapport entre une valeur et
 * son en-tete. C'est le prix d'une mise en page en `flex`, et il se paie.
 */

/** Une colonne. `T` est le type d'une ligne. */
export interface ColonneSouple<T> {
  clef: string
  titre: string
  rendu: (ligne: T) => ReactNode
  /** Double la part de largeur — leur `is-grow`. */
  large?: boolean
  /** Aligne a droite — leur `cell-end`. Pour la derniere colonne, celle des actions. */
  fin?: boolean
}

export interface TableauSoupleProps<T> {
  colonnes: readonly ColonneSouple<T>[]
  lignes: readonly T[]
  clefDeLigne: (ligne: T) => string
  /** Nom accessible. Obligatoire : un tableau sans legende ne se situe pas. */
  legende: string
  /** Ce qui s'affiche quand il n'y a rien. Une phrase, pas « Aucun resultat ». */
  vide: ReactNode
}

export function TableauSouple<T>({
  colonnes,
  lignes,
  clefDeLigne,
  legende,
  vide,
}: TableauSoupleProps<T>) {
  return (
    <div role="table" aria-label={legende}>
      <div role="row" className="flex items-center px-2.5">
        {colonnes.map((colonne) => (
          <span
            key={colonne.clef}
            role="columnheader"
            className={[
              'flex items-center px-2.5 pb-2.5 text-[0.8rem] font-semibold uppercase',
              'text-slate',
              colonne.large === true ? 'flex-[2_1_0]' : 'flex-[1_1_0]',
              colonne.fin === true ? 'justify-end' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {colonne.titre}
          </span>
        ))}
      </div>

      {lignes.length === 0 ? (
        <div className="bg-card border-line rounded-8 border p-8 text-center">
          <p className="text-slate">{vide}</p>
        </div>
      ) : (
        <div>
          {lignes.map((ligne) => (
            <div
              key={clefDeLigne(ligne)}
              role="row"
              // Le bloc continu : premiere ligne arrondie en haut, derniere en
              // bas, et pas de filet bas entre elles pour ne pas doubler les
              // traits. Aucune transition — une ligne est survolee cent fois par
              // jour.
              className="bg-card border-line hover:bg-bg flex min-h-15 w-full items-stretch border p-2 first:rounded-t-8 last:rounded-b-8 not-last:border-b-0"
            >
              {colonnes.map((colonne) => (
                <div
                  key={colonne.clef}
                  role="cell"
                  className={[
                    'flex min-w-0 items-center gap-2 px-2.5',
                    colonne.large === true ? 'flex-[2_1_0]' : 'flex-[1_1_0]',
                    colonne.fin === true ? 'justify-end' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {colonne.rendu(ligne)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Une valeur de cellule, coupee proprement si elle deborde.
 *
 * `title` PORTE LE TEXTE ENTIER, et c'est ce que fait leur infobulle. Sans lui,
 * une adresse de courriel longue est coupee en points de suspension et devient
 * illisible sans recours — on ne peut ni la lire, ni la copier en entier.
 *
 * `numerique` passe en chasse tabulaire : deux numeros l'un sous l'autre se
 * comparent alors chiffre a chiffre.
 */
export function ValeurDeCellule({
  valeur,
  gras = false,
  numerique = false,
}: {
  valeur: string | null | undefined
  gras?: boolean
  numerique?: boolean
}) {
  if (valeur == null || valeur === '') {
    return (
      <span className="text-slate" aria-label="non renseigné">
        —
      </span>
    )
  }

  return (
    <span
      title={valeur}
      className={['truncate', gras ? 'text-navy font-medium' : '', numerique ? 'chiffres' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {valeur}
    </span>
  )
}

/**
 * La carte de section qui enveloppe un tableau souple.
 *
 * Leur `V-Card` avec `card-section-header` : un titre portant le compte entre
 * parentheses, et une action a droite — un lien ou un champ de recherche.
 *
 * LE COMPTE EST DANS LE TITRE et non sous le tableau. C'est ou leur ecran le met,
 * et c'est le bon endroit : on veut savoir combien il y en a AVANT de parcourir,
 * pas apres.
 */
export function CarteDeSection({
  titre,
  compte,
  action,
  children,
}: {
  titre: string
  compte?: number
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-card border-line rounded-16 border p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-navy text-[1.05rem]">
          {titre}
          {compte !== undefined && (
            <span className="text-slate font-normal">
              {' ('}
              <span className="chiffres">{compte}</span>
              {')'}
            </span>
          )}
        </h2>

        {action}
      </div>

      {children}
    </section>
  )
}
