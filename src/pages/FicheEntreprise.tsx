import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useSession } from '@/api/auth'
import {
  useAttribuerAdhesion,
  useEntreprise,
  useModifierEntreprise,
  useRetirerDuCarnet,
} from '@/api/entreprises'
import type { Entreprise } from '@/api/entreprises'
import { FormulaireEntreprise } from '@/components/donnees/FormulaireEntreprise'
import { Registre } from '@/components/donnees/Registre'
import { TeleverseurDeLogo } from '@/components/donnees/TeleverseurDeLogo'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { messageDErreur } from '@/lib/erreurs'

/**
 * La fiche d'une entreprise : lecture, modification, et les deux actes de
 * plateforme.
 *
 * DEUX MODES ET NON DEUX ECRANS. Une fiche qu'on ouvre est lue neuf fois sur dix
 * et modifiee une ; l'ouvrir en formulaire ferait saisir par erreur dans un
 * champ qu'on voulait seulement relire. La bascule est explicite.
 *
 * L'ECRAN NE DEVINE AUCUN DROIT. Le bouton « Modifier » parait toujours, et c'est
 * assume : `CompanyPolicy::update()` accorde la modification a l'entreprise
 * elle-meme, a l'auteur de la fiche, et a la plateforme sur l'annuaire de
 * reference — trois conditions dont deux ne sont PAS deductibles de ce que
 * `CompanyResource` rend. Le front n'a pas de quoi les evaluer, et inventer une
 * regle approchante donnerait tantot un bouton absent a tort, tantot un refus au
 * moment d'enregistrer. Le refus de l'API est affiche tel quel : c'est la seule
 * source qui ne se trompe pas.
 *
 * L'ADHESION, ELLE, EST FILTREE PAR ROLE — `superadmin` seul —, parce que celle-la
 * se deduit : `CompanyPolicy::attribuerAdhesion()` teste `bypassesTenantScope()`,
 * qui est vrai du seul super-administrateur plateforme, et le role est dans
 * `GET /me`.
 */
export function FicheEntreprise() {
  const { id = '' } = useParams<{ id: string }>()
  const session = useSession()
  const navigate = useNavigate()

  const fiche = useEntreprise(id)
  const modification = useModifierEntreprise(id)
  const retrait = useRetirerDuCarnet()
  const adhesion = useAttribuerAdhesion()

  const [enEdition, setEnEdition] = useState(false)

  const estPlateforme = session.data?.utilisateur.role === 'superadmin'
  const entreprise = fiche.data

  if (fiche.error != null) {
    return (
      <>
        <EnteteEcran titre="Fiche entreprise" />
        <div className="p-3">
          <Alerte ton="erreur">{messageDErreur(fiche.error)}</Alerte>
        </div>
      </>
    )
  }

  if (entreprise === undefined) {
    // Aucun squelette : `GET /companies/{id}` repond en quelques dizaines de
    // millisecondes, et un squelette qui parait 40 ms est un clignotement.
    return <EnteteEcran titre="Fiche entreprise" />
  }

  return (
    <>
      <EnteteEcran
        titre={entreprise.name}
        precision={precisionDeLaFiche(entreprise)}
        actions={
          enEdition ? undefined : (
            <>
              <Bouton
                taille="sm"
                onClick={() => {
                  setEnEdition(true)
                }}
              >
                Modifier
              </Bouton>

              {/* L'adhesion ne parait que sur une fiche qui peut l'obtenir. Les
                  deux exclusions viennent de l'API, qui rend 409 dans les deux
                  cas — les anticiper evite un bouton qui ne peut que refuser. */}
              {estPlateforme &&
                entreprise.numero_adherent == null &&
                !entreprise.is_platform &&
                !entreprise.annuaire_reference && (
                  <Bouton
                    variante="neutre"
                    taille="sm"
                    disabled={adhesion.isPending}
                    aria-busy={adhesion.isPending}
                    onClick={() => {
                      adhesion.mutate(entreprise.id)
                    }}
                  >
                    {adhesion.isPending ? 'Attribution…' : 'Faire adhérer'}
                  </Bouton>
                )}
            </>
          )
        }
      />

      <div className="max-w-[1320px] p-3">
        {adhesion.error != null && <Alerte ton="erreur">{messageDErreur(adhesion.error)}</Alerte>}
        {retrait.error != null && <Alerte ton="erreur">{messageDErreur(retrait.error)}</Alerte>}

        {/* Le logo est HORS du mode edition : il ne passe pas par le formulaire.
            `PATCH /companies/{id}` ne l'accepte pas — un chemin de fichier ne
            s'assigne pas en masse —, et son televersement est immediat, pas
            differe a un enregistrement. */}
        {!enEdition && (
          <section className="bg-card border-line mb-3 rounded-16 border p-4">
            <TeleverseurDeLogo entreprise={entreprise} />
          </section>
        )}

        {enEdition ? (
          <FormulaireEntreprise
            entreprise={entreprise}
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
              source="GET /api/v1/companies/{id}"
              lignes={[
                { cle: 'Raison sociale', valeur: entreprise.name },
                { cle: 'Dénomination légale', valeur: entreprise.legal },
                { cle: 'Catégorie', valeur: entreprise.categorie },
                { cle: 'Forme juridique', valeur: entreprise.forme_juridique },
                { cle: 'Téléphone', valeur: entreprise.tel, numerique: true },
                { cle: 'Inscrite le', valeur: dateCourte(entreprise.created_at) },
              ]}
            />

            <Registre
              titre="Immatriculation"
              lignes={[
                { cle: 'SIREN', valeur: entreprise.siren, numerique: true },
                { cle: 'SIRET', valeur: entreprise.siret, numerique: true },
                { cle: 'Code APE', valeur: entreprise.ape },
                { cle: 'RCS', valeur: entreprise.rcs },
                { cle: 'Ville du RCS', valeur: entreprise.rcs_ville },
                { cle: 'Capital social', valeur: entreprise.capital, numerique: true },
                { cle: 'Numéro de TVA', valeur: entreprise.tva },
              ]}
            />

            <Registre
              titre="Adresse"
              lignes={[
                { cle: 'Adresse', valeur: entreprise.adresse },
                { cle: 'Code postal', valeur: entreprise.cp, numerique: true },
                { cle: 'Ville', valeur: entreprise.ville },
              ]}
            />

            <Registre
              titre="Coordonnées bancaires"
              lignes={[
                { cle: 'IBAN', valeur: entreprise.iban, numerique: true },
                { cle: 'BIC', valeur: entreprise.bic },
              ]}
            />

            <Registre
              titre="Assurance"
              lignes={[
                { cle: 'Assureur', valeur: entreprise.assureur },
                { cle: 'Couverture RC', valeur: entreprise.couverture_rc },
              ]}
            />

            <Registre
              titre="Représentant"
              lignes={[
                { cle: 'Gérant', valeur: entreprise.gerant },
                { cle: 'Qualité', valeur: entreprise.qualite },
              ]}
            />

            {/*
             * Les decisions de plateforme sont dans leur propre bloc, et il
             * n'apparait QUE si l'API les a rendues — c'est-a-dire au lecteur
             * plateforme ou a l'entreprise elle-meme. Pour tout autre, les champs
             * sont ABSENTS de la reponse, et un bloc de tirets laisserait croire
             * que la fiche n'adhere pas.
             */}
            {entreprise.numero_adherent !== undefined && (
              <Registre
                titre="Plateforme"
                lignes={[
                  {
                    cle: "Numéro d'adhérent",
                    valeur: entreprise.numero_adherent,
                    numerique: true,
                  },
                  {
                    cle: 'Émetteur des documents',
                    valeur: entreprise.default_emetteur === true ? 'Oui' : 'Non',
                  },
                  {
                    cle: 'Comptes hébergés',
                    valeur:
                      entreprise.nombre_de_comptes === undefined
                        ? null
                        : String(entreprise.nombre_de_comptes),
                    numerique: true,
                  },
                ]}
              />
            )}

            <ZoneDeRetrait
              entreprise={entreprise}
              enCours={retrait.isPending}
              onRetirer={() => {
                retrait.mutate(entreprise.id, {
                  onSuccess: () => {
                    void navigate('/entreprises')
                  },
                })
              }}
            />
          </>
        )}
      </div>
    </>
  )
}

/**
 * Le retrait du carnet.
 *
 * LE LIBELLE NE DIT PAS « SUPPRIMER », et c'est la decision la plus importante de
 * cet ecran. Cote API, `DELETE /companies/{id}` retire la fiche du carnet du
 * compte ; elle n'est detruite QUE si elle n'adhere a rien, ne porte ni compte ni
 * contact, et ne figure dans aucun autre carnet. Ecrire « Supprimer » ferait
 * croire a une destruction qui n'a le plus souvent pas lieu — et ferait hesiter
 * devant une action qui, elle, est anodine.
 *
 * La confirmation est en DEUX temps et non par une fenetre modale : un `confirm()`
 * natif est hors du systeme de design, et une modale pour une action reversible
 * — la fiche se remet au carnet en la recreant — serait disproportionnee.
 */
function ZoneDeRetrait({
  entreprise,
  enCours,
  onRetirer,
}: {
  entreprise: Entreprise
  enCours: boolean
  onRetirer: () => void
}) {
  const [confirme, setConfirme] = useState(false)

  // La plateforme ne se retire pas d'un carnet : l'API rend 409, et proposer le
  // bouton ne servirait qu'a le decouvrir.
  if (entreprise.is_platform) return null

  return (
    <div className="border-line mt-3 border-t pt-3">
      {confirme ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-navy text-13">
            Retirer <strong className="font-semibold">{entreprise.name}</strong> de votre carnet ?
            La fiche reste sur la plateforme.
          </p>
          <Bouton
            variante="destructif"
            taille="sm"
            disabled={enCours}
            aria-busy={enCours}
            onClick={onRetirer}
          >
            {enCours ? 'Retrait…' : 'Confirmer le retrait'}
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
          className="text-slate hover:text-danger text-12 font-medium"
        >
          Retirer de mon carnet
        </button>
      )}
    </div>
  )
}

/** Ce que la fiche est, quand elle est autre chose qu'une fiche ordinaire. */
function precisionDeLaFiche(entreprise: Entreprise): string | undefined {
  if (entreprise.is_platform) return 'Éditeur de la plateforme.'

  if (entreprise.annuaire_reference) {
    return 'Annuaire de référence — lisible par tous les adhérents, tenue par la plateforme.'
  }

  if (entreprise.numero_adherent != null) {
    return `Adhérente — numéro ${entreprise.numero_adherent}.`
  }

  return undefined
}

/**
 * Une date ISO en jour/mois/annee, ou `null`.
 *
 * `fr-FR` explicite et non la locale du navigateur : un poste configure en anglais
 * afficherait `3/12/2025` pour le 12 mars, ce qui se lit `3 decembre` a un
 * conducteur de travaux francais. Sur une date d'adhesion, l'ambiguite coute une
 * verification.
 */
function dateCourte(iso: string | null): string | null {
  if (iso == null) return null

  const date = new Date(iso)

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
