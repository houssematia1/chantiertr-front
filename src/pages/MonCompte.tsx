import { useSession } from '@/api/auth'
import { Registre } from '@/components/donnees/Registre'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Etat } from '@/components/donnees/Etat'

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
 * SON REGISTRE EST DESORMAIS `Registre`, extrait au lot 3. Il vivait ici en
 * propre ; trois ecrans l'emploient maintenant — mon compte, fiche entreprise, et
 * la fiche contact a venir — et une regle de densite tenue une fois vaut mieux
 * que la meme regle recopiee trois fois.
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
        <Registre
          titre="Identité"
          source="GET /api/v1/me"
          lignes={[
            { cle: 'Prénom', valeur: utilisateur.prenom },
            { cle: 'Nom', valeur: utilisateur.nom },
            { cle: 'E-mail', valeur: utilisateur.email },
            { cle: 'Téléphone', valeur: utilisateur.tel, numerique: true },
            { cle: 'Poste', valeur: utilisateur.poste },
            { cle: 'Rôle', valeur: utilisateur.role_label },
            {
              cle: 'Statut',
              contenu: <Etat statut={utilisateur.statut} libelle={utilisateur.statut_label} />,
            },
            { cle: 'Entreprise', valeur: utilisateur.company_name ?? null },
            { cle: 'Identifiant', valeur: utilisateur.id, numerique: true },
          ]}
        />
      </div>
    </>
  )
}
