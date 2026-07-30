import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { useContact, useModifierContact, useRetirerContactDuCarnet } from '@/api/contacts'
import { Registre } from '@/components/donnees/Registre'
import { FormulaireContact } from '@/components/donnees/FormulaireContact'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { messageDErreur } from '@/lib/erreurs'

/**
 * La fiche d'un contact : lecture, modification, retrait du carnet.
 *
 * DEUX MODES ET NON DEUX ECRANS, comme la fiche entreprise : une fiche qu'on ouvre
 * est lue neuf fois sur dix et modifiee une.
 *
 * L'ECRAN NE DEVINE AUCUN DROIT. « Modifier » parait toujours, et le refus de
 * l'API est affiche tel quel. `ContactPolicy::update()` accorde la modification a
 * qui detient la fiche dans son carnet, et `definirAcces` gouverne a part le role
 * d'acces — deux conditions que `ContactResource` ne rend pas. Inventer une regle
 * approchante donnerait tantot un bouton absent a tort, tantot un refus au moment
 * d'enregistrer.
 */
export function FicheContact() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const fiche = useContact(id)
  const modification = useModifierContact(id)
  const retrait = useRetirerContactDuCarnet()

  const [enEdition, setEnEdition] = useState(false)
  const [confirme, setConfirme] = useState(false)

  if (fiche.error != null) {
    return (
      <>
        <EnteteEcran titre="Fiche contact" />
        <div className="p-6">
          <Alerte ton="erreur">{messageDErreur(fiche.error)}</Alerte>
        </div>
      </>
    )
  }

  const contact = fiche.data
  if (contact === undefined) return <EnteteEcran titre="Fiche contact" />

  return (
    <>
      <EnteteEcran
        titre={contact.nom_complet}
        {...(contact.poste == null ? {} : { precision: contact.poste })}
        actions={
          enEdition ? undefined : (
            <Bouton
              taille="sm"
              onClick={() => {
                setEnEdition(true)
              }}
            >
              Modifier
            </Bouton>
          )
        }
      />

      <div className="max-w-[900px] p-6">
        {retrait.error != null && <Alerte ton="erreur">{messageDErreur(retrait.error)}</Alerte>}

        {enEdition ? (
          <FormulaireContact
            contact={contact}
            enCours={modification.isPending}
            erreur={modification.error}
            libelleAction="Enregistrer"
            onAnnuler={() => {
              setEnEdition(false)
            }}
            onEnvoyer={(valeurs) => {
              modification.mutate(valeurs, {
                onSuccess: () => {
                  setEnEdition(false)
                },
              })
            }}
          />
        ) : (
          <>
            <Registre
              titre="Identité"
              source="GET /api/v1/contacts/{id}"
              lignes={[
                { cle: 'Prénom', valeur: contact.prenom },
                { cle: 'Nom', valeur: contact.nom },
                { cle: 'Poste', valeur: contact.poste },
                { cle: "Rôle d'accès", valeur: contact.access_role },
              ]}
            />

            <Registre
              titre="Coordonnées"
              lignes={[
                { cle: 'E-mail', valeur: contact.email },
                { cle: 'Téléphone', valeur: contact.portable, numerique: true },
              ]}
            />

            <Registre
              titre="Employeur"
              lignes={[
                {
                  cle: 'Entreprise',
                  contenu:
                    contact.company_name == null ? (
                      '—'
                    ) : (
                      // Le seul lien entre les deux annuaires. Designer un
                      // employeur n'ouvre aucun acces a cette entreprise ; le lien
                      // ne mene qu'a une fiche qu'on voit deja.
                      <Link
                        to={`/entreprises/${contact.company_id}`}
                        className="text-green-strong font-medium hover:underline"
                      >
                        {contact.company_name}
                      </Link>
                    ),
                },
              ]}
            />

            <div className="border-line mt-4 border-t pt-4">
              {confirme ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-navy">
                    Retirer <strong className="font-medium">{contact.nom_complet}</strong> de votre
                    carnet ? La fiche reste sur la plateforme si quelqu&apos;un d&apos;autre la
                    détient.
                  </p>
                  <Bouton
                    variante="destructif"
                    taille="sm"
                    disabled={retrait.isPending}
                    aria-busy={retrait.isPending}
                    onClick={() => {
                      retrait.mutate(contact.id, {
                        onSuccess: () => {
                          void navigate('/contacts')
                        },
                      })
                    }}
                  >
                    {retrait.isPending ? 'Retrait…' : 'Confirmer le retrait'}
                  </Bouton>
                  <Bouton
                    variante="neutre"
                    taille="sm"
                    onClick={() => {
                      setConfirme(false)
                    }}
                  >
                    Annuler
                  </Bouton>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setConfirme(true)
                  }}
                  className="text-slate hover:text-danger text-13 font-medium"
                >
                  Retirer de mon carnet
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
