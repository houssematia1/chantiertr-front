import { useSession } from '@/api/auth'
import { EnteteEcran } from '@/components/shell/EnteteEcran'

/**
 * « Mon compte » — le profil du compte connecte.
 *
 * IL PORTAIT SON PROPRE EN-TETE ET SA PROPRE DECONNEXION au lot 1, faute de
 * shell autour de lui. Les deux sont retires : `EnteteEcran` donne le titre, et
 * la deconnexion vit au pied de la barre laterale, ou elle est a sa place — une
 * action de session, pas une action d'ecran.
 *
 * IL RESTE PARTIEL. La tache 6 du plan y ajoutera la modification du profil et le
 * changement de mot de passe, contre `PATCH /account` et `PUT /account/password`.
 * En lecture seule, il prouve deja ce qu'il doit prouver : `GET /me` remonte, le
 * contexte se lit, et la densite du produit tient sur un ecran reel.
 *
 * Il est ecrit A LA DENSITE DU PRODUIT et non en carte vide au centre de
 * l'ecran : rembourrage de 12 px, lignes de 36 px, surbrillance au survol, filets
 * a la place des ombres — MASTER § 2 et § 6.
 *
 * LE REGISTRE PLUTOT QUE LES TUILES. Le prototype affichait ces valeurs en huit
 * pastilles de 190 px arrangees en grille fluide. Elles sont ici en lignes de
 * 36 px, libelle a gauche, valeur alignee a DROITE : c'est ce qui fait que le
 * telephone et l'identifiant — les deux seules donnees chiffrees de l'ecran —
 * tombent l'un sous l'autre au chiffre pres. MASTER § 4 : « un tableau de budget
 * doit se lire comme un registre, pas comme un tableau web. » L'ecran n'a pas de
 * budget, mais il a la meme regle.
 */
export function MonCompte() {
  const session = useSession()

  // La garde de route a deja resolu la session : ce retour ne se produit pas en
  // pratique, il ne sert qu'a etroitir le type.
  if (session.data == null) return null

  const { utilisateur } = session.data

  return (
    <>
      <EnteteEcran
        titre="Mon compte"
        precision="Vos informations, telles que la plateforme les connaît."
      />

      <div className="max-w-[1320px] p-3">
        <section className="bg-card border-line overflow-hidden rounded-6 border">
          {/* En-tete de panneau a la hauteur d'une ligne de tableau, 36 px. */}
          <div className="border-line bg-bg flex h-9 items-center justify-between gap-3 border-b px-3">
            <h2 className="text-13">Identité</h2>
            <span className="text-slate chiffres text-12">GET /api/v1/me</span>
          </div>

          <dl>
            <Ligne cle="Prénom" valeur={utilisateur.prenom} />
            <Ligne cle="Nom" valeur={utilisateur.nom} />
            <Ligne cle="E-mail" valeur={utilisateur.email} />
            <Ligne cle="Téléphone" valeur={utilisateur.tel} numerique />
            <Ligne cle="Poste" valeur={utilisateur.poste} />
            <Ligne cle="Rôle" valeur={utilisateur.role_label} />
            <Ligne cle="Statut">
              <Etat statut={utilisateur.statut} libelle={utilisateur.statut_label} />
            </Ligne>
            <Ligne cle="Entreprise" valeur={utilisateur.company_name ?? null} />
            <Ligne cle="Identifiant" valeur={utilisateur.id} numerique />
          </dl>
        </section>
      </div>
    </>
  )
}

/**
 * Une ligne du registre : 36 px, un filet dessous, surbrillance au survol.
 *
 * AUCUNE TRANSITION sur le survol. MASTER § 5 : une ligne de tableau est
 * survolee cent fois par jour, et la liste de rejet du plan nomme
 * explicitement « une animation sur un tableau ». Le fond change sec.
 *
 * `numerique` fait passer la valeur en Barlow tabulaire. Les valeurs
 * textuelles sont deja alignees a droite par la mise en page ; ce que la classe
 * ajoute, c'est la chasse fixe des chiffres, sans laquelle un `1` et un `8` ne
 * font pas la meme largeur et la colonne danse d'une ligne a l'autre.
 */
function Ligne({
  cle,
  valeur,
  numerique = false,
  children,
}: {
  cle: string
  valeur?: string | null
  numerique?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="border-line hover:bg-bg grid min-h-9 grid-cols-[minmax(110px,200px)_1fr] items-center gap-3 border-b px-3 last:border-b-0">
      {/* Libelle de colonne : Barlow Condensed, capitales, interlettrage ouvert —
          MASTER § 4. `--slate` sur `--card` vaut 5,44:1. */}
      <dt className="text-slate font-display tracking-colonne text-12 uppercase">{cle}</dt>
      <dd
        className={[
          'min-w-0 break-words',
          numerique ? 'colonne-chiffres' : 'text-right',
          children != null ? '' : valeur == null ? 'text-slate' : 'text-navy',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children ?? valeur ?? '—'}
      </dd>
    </div>
  )
}

/**
 * L'etat du compte, en pastille.
 *
 * C'est le seul endroit de l'ecran ou la couleur porte du sens, et elle le porte
 * legitimement : MASTER § 3 reserve le vert et le rouge au sens metier — valide,
 * depasse. Un compte en attente d'invitation prend l'ambre, qui ne s'ecrit jamais
 * et se contente de remplir, avec du marine dessus (5,79:1).
 *
 * MASTER § 7 : la couleur ne porte pas seule l'information — le libelle de l'API
 * est dans la pastille.
 */
function Etat({ statut, libelle }: { statut: string; libelle: string }) {
  const TONS: Record<string, string> = {
    actif: 'bg-green-wash text-green-strong',
    invite: 'bg-warn-fill text-on-warn-fill',
    archive: 'bg-danger text-on-danger',
  }

  return (
    <span
      className={`inline-block rounded-4 px-2 py-px text-12 font-medium ${TONS[statut] ?? 'bg-bg text-navy'}`}
    >
      {libelle}
    </span>
  )
}
