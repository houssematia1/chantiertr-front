import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Champ } from '@/components/ui/Champ'

/**
 * Ce que ces tests protegent.
 *
 * La bascule « afficher / masquer » a trois etats qui doivent rester d'accord
 * entre eux : le `type` de l'input, le NOM ACCESSIBLE du bouton, et le glyphe.
 * Trois sources, une seule verite. Un `useState` mal cable en desynchronise deux
 * sur trois sans qu'aucun test de rendu ne s'en apercoive — le champ s'affiche,
 * le bouton s'affiche, et le lecteur d'ecran annonce le contraire de ce qui se
 * passe.
 *
 * Les assertions sur le libelle et sur `aria-describedby` verifient les exigences
 * de MASTER § 7 que ce composant est le seul a tenir : « libelle visible sur
 * chaque champ », « erreur affichee sous le champ concerne ».
 */
describe('Champ', () => {
  it('lie son libelle a sa saisie', () => {
    render(<Champ libelle="Adresse e-mail" type="email" />)

    // `getByLabelText` ne trouve le champ QUE si `htmlFor` et `id` se
    // correspondent. C'est donc la liaison qui est testee, pas la presence d'un
    // texte a l'ecran.
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('type', 'email')
  })

  it('masque le mot de passe par defaut et ne montre aucune bascule sans `revelable`', () => {
    render(<Champ libelle="Mot de passe" type="password" />)

    expect(screen.getByLabelText('Mot de passe')).toHaveAttribute('type', 'password')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  describe('la bascule de revelation', () => {
    it('revele puis remasque, et son nom accessible suit son effet', async () => {
      const utilisateur = userEvent.setup()
      render(<Champ libelle="Mot de passe" type="password" revelable />)

      const saisie = screen.getByLabelText('Mot de passe')
      const bascule = screen.getByRole('button')

      // Au repos : masque, et le bouton annonce ce que son activation FERA.
      expect(saisie).toHaveAttribute('type', 'password')
      expect(bascule).toHaveAccessibleName('Afficher le mot de passe')

      await utilisateur.click(bascule)

      expect(saisie).toHaveAttribute('type', 'text')
      expect(bascule).toHaveAccessibleName('Masquer le mot de passe')

      await utilisateur.click(bascule)

      // Retour a l'etat initial : la bascule est une bascule, pas un aller simple.
      expect(saisie).toHaveAttribute('type', 'password')
      expect(bascule).toHaveAccessibleName('Afficher le mot de passe')
    })

    it('garde le focus sur la bascule apres activation', async () => {
      const utilisateur = userEvent.setup()
      render(<Champ libelle="Mot de passe" type="password" revelable />)

      const bascule = screen.getByRole('button')
      await utilisateur.click(bascule)

      // La maquette de reference renvoyait le focus dans le champ. Au clavier,
      // c'est desorientant : on perd le bouton qu'on vient d'actionner et on ne
      // peut plus le rebasculer sans revenir en arriere dans l'ordre de
      // tabulation.
      expect(bascule).toHaveFocus()
    })

    it("n'est pas atteignable au clavier avant la saisie qu'elle commande", async () => {
      const utilisateur = userEvent.setup()
      render(<Champ libelle="Mot de passe" type="password" revelable />)

      await utilisateur.tab()
      expect(screen.getByLabelText('Mot de passe')).toHaveFocus()

      await utilisateur.tab()
      expect(screen.getByRole('button')).toHaveFocus()
    })

    it('ne se soumet pas — elle est de type `button`', () => {
      render(<Champ libelle="Mot de passe" type="password" revelable />)

      // Sans `type="button"`, un bouton dans un formulaire vaut `submit` : reveler
      // son mot de passe enverrait le formulaire, et cote API compterait comme une
      // tentative echouee de plus vers le blocage temporise.
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })
  })

  describe("l'erreur", () => {
    it('est rattachee au champ et vit dans une region annoncable', () => {
      render(<Champ libelle="Mot de passe" erreur="E-mail ou mot de passe incorrect." />)

      const saisie = screen.getByLabelText('Mot de passe')
      expect(saisie).toHaveAttribute('aria-invalid', 'true')

      // Le message est rattache par `aria-describedby` : un lecteur d'ecran le lit
      // en prenant le champ, sans avoir a explorer la page.
      const idDecrit = saisie.getAttribute('aria-describedby')
      expect(idDecrit).not.toBeNull()
      expect(document.getElementById(idDecrit ?? '')).toHaveTextContent(
        'E-mail ou mot de passe incorrect.',
      )
    })

    it('laisse sa region vivante en place quand il n’y a pas d’erreur', () => {
      const { container } = render(<Champ libelle="Mot de passe" />)

      // La region doit PREEXISTER au message. Une region `aria-live` inseree en
      // meme temps que son contenu n'est pas annoncee : c'est le piege classique,
      // et il ne se voit sur aucune capture d'ecran.
      expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
      expect(screen.getByLabelText('Mot de passe')).not.toHaveAttribute('aria-invalid')
    })
  })
})
