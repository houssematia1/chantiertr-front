/**
 * L'apparence d'un bouton, sortie de `Bouton.tsx`.
 *
 * ELLE VIT DANS SON PROPRE MODULE POUR UNE RAISON DE HARNAIS, pas de gout : un
 * fichier qui exporte a la fois des composants et des valeurs casse le
 * rafraichissement a chaud de Vite, et `react-refresh/only-export-components` le
 * refuse. Deux consommateurs la partagent — `Bouton`, qui est un `<button>`, et
 * `BoutonLien`, qui est une ancre.
 *
 * POURQUOI DEUX COMPOSANTS ET UNE SEULE APPARENCE. « Nouvelle entreprise »
 * NAVIGUE : un `<button>` qui appelle `navigate()` a l'air identique et perd le
 * clic du milieu, le « ouvrir dans un nouvel onglet », l'infobulle de destination
 * et l'annonce « lien » d'un lecteur d'ecran. Ce doit etre une ancre. Mais une
 * ancre n'a pas d'attribut `disabled`, et `active:scale` n'a pas de sens sur un
 * lien : les deux composants divergent la, et nulle part ailleurs.
 */

export type Variante = 'action' | 'neutre' | 'destructif'
export type Taille = 'auth' | 'md' | 'sm'

/**
 * COULEUR. Le vert de l'action est `--green-strong` et NON `--green` : blanc sur
 * `--green` vaut 3,19:1, quand un libelle de 14 px exige 4,5:1. MASTER § 3 le dit
 * en une ligne — « aucun texte blanc sur `--green` ».
 *
 * MASTER § 3 encore : le rouge garde son sens metier. La variante `destructif` ne
 * decore pas un bouton « Annuler » — elle ne sert qu'a une action qui detruit ou
 * qui retire.
 */
export const VARIANTES: Record<Variante, string> = {
  // L'action principale. Une par ecran.
  action: 'bg-green-strong text-on-green-strong hover:bg-green-deep',
  // Actions secondaires : fond de carte, filet, texte marine.
  neutre: 'bg-card text-navy border border-line hover:border-slate',
  destructif: 'bg-card text-danger border border-danger hover:bg-bg',
}

/**
 * Trois hauteurs, et leurs ecarts ne sont pas cosmetiques.
 *
 * `auth` fait 58 px, libelle en Barlow Condensed 700 capitales : c'est la
 * geometrie de la maquette de connexion validee par le client. Elle ne vaut QUE
 * pour l'action unique d'un ecran sans session.
 *
 * `md` fait 44 px : la cible tactile minimale de MASTER § 7, et la taille des
 * boutons de formulaire de la surface de travail.
 *
 * `sm` fait 36 px, soit exactement `--table-row-height` : la taille des boutons
 * qui vivent DANS une barre d'actions ou une ligne de tableau, ou une cible de
 * 44 px casserait la densite que MASTER § 2 exige. 36 px reste tres au-dela du
 * minimum de 24 px de WCAG 2.5.8.
 *
 * LA GRAISSE EST DANS CHAQUE TAILLE et non dans les classes de base : Tailwind ne
 * resout pas les conflits d'utilitaires par l'ordre de la CHAINE de classes mais
 * par l'ordre du CSS genere. Un `font-medium` de base et un `font-bold` de taille
 * se disputeraient la propriete, et le gagnant dependrait de l'ordre interne de
 * Tailwind, pas du notre.
 */
export const TAILLES: Record<Taille, string> = {
  auth: 'h-[58px] px-5 rounded-8 font-affiche font-bold text-[17.5px] uppercase tracking-[0.11em]',
  md: 'h-11 px-4 text-14 rounded-8 font-medium',
  sm: 'h-9 px-3 text-13 rounded-8 font-medium',
}

/**
 * Les classes communes aux deux composants.
 *
 * `active:scale` et les etats desactives n'y sont PAS : ils ne s'appliquent qu'a
 * un `<button>`. Un lien qu'on veut desactiver ne se rend pas, il disparait.
 */
export function classesDeBouton({
  variante = 'action',
  taille = 'md',
  pleineLargeur = false,
}: {
  variante?: Variante
  taille?: Taille
  pleineLargeur?: boolean
}): string {
  return [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'transition-[background-color,border-color] duration-140 ease-out',
    VARIANTES[variante],
    TAILLES[taille],
    pleineLargeur ? 'w-full' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
