import { useNavigate, useSearchParams } from 'react-router'

import { useCreerContact } from '@/api/contacts'
import { FormulaireContact } from '@/components/donnees/FormulaireContact'
import { EnteteEcran } from '@/components/shell/EnteteEcran'

/**
 * La creation d'un contact.
 *
 * `?entreprise=` PRE-CHOISIT L'EMPLOYEUR. C'est ce qui permettra a la fiche
 * entreprise d'offrir « ajouter un contact » sans faire rechercher a nouveau la
 * societe qu'on a sous les yeux.
 *
 * La fiche entre AUTOMATIQUEMENT dans le carnet du compte, en une transaction cote
 * API. Elle n'entre dans aucun autre : creer un contact ne le fait apparaitre chez
 * personne, et c'est ce qui rend la creation sans danger pour le cloisonnement.
 */
export function NouveauContact() {
  const navigate = useNavigate()
  const [parametres] = useSearchParams()
  const creation = useCreerContact()

  const employeur = parametres.get('entreprise')

  return (
    <>
      <EnteteEcran
        titre="Nouveau contact"
        precision="La fiche entre dans votre carnet. Prénom, nom et entreprise sont obligatoires."
      />

      <div className="max-w-[900px] p-6">
        <FormulaireContact
          {...(employeur === null ? {} : { employeurParDefaut: employeur })}
          enCours={creation.isPending}
          erreur={creation.error}
          libelleAction="Créer le contact"
          onAnnuler={() => {
            void navigate('/contacts')
          }}
          onEnvoyer={(valeurs) => {
            creation.mutate(valeurs, {
              onSuccess: () => {
                void navigate('/contacts', { replace: true })
              },
            })
          }}
        />
      </div>
    </>
  )
}
