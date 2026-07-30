import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { useSession } from '@/api/auth'
import type { Utilisateur } from '@/api/auth'
import {
  useAnnulerInvitation,
  useArchiverCompte,
  useEmprunterCompte,
  useReactiverCompte,
  useRenvoyerInvitation,
} from '@/api/comptes'
import { useComptes } from '@/api/comptes'
import { Etat } from '@/components/donnees/Etat'
import { CarteDeSection, TableauSouple, ValeurDeCellule } from '@/components/donnees/TableauSouple'
import type { ColonneSouple } from '@/components/donnees/TableauSouple'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Alerte } from '@/components/ui/Alerte'
import { BoutonLien } from '@/components/ui/BoutonLien'
import { Champ } from '@/components/ui/Champ'
import { ItemDeMenu, MenuActions } from '@/components/ui/MenuActions'
import { messageDErreur } from '@/lib/erreurs'
import { contient, contientChiffres } from '@/lib/recherche'

/**
 * L'annuaire des comptes.
 *
 * LA MISE EN PAGE EST CELLE DES CONTACTS — tableau souple dans une carte de
 * section —, avec deux colonnes de plus que leur ecran : le STATUT en pastille, et
 * un menu d'actions au lieu de leur simple bouton. Leur tableau met une couronne
 * devant le prenom d'un super-administrateur ; le statut dit davantage — actif,
 * invite, archive — et il est deja dans `UserResource`.
 *
 * C'EST ICI QUE L'EMPRUNT DE COMPTE TROUVE SON DECLENCHEUR. Le bandeau existe
 * depuis la tache 2 et rien ne l'allumait ; « Se connecter en tant que » est
 * l'entree que leur menu appelle `login_as`.
 *
 * LES ACTIONS SONT FILTREES PAR CE QUE L'API PEUT REFUSER D'AVANCE, et par rien
 * d'autre :
 *
 *   emprunt      super-administrateur plateforme seulement, et jamais sur soi ni
 *                sur un autre compte de plateforme — `bypassesTenantScope()` est
 *                dans `GET /me`, donc deductible
 *   archivage    jamais sur soi — l'API rend 403, et le proposer serait un piege
 *   invitation   seulement sur un compte au statut `invite` — l'API rend 409 sinon
 *   reactivation seulement sur un compte `archive`
 *
 * Tout le reste — la hierarchie des roles, le cloisonnement — reste au serveur, et
 * son refus est affiche tel quel. Le front MASQUE ce qu'il sait impossible ; il ne
 * rejoue pas les policies.
 */
export function Comptes() {
  const session = useSession()
  const navigate = useNavigate()
  const [recherche, setRecherche] = useState('')

  const comptes = useComptes()
  const archivage = useArchiverCompte()
  const reactivation = useReactiverCompte()
  const renvoi = useRenvoyerInvitation()
  const annulation = useAnnulerInvitation()
  const emprunt = useEmprunterCompte()

  const moi = session.data?.utilisateur

  // Extraits une fois : `moi?.id` repete dans le corps des colonnes faisait croire
  // au verificateur que la chaine optionnelle etait inutile la ou `estPlateforme`
  // l'avait deja narrowee — et il avait raison de s'en plaindre, deux lectures du
  // meme optionnel dans une meme expression se lisent mal.
  const monId = moi?.id ?? null
  const estPlateforme = moi?.role === 'superadmin'

  const tous = useMemo(() => comptes.data ?? [], [comptes.data])

  const visibles = useMemo(
    () =>
      recherche.trim() === ''
        ? tous
        : tous.filter(
            (compte) =>
              contient(recherche, [
                `${compte.prenom} ${compte.nom}`,
                compte.email,
                compte.poste,
                compte.role_label,
              ]) || contientChiffres(recherche, compte.tel),
          ),
    [tous, recherche],
  )

  /** Le message de la derniere action qui a abouti — un renvoi d'invitation. */
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const echec =
    archivage.error ?? reactivation.error ?? renvoi.error ?? annulation.error ?? emprunt.error

  const colonnes = useMemo(
    (): ColonneSouple<Utilisateur>[] => [
      {
        clef: 'nom',
        titre: 'Nom',
        large: true,
        rendu: (compte) => <ValeurDeCellule valeur={`${compte.prenom} ${compte.nom}`} gras />,
      },
      {
        clef: 'email',
        titre: 'E-mail',
        large: true,
        rendu: (compte) => (
          <a
            href={`mailto:${compte.email}`}
            title={compte.email}
            className="hover:text-green-strong truncate"
          >
            {compte.email}
          </a>
        ),
      },
      {
        clef: 'tel',
        titre: 'Téléphone',
        rendu: (compte) => <ValeurDeCellule valeur={compte.tel} numerique />,
      },
      {
        clef: 'role',
        titre: 'Rôle',
        rendu: (compte) => <ValeurDeCellule valeur={compte.role_label} />,
      },
      {
        clef: 'statut',
        titre: 'Statut',
        rendu: (compte) => <Etat statut={compte.statut} libelle={compte.statut_label} />,
      },
      {
        clef: 'action',
        titre: 'Action',
        fin: true,
        rendu: (compte) => (
          <MenuActions declencheur="Réglages" pour={`${compte.prenom} ${compte.nom}`}>
            <>
              <ItemDeMenu
                titre="Modifier le compte"
                detail="Nom, coordonnées, rôle"
                icone={<IconeCrayon />}
                onClick={() => {
                  void navigate(`/comptes/${compte.id}`)
                }}
              />

              {/* L'emprunt : super-administrateur plateforme seulement, jamais sur
                    soi, jamais sur un autre compte de plateforme. L'API refuse les
                    trois, et les proposer ne servirait qu'a le decouvrir. */}
              {estPlateforme && monId !== compte.id && !estCompteDePlateforme(compte) && (
                <ItemDeMenu
                  titre="Se connecter en tant que"
                  detail="Session en lecture seule, et tracée"
                  icone={<IconeOeil />}
                  onClick={() => {
                    emprunt.mutate(compte.id, {
                      onSuccess: () => {
                        void navigate('/')
                      },
                    })
                  }}
                />
              )}

              {compte.statut === 'invite' && (
                <>
                  <ItemDeMenu
                    titre="Renvoyer l'invitation"
                    detail="Le lien a pu périmer ou se perdre"
                    icone={<IconeEnveloppe />}
                    onClick={() => {
                      renvoi.mutate(compte.id, {
                        onSuccess: (reponse) => {
                          setConfirmation(reponse.message)
                        },
                      })
                    }}
                  />
                  <ItemDeMenu
                    titre="Annuler l'invitation"
                    detail="Le compte est détruit et l'adresse libérée"
                    icone={<IconeCroix />}
                    ton="destructif"
                    onClick={() => {
                      annulation.mutate(compte.id)
                    }}
                  />
                </>
              )}

              {compte.statut === 'archive' && (
                <ItemDeMenu
                  titre="Réactiver"
                  detail="Le compte peut se reconnecter"
                  icone={<IconeRetour />}
                  onClick={() => {
                    reactivation.mutate(compte.id)
                  }}
                />
              )}

              {/* Archiver, jamais sur soi : l'API rend 403, et se retirer son
                    propre acces serait irreversible depuis cet ecran. */}
              {compte.statut !== 'archive' && monId !== compte.id && (
                <ItemDeMenu
                  titre="Archiver"
                  detail="Le compte ne peut plus se connecter"
                  icone={<IconeBoite />}
                  ton="destructif"
                  onClick={() => {
                    archivage.mutate(compte.id)
                  }}
                />
              )}
            </>
          </MenuActions>
        ),
      },
    ],
    [estPlateforme, monId, navigate, emprunt, renvoi, annulation, reactivation, archivage],
  )

  return (
    <>
      <EnteteEcran
        titre="Utilisateurs"
        precision="Les comptes de votre organisation."
        actions={
          <BoutonLien to="/comptes/nouveau" taille="sm">
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
            Inviter un compte
          </BoutonLien>
        }
      />

      <div className="max-w-[1400px] p-6">
        {comptes.error != null && <Alerte ton="erreur">{messageDErreur(comptes.error)}</Alerte>}
        {echec != null && <Alerte ton="erreur">{messageDErreur(echec)}</Alerte>}
        {confirmation != null && <Alerte ton="succes">{confirmation}</Alerte>}

        <CarteDeSection
          titre="Utilisateurs"
          compte={visibles.length}
          action={
            <div className="w-64">
              <Champ
                libelle="Rechercher"
                type="search"
                placeholder="Nom, e-mail, rôle"
                value={recherche}
                onChange={(evenement) => {
                  setRecherche(evenement.target.value)
                }}
              />
            </div>
          }
        >
          <TableauSouple
            legende="Annuaire des comptes"
            colonnes={colonnes}
            lignes={visibles}
            clefDeLigne={(compte) => compte.id}
            vide={
              comptes.isPending
                ? '…'
                : recherche.trim() !== ''
                  ? `Aucun compte ne correspond à « ${recherche.trim()} ».`
                  : 'Aucun compte dans votre organisation.'
            }
          />
        </CarteDeSection>
      </div>
    </>
  )
}

/**
 * Le compte releve-t-il de la plateforme ?
 *
 * L'API refuse d'emprunter un compte de plateforme — `CompanyPolicy` n'y est pour
 * rien, c'est `ImpersonationController` qui l'exige. Les deux valeurs sont celles
 * de `Role::isPlatform()`, et les nommer ici plutot que de tester une chaine libre
 * fait qu'un role de plateforme ajoute demain ne passera pas inapercu : le type
 * `Role` refusera la valeur inconnue.
 */
function estCompteDePlateforme(compte: Utilisateur): boolean {
  return compte.role === 'superadmin' || compte.role === 'super_admin_membre'
}

const attributsIcone = {
  width: 15,
  height: 15,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  'aria-hidden': true,
} as const

function IconeCrayon() {
  return (
    <svg {...attributsIcone}>
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
    </svg>
  )
}

function IconeOeil() {
  return (
    <svg {...attributsIcone} strokeWidth={1.8}>
      <path d="M1.8 12S5.4 5.2 12 5.2 22.2 12 22.2 12 18.6 18.8 12 18.8 1.8 12 1.8 12z" />
      <circle cx="12" cy="12" r="3.1" />
    </svg>
  )
}

function IconeEnveloppe() {
  return (
    <svg {...attributsIcone}>
      <path d="M3 6h18v12H3z" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

function IconeCroix() {
  return (
    <svg {...attributsIcone}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function IconeBoite() {
  return (
    <svg {...attributsIcone}>
      <path d="M3 8h18v11H3zM3 8l2-4h14l2 4M10 12h4" />
    </svg>
  )
}

function IconeRetour() {
  return (
    <svg {...attributsIcone}>
      <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" />
    </svg>
  )
}
