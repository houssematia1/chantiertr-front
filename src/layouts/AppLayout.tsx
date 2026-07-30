import { Outlet } from 'react-router'

import type { ContexteDeSession } from '@/api/auth'
import { BandeauEmprunt } from '@/components/shell/BandeauEmprunt'
import { BarreLaterale } from '@/components/shell/BarreLaterale'

/**
 * Le shell de l'application connectee.
 *
 * TROIS DECISIONS DE MISE EN PAGE, et chacune a une raison.
 *
 * **`h-dvh` avec `overflow-hidden`, et le defilement a l'interieur.** Un tableau
 * de budget a deux cents lignes ; si c'est la PAGE qui defile, l'en-tete et la
 * barre laterale partent vers le haut, et un conducteur de travaux qui cherche la
 * ligne 150 perd le nom des colonnes et le menu en meme temps. Ici seule la zone
 * de contenu defile.
 *
 * **Le bandeau d'emprunt est au-dessus de TOUT**, barre laterale comprise. Un
 * bandeau logé dans la zone de contenu disparaitrait au defilement, precisement
 * quand on oublie qu'on est dans le compte d'un autre.
 *
 * **Aucune ombre portee.** MASTER § 6 : les filets separent, l'elevation est
 * reservee aux modales et aux popovers. Le shell est la surface, pas un calque.
 *
 * Le layout precedent n'existait pas : la route `/` rendait directement l'ecran
 * de profil, sans navigation. C'etait l'echafaudage du lot 1.
 */
export interface AppLayoutProps {
  contexte: ContexteDeSession
}

export function AppLayout({ contexte }: AppLayoutProps) {
  return (
    <div className="bg-bg flex h-dvh flex-col overflow-hidden">
      {contexte.emprunt !== null && (
        <BandeauEmprunt
          emprunt={contexte.emprunt}
          nomEmprunte={`${contexte.utilisateur.prenom} ${contexte.utilisateur.nom}`}
        />
      )}

      <div className="flex min-h-0 flex-1">
        <BarreLaterale contexte={contexte} />

        {/*
         * `min-w-0` est INDISPENSABLE et non defensif : sans lui, un tableau large
         * pousse ce conteneur flex au-dela de son parent — la valeur par defaut de
         * `min-width` pour un enfant flex est `auto`, donc la taille de son
         * contenu — et c'est la BARRE LATERALE qui se fait comprimer.
         */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
