/**
 * La boite du logo d'une entreprise — 168 x 130.
 *
 * LES MESURES VIENNENT DE `ClientCard.vue` de l'application de l'equipe, relevees
 * dans son SCSS et non approchees : `width: 168px; height: 130px; background:
 * #f9f9f9; border-radius: 8px; box-shadow: 0 2px 4px rgba(23,35,50,.07)`, contenu
 * centre. C'est cette boite qui donne a la carte sa structure ; la retirer quand
 * il n'y a pas de logo ferait sauter le texte de 168 px d'une carte a l'autre.
 *
 * SANS LOGO, UN GLYPHE NEUTRE — un batiment, pas le logo de Chantier Tranquille.
 * Mettre notre marque dans la boite ferait porter notre logo par chaque fiche de
 * l'annuaire, y compris celles de nos clients et de leurs fournisseurs. Leur
 * application fait le meme choix, avec un `default-company-logo.png`.
 *
 * `object-contain` et non `cover` : un logo est un tracé, pas une photographie. Le
 * recadrer couperait un mot du nom de l'entreprise.
 */
export interface LogoEntrepriseProps {
  url: string | null | undefined
  /** La raison sociale — elle sert de texte alternatif. */
  nom: string
  /** Reduit la boite, pour la fiche ou l'espace est autrement occupe. */
  compact?: boolean
}

export function LogoEntreprise({ url, nom, compact = false }: LogoEntrepriseProps) {
  const taille = compact ? 'h-[104px] w-[134px]' : 'h-[130px] w-[168px]'

  return (
    <div
      className={`bg-bg shadow-logo grid shrink-0 place-items-center overflow-hidden rounded-8 ${taille}`}
    >
      {url == null || url === '' ? (
        <GlypheDeBatiment />
      ) : (
        <img
          src={url}
          // Le logo REPRESENTE l'entreprise : son texte alternatif est le nom, pas
          // « logo ». Un lecteur d'ecran qui annonce « logo » n'a rien annonce.
          alt={nom}
          className="h-full w-full object-contain p-2"
        />
      )}
    </div>
  )
}

/**
 * Le glyphe d'absence.
 *
 * `aria-hidden` : la carte porte deja le nom de l'entreprise en titre. Annoncer
 * « batiment » n'ajouterait rien et ferait lire deux fois la meme fiche.
 */
function GlypheDeBatiment() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="text-line-champ size-14"
    >
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" />
      <path d="M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01" />
    </svg>
  )
}
