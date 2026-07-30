import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import type { ContexteDeSession, Emprunt, Utilisateur } from '@/api/auth'
import { AppLayout } from '@/layouts/AppLayout'

/**
 * Ce que ces tests protegent, et pourquoi ils existent.
 *
 * ILS SONT NES D'UNE MUTATION SURVIVANTE. `BandeauEmprunt.test.tsx` prouve que le
 * bandeau dit ce qu'il faut ; `BarreLaterale.test.tsx` prouve que la barre filtre
 * juste. Aucun des deux ne prouvait que le SHELL les branche. Remplacer la
 * condition d'affichage du bandeau par `false` laissait les quarante-quatre tests
 * verts : un dispositif de securite parfaitement ecrit, et jamais montre.
 *
 * C'est la forme la plus couteuse d'angle mort — chaque piece est testee, et
 * l'assemblage ne l'est pas.
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

const EMPRUNT: Emprunt = {
  par: { id: '019fb0d2-c9a9-71d0-9529-814640b891ac', nom: 'Marie Berthier' },
}

function rendre(emprunt: Emprunt | null) {
  const contexte: ContexteDeSession = { utilisateur: UTILISATEUR, droits: [], emprunt }
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/mon-compte']}>
        <Routes>
          <Route element={<AppLayout contexte={contexte} />}>
            {/* Un enfant reel : c'est aussi ce qui verifie que l'`Outlet` du shell
                rend bien la route active. Sans lui, un shell qui oublierait
                l'`Outlet` passerait. */}
            <Route path="/mon-compte" element={<p>Contenu de l&apos;écran</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AppLayout', () => {
  it('rend l ecran de la route active', () => {
    rendre(null)

    // Le controle POSITIF : sans lui, un shell qui ne rendrait RIEN passerait
    // l'assertion « pas de bandeau » du test suivant.
    expect(screen.getByText("Contenu de l'écran")).toBeVisible()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('affiche le bandeau des qu un emprunt est en cours', () => {
    rendre(EMPRUNT)

    const bandeau = screen.getByRole('status')

    expect(bandeau).toHaveTextContent('Thomas Nguyen')
    expect(bandeau).toHaveTextContent('Marie Berthier')
  })

  it('ne l affiche pas hors emprunt', () => {
    rendre(null)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('place le bandeau au-dessus de la barre laterale', () => {
    rendre(EMPRUNT)

    const bandeau = screen.getByRole('status')
    const barre = screen.getByRole('navigation')

    // `DOCUMENT_POSITION_FOLLOWING` : la barre suit le bandeau dans le document.
    //
    // Ce n'est pas une verification de style pour le plaisir. Un bandeau loge DANS
    // la zone de contenu disparaitrait au defilement — precisement au moment ou
    // l'on oublie qu'on est dans le compte d'un autre. Il doit surmonter tout le
    // shell, barre laterale comprise.
    expect(bandeau.compareDocumentPosition(barre) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
