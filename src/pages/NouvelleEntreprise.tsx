import { useNavigate } from 'react-router'

import { useCreerEntreprise } from '@/api/entreprises'
import { FormulaireEntreprise } from '@/components/donnees/FormulaireEntreprise'
import { EnteteEcran } from '@/components/shell/EnteteEcran'

/**
 * La creation d'une fiche entreprise.
 *
 * LA FICHE ENTRE AUTOMATIQUEMENT DANS LE CARNET DU COMPTE, en une transaction
 * cote API. Ce n'est pas un effet de bord commode : un rattachement en deux
 * appels laisserait entre les deux une fiche que son createur ne voit deja plus —
 * il l'aurait creee et perdue.
 *
 * Elle n'entre dans AUCUN autre carnet. C'est ce qui rend la creation sans danger
 * pour le cloisonnement : personne d'autre ne la voit apparaitre.
 *
 * `annuaire_reference` N'EST PAS PROPOSE ICI. Publier une fiche a l'annuaire de
 * reference est un acte editorial de la plateforme, reserve au compte qui ne se
 * restreint a aucune entreprise, et il est IMMUABLE — l'API ne l'accepte qu'a la
 * creation et jamais en modification. Le mettre dans ce formulaire ferait
 * publier par inadvertance une fiche visible de tous les adherents, sans retour
 * possible. Il viendra avec l'ecran d'administration de l'annuaire de reference,
 * ou l'acte sera explicite.
 */
export function NouvelleEntreprise() {
  const navigate = useNavigate()
  const creation = useCreerEntreprise()

  return (
    <>
      <EnteteEcran
        titre="Nouvelle entreprise"
        precision="La fiche entre dans votre carnet. Seule la raison sociale et le SIRET sont obligatoires."
      />

      <div className="max-w-[1320px] p-3">
        <FormulaireEntreprise
          enCours={creation.isPending}
          erreur={creation.error}
          libelleAction="Créer la fiche"
          onAnnuler={() => {
            void navigate('/entreprises')
          }}
          onEnvoyer={(valeurs) => {
            creation.mutate(valeurs, {
              onSuccess: (entreprise) => {
                // On atterrit sur la fiche creee et non sur la liste : la
                // creation rapide ne demande que deux champs, et la suite du
                // travail est de completer les dix-huit autres.
                void navigate(`/entreprises/${entreprise.id}`, { replace: true })
              },
            })
          }}
        />
      </div>
    </>
  )
}
