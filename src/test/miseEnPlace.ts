import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * Mise en place commune aux tests de composants.
 *
 * `cleanup` demonte l'arbre entre deux tests. Sans lui, deux tests qui rendent le
 * meme composant laissent DEUX exemplaires dans le document, et `getByLabelText`
 * echoue sur « plusieurs elements trouves » — un echec qui ressemble a un bug du
 * composant alors qu'il vient du harnais.
 *
 * `jest-dom/vitest` ajoute les assertions de DOM (`toBeVisible`,
 * `toHaveAccessibleName`). C'est la variante `/vitest` et non `/jest` : elle
 * enregistre les matchers sur `expect` de Vitest.
 */
afterEach(() => {
  cleanup()
})
