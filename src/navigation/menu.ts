import type { Role } from '@/api/auth'

/**
 * La barre laterale, entree par entree.
 *
 * LA STRUCTURE VIENT DU LOGICIEL D'ORIGINE, pas d'une invention. Elle est
 * relevee dans sa render function precompilee, et son ordre est le suivant :
 *
 *   Tableau de bord
 *   Pilotage             Projets · Suivi vente · Suivi production · Planning
 *   Contacts             Entreprises · Contacts
 *   Finance client       Devis · Factures
 *   Finance fournisseur  Achat · Depense · Facture fournisseur
 *   Configuration        Modeles · Bibliotheque · GED · Fichier entreprise
 *   Administration       Mes entreprises / Mon entreprise · Utilisateurs · Mon compte
 *
 * SEULES LES ENTREES DONT L'ECRAN EXISTE FIGURENT ICI. Les cinq groupes absents
 * arriveront avec M1 a M7. Une entree grisee « a venir » serait une promesse
 * affichee : elle occupe la place, elle se clique, et elle ne mene nulle part.
 * L'ordre ci-dessus est conserve en commentaire pour que les groupes reprennent
 * leur rang le jour ou ils arrivent, plutot que de s'empiler dans l'ordre de
 * livraison.
 *
 * LE FILTRAGE PAR ROLE EST UN CONFORT, PAS UNE SECURITE. Toutes les policies
 * `viewAny` de l'API rendent `true` : le cloisonnement se joue dans les
 * requetes, par `TenantScope`, et dans les policies par enregistrement. Cacher
 * une entree evite de montrer un ecran vide ou une action refusee ; cela ne
 * protege rien. Un `curl` obtient exactement ce que la policy accorde, ni plus
 * ni moins.
 */

export interface EntreeDeMenu {
  chemin: string
  libelle: string
  /**
   * Les roles qui voient l'entree. `null` vaut « tous ».
   *
   * Un tableau explicite plutot qu'un predicat : la liste se relit contre les
   * policies de l'API, et une entree ajoutee demain ne peut pas emporter une
   * logique inattendue.
   */
  roles?: readonly Role[]
  /**
   * Le libelle depend du role — c'est le cas de « Mes entreprises » contre
   * « Mon entreprise ». Le logiciel d'origine fait la meme distinction.
   */
  libelleParRole?: Partial<Record<Role, string>>
}

export interface GroupeDeMenu {
  titre: string
  entrees: readonly EntreeDeMenu[]
}

/** Les roles de plateforme, ceux qui voient au-dela d'une seule entreprise. */
const PLATEFORME: readonly Role[] = ['superadmin']

export const MENU: readonly GroupeDeMenu[] = [
  {
    titre: 'Contacts',
    entrees: [
      { chemin: '/entreprises', libelle: 'Entreprises' },
      { chemin: '/contacts', libelle: 'Contacts' },
    ],
  },
  {
    titre: 'Administration',
    entrees: [
      {
        chemin: '/mon-entreprise',
        libelle: 'Mon entreprise',
        // Le super-administrateur plateforme traverse le cloisonnement :
        // l'ecran lui liste les adherents, aux autres il montre la leur.
        libelleParRole: { superadmin: 'Mes entreprises' },
      },
      { chemin: '/comptes', libelle: 'Utilisateurs' },
      {
        chemin: '/droits',
        libelle: 'Grille des droits',
        // `RolePermissionPolicy::viewAny()` rend `true` : l'API laisse tout
        // compte LIRE la grille. L'entree est pourtant reservee au
        // super-administrateur, parce que lui seul peut la REGLER
        // (`update()` teste `bypassesTenantScope()`). Pour un administrateur, ce
        // serait un tableau de dix-huit cases qu'il ne peut pas toucher,
        // decrivant des profils dont deux ne sont pas le sien. Ses propres
        // droits se lisent la ou ils agissent : un bouton parait, ou non.
        roles: PLATEFORME,
      },
      { chemin: '/mon-compte', libelle: 'Mon compte' },
    ],
  },
]

/** Le libelle a afficher pour ce role. */
export function libelleDe(entree: EntreeDeMenu, role: Role): string {
  return entree.libelleParRole?.[role] ?? entree.libelle
}

/**
 * Le menu tel que ce role le voit, groupes vides retires.
 *
 * Un groupe dont toutes les entrees sont filtrees ne doit pas laisser son titre
 * seul : un intitule de section sans rien dessous se lit comme un defaut
 * d'affichage.
 */
export function menuPour(role: Role): readonly GroupeDeMenu[] {
  return MENU.map((groupe) => ({
    ...groupe,
    entrees: groupe.entrees.filter(
      (entree) => entree.roles === undefined || entree.roles.includes(role),
    ),
  })).filter((groupe) => groupe.entrees.length > 0)
}
