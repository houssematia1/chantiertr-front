import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { ReseauError } from '@/lib/http'
import { router } from '@/router'
import '@/styles/index.css'

/**
 * Etat serveur : TanStack Query, et lui seul.
 *
 * Aucune donnee de l'API n'est recopiee dans un magasin global. C'est la
 * consigne du plan, et la raison en est concrete : deux copies de la meme
 * donnee divergent, et l'ecart se voit a l'ecran avant de se voir dans le code.
 */
const client = new QueryClient({
  defaultOptions: {
    queries: {
      // Une erreur d'authentification ou de validation ne se repare pas en
      // reessayant. Seule une coupure reseau le merite, et une fois.
      retry: (nombreEchecs, erreur) => erreur instanceof ReseauError && nombreEchecs < 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

const racine = document.getElementById('racine')

if (racine === null) {
  throw new Error("L'élément racine est absent du document.")
}

createRoot(racine).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
