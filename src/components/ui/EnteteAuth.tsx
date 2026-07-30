/**
 * L'en-tete d'un ecran sans session.
 *
 * ELLE N'EXISTE PAS SUR LA CONNEXION, et c'est une decision du client — MASTER
 * § 10, decision 2 : « le volet droit ne porte aucun texte d'accompagnement ».
 * Sur la connexion, deux champs libelles « Adresse e-mail » et « Mot de passe »
 * suffisent a dire ce que l'ecran attend ; un titre « Connexion » au-dessus ne
 * ferait que le repeter.
 *
 * ELLE EXISTE SUR LES AUTRES, et pour la raison inverse : « Mot de passe oublie »,
 * « Bienvenue », « Nouveau mot de passe » ne sont PAS deductibles des champs.
 * Arriver au bout d'un lien de courriel sur deux champs de mot de passe sans
 * titre, c'est ne pas savoir ce qu'on est en train de faire. L'absence de texte
 * est une elegance sur un ecran evident ; c'est une faute sur un ecran qui ne
 * l'est pas.
 *
 * Ce composant remplace `PaveAuth`, qui dessinait en plus une carte de 360 px
 * centree sur un fond gris. Cette carte a disparu : le volet du formulaire de
 * `AuthLayout` EST la surface, il n'y a plus rien a poser dessus.
 */
export interface EnteteAuthProps {
  titre: string
  /** Une phrase, pas un paragraphe : elle dit ce que l'ecran attend. */
  sousTitre: string
}

export function EnteteAuth({ titre, sousTitre }: EnteteAuthProps) {
  return (
    <div className="mb-7">
      {/*
       * 26 px et non 76 : le titre d'affiche du volet marine est une couverture,
       * celui-ci est une consigne. Les mettre a la meme echelle les ferait se
       * disputer l'ecran.
       */}
      <h1 className="font-affiche text-[26px] leading-titre font-bold uppercase tracking-[0.02em]">
        {titre}
      </h1>
      <p className="text-slate mt-2 max-w-[36ch] text-14">{sousTitre}</p>
    </div>
  )
}
