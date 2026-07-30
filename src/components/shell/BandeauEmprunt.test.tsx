import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { BandeauEmprunt } from '@/components/shell/BandeauEmprunt'

/**
 * Ce que ces tests protegent.
 *
 * LE BANDEAU EST LA PIECE MANQUANTE D'UN DISPOSITIF DE SECURITE. Tout l'emprunt
 * de compte cote API — lecture seule, trace, refus d'emprunter un compte de
 * plateforme — repose sur un postulat : que l'operateur SACHE dans quel compte il
 * se trouve. Un bandeau qui ne nomme pas le compte emprunte, ou qui nomme
 * l'emprunteur a sa place, laisse un super-administrateur lire les donnees d'un
 * adherent en croyant lire les siennes.
 *
 * Les deux noms sont donc verifies SEPAREMENT et avec des valeurs distinctes : un
 * test qui les intervertirait sans le voir ne protegerait rien.
 */

function rendre(noeud: ReactNode) {
  // Le bandeau porte une mutation : il lui faut un client. `retry: false` pour
  // qu'un echec ne fasse pas attendre le test.
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })

  return render(<QueryClientProvider client={client}>{noeud}</QueryClientProvider>)
}

const EMPRUNT = { par: { id: '019fb0d2-c9a9-71d0-9529-814640b891ac', nom: 'Marie Berthier' } }

describe('BandeauEmprunt', () => {
  it('nomme le compte emprunte ET l emprunteur, chacun a sa place', () => {
    rendre(<BandeauEmprunt emprunt={EMPRUNT} nomEmprunte="Thomas Nguyen" />)

    // Le compte dans lequel on se trouve est en emphase : c'est l'information dont
    // depend la lecture de tout l'ecran.
    expect(screen.getByText('Thomas Nguyen').tagName).toBe('STRONG')

    // Et l'emprunteur figure aussi, sans emphase. Les deux noms diffèrent dans ce
    // test : les intervertir ferait tomber l'une des deux assertions.
    expect(screen.getByRole('status')).toHaveTextContent(
      'Vous agissez en tant que Thomas Nguyen. Session en lecture seule, ouverte par Marie Berthier et tracée.',
    )
  })

  it('annonce la lecture seule', () => {
    rendre(<BandeauEmprunt emprunt={EMPRUNT} nomEmprunte="Thomas Nguyen" />)

    // `ImpersonationReadOnly` refuse toute ecriture cote API. Ne pas le dire
    // laisserait l'operateur decouvrir la restriction en essuyant un refus.
    expect(screen.getByRole('status')).toHaveTextContent('lecture seule')
  })

  it('est un etat et non un evenement', () => {
    rendre(<BandeauEmprunt emprunt={EMPRUNT} nomEmprunte="Thomas Nguyen" />)

    // `role="status"` et non `role="alert"` : un emprunt dure. `alert`
    // interromprait la lecture a chaque navigation.
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('offre la sortie', () => {
    rendre(<BandeauEmprunt emprunt={EMPRUNT} nomEmprunte="Thomas Nguyen" />)

    // Sans ce bouton, la seule sortie serait la deconnexion — qui ferait
    // reconnecter le super-administrateur a la main.
    expect(screen.getByRole('button', { name: 'Reprendre mon compte' })).toBeEnabled()
  })
})
