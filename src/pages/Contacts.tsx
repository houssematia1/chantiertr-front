import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { useEntreprises } from '@/api/entreprises'
import { useContacts, useRetirerContactDuCarnet } from '@/api/contacts'
import type { Contact } from '@/api/contacts'
import { CarteDeSection, TableauSouple, ValeurDeCellule } from '@/components/donnees/TableauSouple'
import type { ColonneSouple } from '@/components/donnees/TableauSouple'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Alerte } from '@/components/ui/Alerte'
import { BoutonLien } from '@/components/ui/BoutonLien'
import { Champ } from '@/components/ui/Champ'
import { Selecteur } from '@/components/ui/Selecteur'
import { messageDErreur } from '@/lib/erreurs'
import { contient, contientChiffres } from '@/lib/recherche'

/**
 * Le carnet de contacts.
 *
 * LA MISE EN PAGE EST UN TABLEAU SOUPLE DANS UNE CARTE DE SECTION, reprise de leur
 * `ClientContacts.vue` : en-tetes en capitales grises, lignes de 60 px formant un
 * bloc, valeurs coupees avec le texte entier en infobulle. Ce n'est pas la carte
 * des entreprises, et c'est voulu : une personne a cinq colonnes qu'on compare
 * d'une ligne a l'autre.
 *
 * LE MODELE A DEUX AXES, et l'ecran doit les distinguer sans les expliquer :
 * `company_id` dit qui EMPLOIE la personne, le carnet dit qui la DETIENT. La
 * colonne « Entreprise » montre le premier ; la presence de la ligne dans la liste
 * atteste le second. Le filtre par entreprise porte donc sur l'employeur, et il
 * RESTREINT le carnet — il ne va jamais chercher les contacts d'une entreprise
 * qu'on ne detient pas. L'API s'en charge, le front n'a pas a le redire.
 *
 * `access_role` N'EST PAS UNE LISTE FERMEE cote API. Il est affiche tel quel, en
 * puce, sans etre traduit ni contraint : le logiciel d'origine y met
 * Administrateur, Superviseur et Agent, mais accepte ce qu'il trouve.
 */
export function Contacts() {
  const [recherche, setRecherche] = useState('')
  const [employeur, setEmployeur] = useState('')

  const contacts = useContacts(employeur === '' ? undefined : employeur)
  const entreprises = useEntreprises()
  const retrait = useRetirerContactDuCarnet()

  const tous = useMemo(() => contacts.data ?? [], [contacts.data])

  const visibles = useMemo(
    () =>
      recherche.trim() === ''
        ? tous
        : tous.filter(
            (contact) =>
              contient(recherche, [
                contact.nom_complet,
                contact.email,
                contact.poste,
                contact.company_name,
              ]) || contientChiffres(recherche, contact.portable),
          ),
    [tous, recherche],
  )

  /**
   * Les employeurs proposes au filtre.
   *
   * Ils viennent des CONTACTS et non de l'annuaire complet : filtrer sur une
   * entreprise dont on ne detient aucun contact rendrait toujours une liste vide,
   * et une option qui ne peut que decevoir n'a rien a faire dans un filtre.
   *
   * `entreprises` sert quand meme : il donne le nom d'un employeur dont aucun
   * contact n'est encore visible — cas du carnet fraichement filtre.
   */
  const employeurs = useMemo(() => {
    const parId = new Map<string, string>()

    for (const contact of tous) {
      if (contact.company_name != null && contact.company_name !== '') {
        parId.set(contact.company_id, contact.company_name)
      }
    }

    // Si le filtre est actif, son entreprise doit rester dans la liste meme quand
    // elle n'a plus de contact visible — sinon l'option disparait sous le curseur
    // et le filtre devient impossible a lever.
    if (employeur !== '' && !parId.has(employeur)) {
      const trouvee = (entreprises.data ?? []).find((e) => e.id === employeur)
      if (trouvee !== undefined) parId.set(trouvee.id, trouvee.name)
    }

    return [...parId.entries()]
      .map(([valeur, libelle]) => ({ valeur, libelle }))
      .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'))
  }, [tous, employeur, entreprises.data])

  const colonnes = useMemo(
    () =>
      colonnesDuCarnet({
        enCours: retrait.isPending,
        onRetirer: (id) => {
          retrait.mutate(id)
        },
      }),
    [retrait],
  )

  return (
    <>
      <EnteteEcran
        titre="Contacts"
        precision="Les personnes de votre carnet, et celles de vos entreprises."
        actions={
          <BoutonLien to="/contacts/nouveau" taille="sm">
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
            Nouveau contact
          </BoutonLien>
        }
      />

      <div className="max-w-[1400px] p-6">
        {contacts.error != null && <Alerte ton="erreur">{messageDErreur(contacts.error)}</Alerte>}
        {retrait.error != null && <Alerte ton="erreur">{messageDErreur(retrait.error)}</Alerte>}

        <CarteDeSection
          titre="Contacts"
          compte={visibles.length}
          action={
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-52">
                <Selecteur
                  libelle="Entreprise"
                  value={employeur}
                  onChange={setEmployeur}
                  options={[{ valeur: '', libelle: 'Toutes les entreprises' }, ...employeurs]}
                />
              </div>

              <div className="w-64">
                <Champ
                  libelle="Rechercher"
                  type="search"
                  placeholder="Nom, e-mail, téléphone"
                  value={recherche}
                  onChange={(evenement) => {
                    setRecherche(evenement.target.value)
                  }}
                />
              </div>
            </div>
          }
        >
          <TableauSouple
            legende="Carnet de contacts"
            colonnes={colonnes}
            lignes={visibles}
            clefDeLigne={(contact) => contact.id}
            vide={contacts.isPending ? '…' : messageDeVide({ recherche, employeur })}
          />
        </CarteDeSection>
      </div>
    </>
  )
}

/**
 * Les colonnes du carnet.
 *
 * L'ordre est celui de leur ecran : le nom, l'employeur, le telephone, le
 * courriel, le poste, et le role a droite. Le nom porte un pictogramme de
 * personne et le lien vers la fiche — un `role="row"` ne peut pas etre une ancre.
 */
function colonnesDuCarnet({
  enCours,
  onRetirer,
}: {
  enCours: boolean
  onRetirer: (id: string) => void
}): ColonneSouple<Contact>[] {
  return [
    {
      clef: 'nom',
      titre: 'Nom',
      large: true,
      rendu: (contact) => (
        <>
          <IconePersonne />
          <Link
            to={`/contacts/${contact.id}`}
            title={contact.nom_complet}
            className="text-navy hover:text-green-strong truncate font-medium"
          >
            {contact.nom_complet}
          </Link>
        </>
      ),
    },
    {
      clef: 'entreprise',
      titre: 'Entreprise',
      rendu: (contact) =>
        contact.company_name == null ? (
          <ValeurDeCellule valeur={null} />
        ) : (
          // L'employeur mene a sa fiche : c'est le seul lien entre les deux
          // annuaires, et il sert a chaque fois qu'on cherche « qui est cette
          // societe pour laquelle il travaille ».
          <Link
            to={`/entreprises/${contact.company_id}`}
            title={contact.company_name}
            className="hover:text-green-strong truncate"
          >
            {contact.company_name}
          </Link>
        ),
    },
    {
      clef: 'portable',
      titre: 'Téléphone',
      rendu: (contact) => <ValeurDeCellule valeur={contact.portable} numerique />,
    },
    {
      clef: 'email',
      titre: 'E-mail',
      large: true,
      rendu: (contact) =>
        contact.email == null || contact.email === '' ? (
          <ValeurDeCellule valeur={null} />
        ) : (
          // `mailto:` — un carnet d'adresses sert a ecrire. Sans lui, il faut
          // selectionner une adresse coupee en points de suspension.
          <a
            href={`mailto:${contact.email}`}
            title={contact.email}
            className="hover:text-green-strong truncate"
          >
            {contact.email}
          </a>
        ),
    },
    {
      clef: 'poste',
      titre: 'Poste',
      rendu: (contact) => <ValeurDeCellule valeur={contact.poste} />,
    },
    {
      clef: 'acces',
      titre: 'Rôle',
      fin: true,
      rendu: (contact) => (
        <>
          {contact.access_role != null && contact.access_role !== '' && (
            <span className="bg-line text-navy rounded-34 px-2.5 py-1 text-[0.78rem] whitespace-nowrap">
              {contact.access_role}
            </span>
          )}

          <button
            type="button"
            aria-label={`Retirer ${contact.nom_complet} de mon carnet`}
            disabled={enCours}
            onClick={() => {
              onRetirer(contact.id)
            }}
            className="border-line text-slate hover:text-danger hover:border-danger grid size-7.5 shrink-0 place-items-center rounded-6 border disabled:opacity-40"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </>
      ),
    },
  ]
}

/**
 * Le pictogramme de personne.
 *
 * Leur ecran met ici une icone qui distingue le contact INSCRIT de celui EN
 * ATTENTE — un logo d'entreprise contre une horloge. Notre API ne dit pas si un
 * contact a un compte : le pictogramme est donc neutre, et il le restera tant que
 * `ContactResource` ne rendra pas l'information. Un glyphe qui affirmerait une
 * inscription que le front ignore serait une affirmation fausse.
 */
function IconePersonne() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className="text-slate size-4 shrink-0"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" />
    </svg>
  )
}

/**
 * Ce que dit un carnet vide.
 *
 * TROIS CAS, et les confondre fait chercher une donnee qui existe : la recherche
 * exclut tout, le filtre d'employeur exclut tout, ou le carnet est reellement
 * vide.
 */
function messageDeVide({ recherche, employeur }: { recherche: string; employeur: string }): string {
  if (recherche.trim() !== '') {
    return `Aucun contact ne correspond à « ${recherche.trim()} ».`
  }

  if (employeur !== '') {
    return "Aucun contact de cette entreprise dans votre carnet. Le filtre restreint votre carnet, il n'y ajoute rien."
  }

  return 'Votre carnet est vide. Les fiches que vous créez y entrent automatiquement.'
}
