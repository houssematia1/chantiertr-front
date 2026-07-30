import { describe, expect, it } from 'vitest'

import type { Role } from '@/api/auth'
import { MENU, libelleDe, menuPour } from '@/navigation/menu'

/**
 * Ce que ces tests protegent.
 *
 * Le filtrage de la barre laterale est un CONFORT et non une securite — toutes
 * les policies `viewAny` de l'API rendent `true`, et le cloisonnement se joue
 * dans les requetes. Mais un confort qui se trompe se paie : une entree offerte
 * a un role qui ne peut rien en faire mene a un ecran refuse, et une entree
 * retiree a tort prive d'une fonctionnalite sans qu'aucune erreur ne paraisse.
 *
 * Les six roles sont couverts, pas seulement les deux qu'on a sous la main.
 */

const ROLES: readonly Role[] = [
  'superadmin',
  'super_admin_membre',
  'admin',
  'superviseur',
  'membre',
  'agent',
]

/** Les chemins que ce role voit, tous groupes confondus. */
function cheminsPour(role: Role): string[] {
  return menuPour(role).flatMap((groupe) => groupe.entrees.map((entree) => entree.chemin))
}

describe('le menu', () => {
  it('ouvre les entrees sans restriction a tous les roles', () => {
    // Le controle POSITIF, et il porte tout le fichier : sans lui, un `menuPour`
    // qui renverrait toujours un menu vide passerait chaque assertion negative.
    const ouvertes = MENU.flatMap((groupe) =>
      groupe.entrees.filter((entree) => entree.roles === undefined).map((entree) => entree.chemin),
    )

    expect(ouvertes).not.toHaveLength(0)

    for (const role of ROLES) {
      expect(cheminsPour(role)).toEqual(expect.arrayContaining(ouvertes))
    }
  })

  it('ne montre la grille des droits qu au super-administrateur plateforme', () => {
    // `RolePermissionPolicy::update()` teste `bypassesTenantScope()`, que seul
    // `superadmin` verifie. `super_admin_membre` est un role de PLATEFORME mais
    // reste cloisonne : il ne regle pas la grille, donc il ne la voit pas.
    expect(cheminsPour('superadmin')).toContain('/droits')

    for (const role of ROLES.filter((r) => r !== 'superadmin')) {
      expect(cheminsPour(role)).not.toContain('/droits')
    }
  })

  it('nomme l entreprise au pluriel pour qui traverse le cloisonnement', () => {
    const entree = MENU.flatMap((groupe) => groupe.entrees).find(
      (candidate) => candidate.chemin === '/mon-entreprise',
    )

    expect(entree).toBeDefined()
    if (entree === undefined) return

    // Le super-administrateur plateforme voit les adherents ; les autres voient la
    // leur. Le logiciel d'origine fait la meme distinction.
    expect(libelleDe(entree, 'superadmin')).toBe('Mes entreprises')

    for (const role of ROLES.filter((r) => r !== 'superadmin')) {
      expect(libelleDe(entree, role)).toBe('Mon entreprise')
    }
  })

  it('ne laisse jamais un titre de groupe sans entree', () => {
    // Un intitule de section suivi de rien se lit comme un defaut d'affichage. La
    // propriete vaut pour les six roles, y compris ceux qui filtrent le plus.
    for (const role of ROLES) {
      for (const groupe of menuPour(role)) {
        expect(groupe.entrees.length).toBeGreaterThan(0)
      }
    }
  })

  it('conserve l ordre du logiciel d origine', () => {
    // « Contacts » avant « Administration ». L'ordre n'est pas cosmetique : c'est
    // celui que les utilisateurs du logiciel d'origine connaissent, et les cinq
    // groupes a venir reprendront leur rang entre les deux.
    expect(menuPour('superadmin').map((groupe) => groupe.titre)).toEqual([
      'Contacts',
      'Administration',
    ])
  })

  it('ne declare aucun chemin en double', () => {
    // Deux entrees sur le meme chemin allumeraient toutes les deux l'etat actif.
    const chemins = MENU.flatMap((groupe) => groupe.entrees.map((entree) => entree.chemin))

    expect(new Set(chemins).size).toBe(chemins.length)
  })
})
