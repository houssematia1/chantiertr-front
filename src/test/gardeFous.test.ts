import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * LA LISTE DE REJET DU PLAN, RENDUE EXECUTABLE.
 *
 * `docs/plan-s0b-front.md` enonce dix criteres « verifiables sans debat de gout ».
 * Ecrits, ils dependaient d'une relecture. Ici, ils cassent la suite.
 *
 * C'est la meme methode que les sept garde-fous d'architecture du depot d'API :
 * une regle qu'aucun test ne verifie finit toujours par etre enfreinte, et elle
 * l'est le jour ou personne ne relit — pas le jour ou on l'ecrit.
 *
 * Ce fichier lit les SOURCES. C'est assume : ce sont des regles sur ce qu'on
 * ecrit, pas sur ce qui s'affiche. Un test de rendu ne verrait pas un
 * `transition: all` qui n'anime rien aujourd'hui et animera la geometrie demain.
 */

// `process.cwd()` et non `import.meta.url` : sous Vitest, l'URL d'un module passe
// par le serveur de Vite et arrive prefixee `/@fs/` avec les espaces encodes en
// `%20` — le chemin du projet en contient un. Vitest s'execute depuis la racine du
// paquet, ici comme en integration continue.
const RACINE = process.cwd()
const SRC = join(RACINE, 'src')

/**
 * Les fichiers qui portent des classes ou du style.
 *
 * LES FICHIERS DE TEST SONT EXCLUS, et il faut le dire : ce fichier-ci ENONCE les
 * motifs interdits, donc il les contient. Sans cette exclusion, il echoue sur
 * lui-meme — `transition-all`, `outline-none` et `<input` apparaissent dans ses
 * propres expressions. L'exclusion porte sur tous les tests et non sur ce seul
 * fichier : un test a le droit de citer ce qu'il verifie, et aucun test n'est
 * livre.
 */
function sources(dossier: string): string[] {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree)
    if (statSync(chemin).isDirectory()) return sources(chemin)
    if (/\.test\.tsx?$/.test(chemin)) return []
    return ['.ts', '.tsx', '.css'].includes(extname(chemin)) ? [chemin] : []
  })
}

/**
 * Le code, commentaires retires.
 *
 * INDISPENSABLE : la moitie des interdits de ce fichier sont CITES en commentaire
 * dans les composants, precisement pour expliquer pourquoi ils sont interdits.
 * `Champ.tsx` mentionne `#D5DDE7` pour dire qu'il echoue a 1,37:1 ; `tokens.css`
 * cite `transition: all`. Scanner le fichier brut ferait echouer les tests sur
 * leur propre documentation.
 *
 * Le garde `://` empeche de prendre le `//` d'une URL pour un debut de
 * commentaire.
 */
function codeSeul(contenu: string): string {
  return contenu
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((ligne) => {
      const i = ligne.search(/(?<!:)\/\//)
      return i === -1 ? ligne : ligne.slice(0, i)
    })
    .join('\n')
}

const FICHIERS = sources(SRC).map((chemin) => ({
  chemin: relative(RACINE, chemin),
  code: codeSeul(readFileSync(chemin, 'utf8')),
}))

/** Les occurrences d'un motif, avec leur fichier — pour que l'echec soit lisible. */
function occurrences(motif: RegExp, filtre?: (chemin: string) => boolean): string[] {
  return FICHIERS.filter(({ chemin }) => filtre?.(chemin) ?? true).flatMap(({ chemin, code }) =>
    [...code.matchAll(motif)].map((trouve) => `${chemin} → ${trouve[0].trim()}`),
  )
}

describe('la liste de rejet du plan', () => {
  it("n'ecrit aucun hexadecimal en dur hors du fichier de jetons", () => {
    // Le premier critere du plan. `tokens.css` est le SEUL endroit ou une couleur
    // s'ecrit : c'est ce qui rend « pas de couleurs hardcodees » structurel au
    // lieu de declaratif.
    expect(
      occurrences(/#[0-9a-fA-F]{3,8}\b/g, (chemin) => !chemin.endsWith('styles/tokens.css')),
    ).toEqual([])
  })

  it("n'anime jamais `all`", () => {
    // MASTER § 5 : nommer la propriete. `transition: all` anime aussi la
    // geometrie, donc `width`, `height`, `top`, `left` — les quatre proprietes que
    // le plan interdit d'animer, obtenues par accident.
    expect(occurrences(/transition-all|transition:\s*all/g)).toEqual([])
  })

  it("ne retire jamais l'anneau de focus", () => {
    // MASTER § 7 : « ne jamais le retirer ». Un composant qui veut un anneau
    // different change sa COULEUR, pas son existence.
    expect(occurrences(/outline-none|outline:\s*(none|0)/g)).toEqual([])
  })

  it("n'arrondit rien au-dela de 20 px", () => {
    // LE PLAFOND EST PASSE DE 6 A 20 PX, et il faut dire pourquoi : la liste des
    // entreprises reprend la composition en cartes de l'application Vue de
    // l'equipe, dont la carte exterieure est a 20 px et l'interieure a 16. Le
    // « precision, pas douceur » de MASTER § 6 valait pour le style dense qui a
    // ete ecarte ; il ne vaut plus.
    //
    // Le test reste, et il garde toujours quelque chose : 20 px est un plafond,
    // pas une invitation. `rounded-[32px]` ne compile pas davantage qu'avant, et
    // la remise a zero de `--radius-*` continue d'interdire `rounded-full`.
    const trop = occurrences(/rounded-\[(\d+)px\]/g).filter((trouve) => {
      const px = Number(/\[(\d+)px\]/.exec(trouve)?.[1] ?? 0)
      return px > 20
    })
    expect(trop).toEqual([])
  })

  it("n'emploie aucun emoji en guise d'icone", () => {
    // Le plan les nomme comme marqueur d'interface generee. Les icones sont des
    // SVG a `currentColor`, qui heritent de la couleur du texte et se mesurent.
    expect(occurrences(/\p{Extended_Pictographic}/gu)).toEqual([])
  })

  it('ne compose aucun chiffre tabulaire en Barlow Condensed', () => {
    // MESURE, pas opinion : Barlow Condensed n'embarque pas la fonte `tnum`.
    // `111111` et `999999` gardent 7,32 px d'ecart a 40 px MEME avec
    // `font-variant-numeric: tabular-nums`. Demander l'alignement a une police qui
    // ne sait pas le faire echoue en SILENCE — les colonnes dansent et aucune
    // regle CSS ne le signale.
    //
    // Le test cherche les deux classes dans une meme chaine de classes, ce qui est
    // exactement le cas ou elles s'appliquent au meme element.
    const conflits = FICHIERS.flatMap(({ chemin, code }) =>
      [...code.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{\[([\s\S]*?)\]\s*$)/gm)]
        .map((trouve) => trouve[1] ?? trouve[2] ?? trouve[3] ?? '')
        .filter(
          (classes) => /\bfont-display\b/.test(classes) && /\b(colonne-)?chiffres\b/.test(classes),
        )
        .map((classes) => `${chemin} → ${classes.slice(0, 90)}`),
    )
    expect(conflits).toEqual([])
  })

  it('ne rend un champ de saisie que par le composant qui en porte les garanties', () => {
    // Reformulation testable de deux criteres du plan — « un champ sans libelle
    // visible » et « un anneau de focus retire ».
    //
    // `Champ` est le seul a tenir les quatre exigences de MASTER § 7 : libelle
    // obligatoire dans le TYPE, erreur sous le champ, region `aria-live`
    // preexistante, bordure a 3:1 pour WCAG 1.4.11. Un `<input>` ecrit ailleurs
    // les perd toutes les quatre, et rien ne le signalerait.
    //
    // DEUX EXCEPTIONS, et chacune est nommee plutot que toleree :
    //
    //  - `Selecteur` rend un `<select>`, pas un `<input>`, mais il porte les memes
    //    garanties — libelle obligatoire dans le type, bordure `--line-champ`,
    //    anneau de focus intact. Il n'est pas dans le motif de ce test ;
    //  - `TeleverseurDeLogo` rend un `<input type="file">` en `sr-only`, declenche
    //    par un bouton. Le controle natif ne se met pas en forme — trois
    //    navigateurs, trois rendus —, et un libelle visible sur un champ invisible
    //    n'aurait aucun sens. Le bouton porte le libelle, et le champ garde le sien
    //    pour les technologies d'assistance.
    const permis = ['components/ui/Champ.tsx', 'components/donnees/TeleverseurDeLogo.tsx']

    expect(
      occurrences(/<input\b/g, (chemin) => !permis.some((permis) => chemin.endsWith(permis))),
    ).toEqual([])
  })

  it('ne borne aucun controle avec le filet decoratif', () => {
    // WCAG 1.4.11 : ce qui IDENTIFIE un controle doit tenir 3:1. `--line` vaut
    // 1,23:1 sur blanc — il separe, il ne borne pas. Un controle prend
    // `--line-champ` (3,33:1 sur `card`, 3,10:1 sur `bg`).
    //
    // `border-line` suivi d'un tiret est `border-line-champ` : la limite de mot
    // l'exclut.
    //
    // `[^'\n]*` et non `[^']*` : sans l'exclusion du retour a la ligne,
    // l'expression sautait d'une apostrophe a une autre a travers cinquante lignes
    // de code et rapportait des correspondances qui n'etaient pas des chaines de
    // classes. Une seule ligne par chaine, c'est la forme reelle du code ici.
    const controles = FICHIERS.flatMap(({ chemin, code }) =>
      [...code.matchAll(/'([^'\n]*\b(?:h-14|h-11|h-9)\b[^'\n]*)'/g)]
        .map((trouve) => trouve[1] ?? '')
        .filter((classes) => /\bborder-line\b/.test(classes))
        .map((classes) => `${chemin} → ${classes.slice(0, 90)}`),
    )
    expect(controles).toEqual([])
  })
})
