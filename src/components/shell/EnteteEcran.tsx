import type { ReactNode } from 'react'

/**
 * L'en-tete d'un ecran de la surface de travail.
 *
 * 56 px — `--header-height`, MASTER § 2 — et le meme filet bas que l'en-tete de la
 * barre laterale : les deux se rejoignent sans marche d'une colonne a l'autre.
 * C'est la seule raison pour laquelle cette hauteur est fixe plutot que dictee par
 * son contenu.
 *
 * `sticky top-0` : c'est `<main>` qui defile, pas la page. Le titre de l'ecran et
 * ses actions restent donc en vue quand un tableau de deux cents lignes descend
 * sous eux. Sans `bg-card`, le contenu se lirait au travers.
 *
 * LE TITRE EST UN `h1`. Il n'y en a qu'un par ecran, et il ne se repete pas dans
 * le corps : un `h1` puis un `h2` du meme libelle est le defaut le plus courant
 * d'une navigation au lecteur d'ecran.
 *
 * `actions` prend les boutons de l'ecran — « Inviter un compte », « Nouvelle
 * entreprise ». Ils sont A DROITE et dans l'en-tete, jamais flottants au-dessus du
 * contenu : un bouton flottant recouvre la derniere ligne du tableau, qui est
 * precisement celle qu'on vient d'ajouter.
 */
export interface EnteteEcranProps {
  titre: string
  /** Une precision courte sous le titre, quand le libelle ne suffit pas. */
  precision?: string
  actions?: ReactNode
}

export function EnteteEcran({ titre, precision, actions }: EnteteEcranProps) {
  return (
    <header className="border-line bg-card sticky top-0 z-10 flex h-(--header-height) items-center justify-between gap-3 border-b px-3">
      <div className="min-w-0">
        <h1 className="truncate text-16">{titre}</h1>
        {precision !== undefined && <p className="text-slate truncate text-12">{precision}</p>}
      </div>

      {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
