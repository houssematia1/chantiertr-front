import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { useEntreprises } from '@/api/entreprises'
import { CarteEntreprise } from '@/components/donnees/CarteEntreprise'
import { Compteur } from '@/components/donnees/Compteur'
import { Pagination } from '@/components/donnees/Pagination'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Alerte } from '@/components/ui/Alerte'
import { messageDErreur } from '@/lib/erreurs'

/**
 * « Mes entreprises » — les adherents de la plateforme.
 *
 * L'ECRAN DU SUPER-ADMINISTRATEUR PLATEFORME, et le pendant du « + Nouvel
 * adherent » du logiciel d'origine. Il ne montre que les fiches PORTEUSES d'un
 * numero d'adherent : ce sont les clients, et ce sont les seules a heberger des
 * comptes et des projets.
 *
 * LE FILTRE EST COTE FRONT et non par un parametre d'API, parce qu'il n'existe pas
 * de parametre : `GET /companies` ne filtre que par categorie. Le
 * super-administrateur voit toute la table, donc le tri se fait ici sur une
 * collection deja complete — `index()` ne pagine pas. Le jour ou elle paginera, ce
 * filtre devra remonter chez l'API : filtrer une page, c'est filtrer le hasard.
 *
 * L'ADHESION NE S'ATTRIBUE PAS D'ICI. Elle se fait depuis la fiche, ou l'on voit
 * QUI l'on fait entrer — raison sociale, SIRET, ville. Un bouton dans une liste
 * ferait accorder la qualite de tenant sur la foi d'une ligne.
 */

const PAR_PAGE = 10

export function AdherentsDeLaPlateforme() {
  const entreprises = useEntreprises()
  const [page, setPage] = useState(1)

  // `useMemo` et non `?? []` nu : un tableau litteral est une NOUVELLE reference a
  // chaque rendu, ce qui invaliderait tous les `useMemo` qui en dependent — la
  // liste filtree se recalculerait a chaque frappe de touche ailleurs sur l'ecran.
  const toutes = useMemo(() => entreprises.data ?? [], [entreprises.data])

  const adherents = useMemo(
    () => toutes.filter((entreprise) => entreprise.numero_adherent != null),
    [toutes],
  )

  const candidates = useMemo(
    () =>
      toutes.filter(
        (entreprise) =>
          entreprise.numero_adherent == null &&
          !entreprise.is_platform &&
          !entreprise.annuaire_reference,
      ),
    [toutes],
  )

  const pages = Math.max(1, Math.ceil(adherents.length / PAR_PAGE))
  const pageBornee = Math.min(page, pages)
  const affichees = adherents.slice((pageBornee - 1) * PAR_PAGE, pageBornee * PAR_PAGE)

  return (
    <>
      <EnteteEcran
        titre="Mes entreprises"
        precision="Les adhérents de la plateforme — les seules à héberger des comptes et des projets."
      />

      <div className="max-w-[1400px] p-6">
        <div role="group" aria-label="Comptages" className="mb-4 flex items-center gap-2">
          <Compteur nombre={adherents.length} libelle="Adhérentes" />
          <Compteur nombre={candidates.length} libelle="Fiches éligibles" />
        </div>

        {entreprises.error != null && (
          <Alerte ton="erreur">{messageDErreur(entreprises.error)}</Alerte>
        )}

        {affichees.length === 0 ? (
          <div className="bg-card border-line rounded-16 border p-8 text-center">
            <p className="text-slate">
              {entreprises.isPending
                ? '…'
                : "Aucune entreprise n'adhère encore. Ouvrez une fiche et utilisez « Faire adhérer »."}
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

        {/*
         * Les fiches eligibles sont NOMMEES, pas seulement comptees. Le
         * super-administrateur qui vient de signer un contrat cherche UNE fiche ; la
         * lui faire retrouver dans l'annuaire complet, ou elle est melee a
         * l'annuaire de reference, est un detour inutile.
         *
         * La liste est bornee a dix, et le message le DIT plutot que de tronquer en
         * silence.
         */}
        {candidates.length > 0 && (
          <section className="bg-card border-line mt-5 rounded-16 border p-4">
            <h2 className="text-navy text-[1.05rem]">Fiches éligibles à l&apos;adhésion</h2>
            <p className="text-slate mt-1">
              L&apos;adhésion s&apos;attribue depuis la fiche, où la raison sociale et le SIRET sont
              sous les yeux.
            </p>

            <ul className="mt-3 flex flex-wrap gap-2">
              {candidates.slice(0, 10).map((entreprise) => (
                <li key={entreprise.id}>
                  <Link
                    to={`/entreprises/${entreprise.id}`}
                    className="border-line-champ text-navy hover:bg-bg block rounded-8 border px-3 py-1.5 text-13 font-medium"
                  >
                    {entreprise.name}
                  </Link>
                </li>
              ))}
            </ul>

            {candidates.length > 10 && (
              <p className="text-slate mt-3 text-13">
                {'… et '}
                <span className="chiffres">{candidates.length - 10}</span>
                {' autres. '}
                <Link to="/entreprises" className="text-green-strong font-medium hover:underline">
                  Voir l&apos;annuaire complet
                </Link>
              </p>
            )}
          </section>
        )}
      </div>
    </>
  )
}
