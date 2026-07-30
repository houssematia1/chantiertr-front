import { Link } from 'react-router'
import type { ComponentProps, ReactNode } from 'react'

import { classesDeBouton } from '@/components/ui/apparenceDeBouton'
import type { Taille, Variante } from '@/components/ui/apparenceDeBouton'

/**
 * Un lien qui a l'aspect d'un bouton.
 *
 * IL EXISTE PARCE QUE « NOUVELLE ENTREPRISE » NAVIGUE. Un `<button>` qui appelle
 * `navigate()` a l'air identique et perd quatre choses : le clic du milieu, le
 * « ouvrir dans un nouvel onglet », l'infobulle de destination du navigateur, et
 * l'annonce « lien » d'un lecteur d'ecran. Aucune n'est un detail pour qui
 * travaille a deux onglets ouverts.
 *
 * La reciproque vaut : ce composant ne sert JAMAIS a declencher une action. Un
 * lien qui enregistre est un lien qu'un navigateur peut precharger.
 */
export interface BoutonLienProps extends ComponentProps<typeof Link> {
  variante?: Variante
  taille?: Taille
  pleineLargeur?: boolean
  children: ReactNode
}

export function BoutonLien({
  variante = 'action',
  taille = 'md',
  pleineLargeur = false,
  className = '',
  children,
  ...reste
}: BoutonLienProps) {
  return (
    <Link
      className={[classesDeBouton({ variante, taille, pleineLargeur }), className]
        .filter(Boolean)
        .join(' ')}
      {...reste}
    >
      {children}
    </Link>
  )
}
