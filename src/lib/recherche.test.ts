import { describe, expect, it } from 'vitest'

import { contient, contientChiffres, sansAccent } from '@/lib/recherche'

/**
 * Ce que ces tests protegent.
 *
 * Une recherche qui echoue ne leve aucune erreur : elle rend une liste vide, et
 * l'utilisateur conclut que la donnee n'existe pas. C'est le pire mode de panne
 * d'un annuaire — silencieux, et indiscernable d'un carnet reellement vide.
 *
 * Les deux cas qui cassent en pratique sont ici : les accents, qu'on ne tape pas
 * sur un clavier de chantier, et le SIRET, que l'API stocke TEL QUE SAISI — donc
 * « 790 151 831 00092 » en base et « 79015183100092 » sous les doigts.
 */
describe('sansAccent', () => {
  it('neutralise les diacritiques et la casse', () => {
    expect(sansAccent('Bâtir Ensemble')).toBe('batir ensemble')
    expect(sansAccent('Société Générale')).toBe('societe generale')
    expect(sansAccent('MAÎTRE D’OUVRAGE')).toBe('maitre d’ouvrage')
  })

  it('laisse intacte une chaine sans accent', () => {
    // Le controle positif de la fonction : elle ne doit pas mutiler ce qui va
    // bien. Une implementation qui retirerait toutes les lettres passerait les
    // assertions ci-dessus.
    expect(sansAccent('Toitures du Sud')).toBe('toitures du sud')
  })

  it("ne touche pas a l'apostrophe typographique", () => {
    // Elle est SIGNIFIANTE : l'API normalise les apostrophes des CATEGORIES a
    // l'ecriture — `normaliserCategorie` —, mais pas celles des raisons sociales.
    // Les retirer ici ferait diverger la recherche de ce que la base contient.
    expect(sansAccent('L’Atelier')).toBe('l’atelier')
  })
})

describe('contient', () => {
  it('trouve sans les accents', () => {
    expect(contient('batir', ['Bâtir Ensemble', null])).toBe(true)
  })

  it('trouve au milieu d un champ', () => {
    expect(contient('ensemble', ['Bâtir Ensemble'])).toBe(true)
  })

  it('cherche dans tous les champs servis', () => {
    expect(contient('montpellier', ['Toitures du Sud', null, 'Montpellier'])).toBe(true)
  })

  it('ne trouve pas ce qui n y est pas', () => {
    // Le controle NEGATIF. Sans lui, un `contient` qui renverrait toujours `true`
    // passerait tout le reste du fichier.
    expect(contient('lyon', ['Bâtir Ensemble', 'Montpellier'])).toBe(false)
  })

  it('rend vrai sur un terme vide — c est « pas de filtre »', () => {
    expect(contient('', ['Bâtir Ensemble'])).toBe(true)
    expect(contient('   ', ['Bâtir Ensemble'])).toBe(true)
  })

  it('ignore les champs absents au lieu de les traiter en chaine vide', () => {
    // `''` est contenu dans toute chaine. Convertir un `null` en `''` ferait donc
    // correspondre chaque ligne des que le terme serait vide — et surtout,
    // `contient('a', [null])` renverrait vrai si l'on comparait mal.
    expect(contient('a', [null, undefined, ''])).toBe(false)
  })
})

describe('contientChiffres', () => {
  it('trouve un SIRET colle dans un SIRET espace', () => {
    // LE CAS REEL : l'API stocke la valeur telle que saisie, sa regle ne compte
    // que les chiffres. La base porte donc les deux formes.
    expect(contientChiffres('79015183100092', '790 151 831 00092')).toBe(true)
  })

  it('trouve un SIRET espace dans un SIRET colle', () => {
    expect(contientChiffres('790 151', '79015183100092')).toBe(true)
  })

  it('trouve un fragment', () => {
    expect(contientChiffres('00092', '790 151 831 00092')).toBe(true)
  })

  it('ne trouve pas un autre numero', () => {
    expect(contientChiffres('12345678901234', '790 151 831 00092')).toBe(false)
  })

  it('rend faux sur un terme sans chiffre', () => {
    // Sinon toute recherche textuelle ferait correspondre chaque ligne portant un
    // numero : `''.includes('')` est vrai, et tout numero contient la chaine vide.
    expect(contientChiffres('batir', '790 151 831 00092')).toBe(false)
    expect(contientChiffres('', '790 151 831 00092')).toBe(false)
  })

  it('rend faux quand le numero est absent', () => {
    expect(contientChiffres('790', null)).toBe(false)
    expect(contientChiffres('790', undefined)).toBe(false)
  })
})
