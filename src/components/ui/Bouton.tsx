import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Bouton du produit.
 *
 * COULEUR. Le vert de l'action est `--green-strong` et NON `--green` : blanc sur
 * `--green` vaut 3,19:1, quand un libelle de 14 px exige 4,5:1. MASTER § 3 le dit
 * en une ligne — « aucun texte blanc sur `--green` » — et c'est exactement ce
 * qu'un bouton est. Le vert de la marque reste `--green` ; il vit dans le logo et
 * dans les indicateurs de route active, pas sous un libelle blanc.
 *
 * MASTER § 3 encore : le rouge garde son sens metier. La variante `destructif` ne
 * decore pas un bouton « Annuler » — elle ne sert qu'a une action qui detruit ou
 * qui retire.
 *
 * GEOMETRIE. Rayon 4 px — MASTER § 6, « precision, pas douceur ». Le prototype
 * arrondissait ses boutons a 10 px ; la charte donne les couleurs, MASTER donne
 * la geometrie. Aucune ombre : l'elevation est reservee aux modales, un bouton se
 * detache par sa couleur et par son filet.
 *
 * MOUVEMENT. Un seul effet, et il est obligatoire : `scale(0.97)` sur `:active`,
 * 140 ms — MASTER § 5, « sans lui, l'interface parait morte ». Le prototype
 * n'avait AUCUN retour de clic, et ecrivait `transition: .15s`, soit `all` : ici
 * les proprietes animees sont nommees une par une, sans quoi la geometrie
 * travaillerait aussi.
 */

type Variante = 'action' | 'neutre' | 'destructif'
type Taille = 'auth' | 'md' | 'sm'

const VARIANTES: Record<Variante, string> = {
  // L'action principale. Une par ecran.
  action: 'bg-green-strong text-on-green-strong hover:bg-green-deep',
  // Actions secondaires : fond de carte, filet, texte marine.
  neutre: 'bg-card text-navy border border-line hover:border-slate',
  destructif: 'bg-card text-danger border border-danger hover:bg-bg',
}

/**
 * Trois hauteurs, et leurs ecarts ne sont pas cosmetiques.
 *
 * `auth` fait 58 px, et son libelle est en Barlow Condensed 700 capitales : c'est
 * la geometrie de la maquette de connexion validee par le client. Elle ne vaut
 * QUE pour l'action unique d'un ecran sans session — « Se connecter », « Definir
 * le mot de passe ». Sur la surface de travail elle serait hors d'echelle.
 *
 * `md` fait 44 px : c'est la cible tactile minimale de MASTER § 7, et c'est la
 * taille des boutons de formulaire de la surface de travail.
 *
 * `sm` fait 36 px, soit exactement `--table-row-height` : c'est la taille des
 * boutons qui vivent DANS une barre d'actions ou une ligne de tableau, ou une
 * cible de 44 px casserait la densite que MASTER § 2 exige. 36 px reste tres
 * au-dela du minimum de 24 px de WCAG 2.5.8.
 */
const TAILLES: Record<Taille, string> = {
  auth: 'h-[58px] px-5 rounded-6 font-display font-bold text-[17.5px] uppercase tracking-[0.11em]',
  md: 'h-11 px-4 text-14 rounded-4 font-medium',
  sm: 'h-9 px-3 text-13 rounded-4 font-medium',
}

export interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  taille?: Taille
  /** Occupe toute la largeur disponible et centre son contenu. */
  pleineLargeur?: boolean
  children: ReactNode
}

export function Bouton({
  variante = 'action',
  taille = 'md',
  pleineLargeur = false,
  className = '',
  type = 'button',
  children,
  ...reste
}: BoutonProps) {
  return (
    <button
      type={type}
      className={[
        // Un bouton est une ligne : il ne se coupe jamais.
        //
        // LA GRAISSE N'EST PAS ICI mais dans chaque taille. Tailwind ne resout
        // pas les conflits d'utilitaires par l'ordre de la CHAINE de classes,
        // mais par l'ordre du CSS genere : un `font-medium` de base et un
        // `font-bold` de taille se disputeraient la propriete, et le gagnant
        // dependrait de l'ordre interne de Tailwind, pas du notre.
        'inline-flex items-center justify-center gap-2 whitespace-nowrap',
        // Retour de clic. Trois proprietes nommees, jamais `all`.
        'transition-[background-color,border-color,transform] duration-140 ease-out',
        'active:scale-[0.97]',
        // Desactive, il ne repond plus et le dit.
        'disabled:cursor-not-allowed disabled:opacity-50',
        'disabled:active:scale-100',
        VARIANTES[variante],
        TAILLES[taille],
        pleineLargeur ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...reste}
    >
      {children}
    </button>
  )
}
