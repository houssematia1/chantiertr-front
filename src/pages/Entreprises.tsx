import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { useSession } from '@/api/auth'
import { useEntreprises } from '@/api/entreprises'
import type { Entreprise } from '@/api/entreprises'
import { CarteEntreprise } from '@/components/donnees/CarteEntreprise'
import { Compteur } from '@/components/donnees/Compteur'
import { Pagination } from '@/components/donnees/Pagination'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Alerte } from '@/components/ui/Alerte'
import { BoutonLien } from '@/components/ui/BoutonLien'
import { Champ } from '@/components/ui/Champ'
import { Selecteur } from '@/components/ui/Selecteur'
import { categoriesDisponibles } from '@/contenu/categories'
import { messageDErreur } from '@/lib/erreurs'
import { contient, contientChiffres } from '@/lib/recherche'

/**
 * L'annuaire des entreprises.
 *
 * LA COMPOSITION EST CELLE DE LA LISTE DE SOCIETES DE L'APPLICATION VUE DE
 * L'EQUIPE, reprise depuis son code : un titre et un bouton primaire, des cartes
 * de comptage, une barre de recherche et un selecteur de categorie, puis une carte
 * par entreprise, puis une pagination a dix par page.
 *
 * La premiere version etait un TABLEAU dense, avec tri par colonne et lignes de
 * 36 px. Le client l'a refuse — theme, police et layout —, et a demande cette
 * composition-la. Le composant `Tableau` et ses tris sont retires : garder un
 * composant que rien n'emploie coute plus que de le reprendre dans l'historique.
 *
 * CE QU'IL MONTRE DEPEND DU COMPTE, et ce n'est pas le front qui en decide :
 * `Company::visiblesDepuis()` filtre en SQL. Un super-administrateur plateforme
 * voit tout ; les autres voient leur propre fiche, celles de leur carnet, et
 * l'annuaire de reference tenu par la plateforme.
 *
 * LA CATEGORIE VA A L'API, LA RECHERCHE ET LA PAGINATION RESTENT ICI. Trois
 * filtres, trois endroits, et chacun a sa raison : c'est l'API qui NORMALISE les
 * categories — apostrophes typographiques, espaces multiples —, donc un filtre
 * applique cote front sur une valeur non normalisee viderait la liste sans rien
 * expliquer. La recherche et la pagination, elles, n'ont pas d'equivalent cote API
 * et portent sur une collection deja complete : `index()` ne pagine pas. Le jour ou
 * elle paginera, les deux devront remonter chez elle — chercher dans une page,
 * c'est chercher dans le hasard.
 */

/** Dix par page, comme leur `V-FlexPagination`. */
const PAR_PAGE = 10

export function Entreprises() {
  const session = useSession()
  const [parametres, setParametres] = useSearchParams()
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)

  const categorie = parametres.get('categorie')
  const entreprises = useEntreprises(categorie ?? undefined)

  const estPlateforme = session.data?.utilisateur.role === 'superadmin'
  // `useMemo` et non `?? []` nu : un tableau litteral est une NOUVELLE reference a
  // chaque rendu, ce qui invaliderait tous les `useMemo` qui en dependent — la
  // liste filtree se recalculerait a chaque frappe de touche ailleurs sur l'ecran.
  const toutes = useMemo(() => entreprises.data ?? [], [entreprises.data])

  const categories = useMemo(
    () => categoriesDisponibles(toutes.map((entreprise) => entreprise.categorie)),
    [toutes],
  )

  const visibles = useMemo(() => filtrerParRecherche(toutes, recherche), [toutes, recherche])

  // La page courante est BORNEE et non memorisee telle quelle : filtrer une liste
  // de trois pages jusqu'a n'en garder qu'une laisserait sinon la page 3 affichee,
  // donc un ecran vide alors qu'il y a des resultats.
  const pages = Math.max(1, Math.ceil(visibles.length / PAR_PAGE))
  const pageBornee = Math.min(page, pages)
  const affichees = visibles.slice((pageBornee - 1) * PAR_PAGE, pageBornee * PAR_PAGE)

  /**
   * Le nombre d'adherentes — et s'il y a lieu de l'annoncer.
   *
   * LA CONDITION PORTE SUR LA PRESENCE DU CHAMP, PAS SUR LE ROLE, et c'est une
   * correction : la premiere version testait `role === 'superadmin'`, ce qui
   * dupliquait cote front une regle qui vit cote API. `CompanyResource` decide
   * seule a qui elle rend `numero_adherent` — plateforme et entreprise elle-meme
   * —, et le front n'a qu'a lire ce qu'il a recu.
   *
   * `undefined` veut dire « l'API ne l'a pas dit ». Compter des `undefined`
   * donnerait zero, ce qui serait FAUX et non « inconnu » : le compteur se tait.
   */
  const adhesionRenseignee = toutes.some((entreprise) => entreprise.numero_adherent !== undefined)

  const adherentes = useMemo(
    () => toutes.filter((entreprise) => entreprise.numero_adherent != null).length,
    [toutes],
  )

  return (
    <>
      <EnteteEcran
        titre="Entreprises"
        precision={precisionDuPerimetre(estPlateforme)}
        actions={
          <BoutonLien to="/entreprises/nouvelle" taille="sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouvelle entreprise
          </BoutonLien>
        }
      />

      <div className="max-w-[1400px] p-6">
        {/* `role="group"` nomme : sans lui, un lecteur d'ecran annonce deux
            nombres sans dire ce qu'ils comptent. */}
        <div role="group" aria-label="Comptages" className="mb-4 flex items-center gap-2">
          <Compteur nombre={toutes.length} libelle="Entreprises" />

          {/* Il ne parait que si l'API a renseigne l'adhesion — voir plus haut. */}
          {adhesionRenseignee && <Compteur nombre={adherentes} libelle="Adhérentes" />}
        </div>

        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="w-64">
            <Champ
              libelle="Rechercher"
              type="search"
              placeholder="Raison sociale, ville, SIRET"
              value={recherche}
              onChange={(evenement) => {
                setRecherche(evenement.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="w-52">
            <Selecteur
              libelle="Catégorie"
              value={categorie ?? ''}
              onChange={(valeur) => {
                // `replace` : basculer d'un filtre a l'autre n'est pas une
                // navigation. Sans lui, dix clics imposent dix retours arriere.
                setParametres(valeur === '' ? {} : { categorie: valeur }, { replace: true })
                setPage(1)
              }}
              options={[
                { valeur: '', libelle: 'Toutes les catégories' },
                ...categories.map((nom) => ({ valeur: nom, libelle: nom })),
              ]}
            />
          </div>
        </div>

        {entreprises.error != null && (
          <Alerte ton="erreur">{messageDErreur(entreprises.error)}</Alerte>
        )}

        {affichees.length === 0 ? (
          <div className="bg-card border-line rounded-16 border p-8 text-center">
            <p className="text-slate">
              {entreprises.isPending ? '…' : messageDeVide({ recherche, categorie, estPlateforme })}
            </p>
          </div>
        ) : (
          <div>
            {affichees.map((entreprise) => (
              <CarteEntreprise key={entreprise.id} entreprise={entreprise} />
            ))}
          </div>
        )}

        <Pagination page={pageBornee} pages={pages} onChanger={setPage} />
      </div>
    </>
  )
}

/**
 * La recherche : raison sociale, denomination legale, ville et SIRET.
 *
 * Les primitives sont dans `lib/recherche.ts` — les trois annuaires du lot les
 * partagent, et leur partie delicate, la neutralisation des accents, ne doit
 * exister qu'une fois.
 */
function filtrerParRecherche(entreprises: readonly Entreprise[], recherche: string): Entreprise[] {
  if (recherche.trim() === '') return [...entreprises]

  return entreprises.filter(
    (entreprise) =>
      contient(recherche, [entreprise.name, entreprise.legal, entreprise.ville]) ||
      contientChiffres(recherche, entreprise.siret),
  )
}

/**
 * Ce que dit une liste vide.
 *
 * TROIS CAS, et les confondre est le defaut le plus courant d'une liste filtree :
 * « aucun résultat » quand c'est le filtre qui exclut tout laisse chercher une
 * donnee qui existe. Le message nomme la cause, donc l'action.
 */
function messageDeVide({
  recherche,
  categorie,
  estPlateforme,
}: {
  recherche: string
  categorie: string | null
  estPlateforme: boolean
}): string {
  if (recherche.trim() !== '') {
    return `Aucune entreprise ne correspond à « ${recherche.trim()} ».`
  }

  if (categorie !== null) {
    return `Aucune entreprise dans la catégorie « ${categorie} ».`
  }

  return estPlateforme
    ? 'Aucune entreprise enregistrée sur la plateforme.'
    : "Votre carnet est vide. Les fiches que vous créez y entrent automatiquement, et l'annuaire de référence de la plateforme s'y ajoute."
}

/** Ce que le compte voit, dit en une ligne — parce que le perimetre n'est pas devinable. */
function precisionDuPerimetre(estPlateforme: boolean): string {
  return estPlateforme
    ? 'Toutes les entreprises de la plateforme.'
    : "Votre entreprise, votre carnet, et l'annuaire de référence."
}
