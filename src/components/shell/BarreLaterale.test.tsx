import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import type { ContexteDeSession, Role, Utilisateur } from '@/api/auth'
import { BarreLaterale } from '@/components/shell/BarreLaterale'

/**
 * Ce que ces tests protegent.
 *
 * `menu.test.ts` prouve que `menuPour()` filtre juste. Celui-ci prouve que la
 * barre laterale s'en SERT — avec le role du compte connecte, et pas avec une
 * valeur en dur. C'est deux choses differentes, et la seconde est celle qui casse
 * en silence : un `menuPour('superadmin')` ecrit par megarde donnerait une barre
 * parfaitement fonctionnelle, et tous les tests de `menu.test.ts` resteraient
 * verts.
 */

const UTILISATEUR: Utilisateur = {
  id: '019fb0e5-2655-72c4-bbb6-2faf4093fa07',
  prenom: 'Thomas',
  nom: 'Nguyen',
  email: 'membre@demo.test',
  tel: null,
  poste: null,
  role: 'membre',
  role_label: 'Membre',
  statut: 'actif',
  statut_label: 'Actif',
  company_id: '019fb0e5-2600-72c4-bbb6-000000000001',
  company_name: 'Bâtir Ensemble',
}

function contexte(role: Role, libelle: string): ContexteDeSession {
  return {
    utilisateur: { ...UTILISATEUR, role, role_label: libelle },
    droits: [],
    emprunt: null,
  }
}

function rendre(session: ContexteDeSession) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      {/* `MemoryRouter` : `NavLink` exige un routeur, et celui-ci n'a besoin
          d'aucune route declaree pour rendre ses liens. */}
      <MemoryRouter initialEntries={['/mon-compte']}>
        <BarreLaterale contexte={session} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Les libelles des entrees, dans l'ordre du rendu. */
function entrees(): string[] {
  return screen.getAllByRole('link').map((lien) => lien.textContent ?? '')
}

describe('BarreLaterale', () => {
  it('emploie le role du compte connecte, pas une valeur en dur', () => {
    rendre(contexte('membre', 'Membre'))

    // Le controle POSITIF d'abord : la barre rend bien des entrees.
    expect(entrees()).toContain('Entreprises')

    // Puis ce qui distingue le membre du super-administrateur. Si la barre
    // interrogeait `menuPour('superadmin')`, ces deux assertions tomberaient.
    expect(entrees()).toContain('Mon entreprise')
    expect(entrees()).not.toContain('Mes entreprises')
    expect(entrees()).not.toContain('Grille des droits')
  })

  it('ouvre la grille des droits au super-administrateur plateforme', () => {
    rendre(contexte('superadmin', 'Super-administrateur'))

    expect(entrees()).toContain('Grille des droits')
    expect(entrees()).toContain('Mes entreprises')
  })

  it('marque l entree active, et une seule', () => {
    rendre(contexte('membre', 'Membre'))

    // `aria-current="page"` est pose par `NavLink` : c'est la marque que les
    // technologies d'assistance lisent, et elle ne depend pas de la couleur.
    // MASTER § 7 : la couleur ne porte jamais seule une information.
    const actives = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('aria-current') === 'page')

    expect(actives).toHaveLength(1)
    expect(actives[0]).toHaveTextContent('Mon compte')
  })

  it('dit qui est connecte, dans quel role et dans quelle entreprise', () => {
    rendre(contexte('membre', 'Membre'))

    // L'entreprise n'est pas un agrement : un super-administrateur qui traverse le
    // cloisonnement doit voir a tout moment dans quel tenant il se trouve.
    const barre = screen.getByRole('navigation')

    expect(barre).toHaveTextContent('Thomas Nguyen')
    expect(barre).toHaveTextContent('Membre')
    expect(barre).toHaveTextContent('Bâtir Ensemble')
  })

  it('porte un nom accessible', () => {
    rendre(contexte('membre', 'Membre'))

    // Sans lui, un lecteur d'ecran annonce « navigation » sans dire laquelle — et
    // il y en aura deux quand les onglets d'un ecran arriveront.
    expect(screen.getByRole('navigation')).toHaveAccessibleName('Navigation principale')
  })
})
