# S0-B — Socle front · journal

Plan : `docs/plan-s0b-front.md`. Visuel : `design-system/MASTER.md`.
Branche : `feature/s0b-ecrans-sans-session`. Déploiement hors lot, reporté en fin de projet.

---

## Tâche 1 — Échafaudage, jetons, client HTTP, authentification · **terminée**

Commits : `8247ac7` → `ec33415`.

### Ce qui a été livré

Vite + React 19 + TS + Tailwind v4, jetons de MASTER, client HTTP avec session
Sanctum par cookie, les trois écrans sans session, et l'écran de connexion
**validé par le client** et transposé en React.

### L'écran de connexion — cinq itérations avant validation

| Version | Verdict | Ce qui a été rejeté |
|---|---|---|
| Carte 360 px centrée sur gris | rejetée | « le front end design en dirait de l'ia generique » |
| Quatre pistes comparées | B retenue | « B signaletique est la plus bonne mais pas parfaite » |
| Formulaire ancré en haut | rejetée | « non non la precedente est beau coup plus mieux » |
| Logo déplacé à droite | rejetée | « non laisse a gauche desole » |
| Volet gauche + volet droit v1 | gauche validée, droite non | « cote droite c pas encore validé » |
| Volet droit, variante « Bande » | **validée** | — |

Trois traitements du volet droit ont été comparés côte à côte avant le choix :
*Surface* (volet en gris de travail, formulaire en carte blanche), *Filets*
(champs soulignés, bouton marine de bord à bord) et *Bande* (la bande de
chantier reprise en tête, répondant à celle du volet gauche en diagonale).

**Six décisions sont acquises et ne se refont pas** — MASTER § 10. Quatre d'entre
elles corrigent mes propres erreurs.

### Ce que la transposition a trouvé, et qu'aucune relecture n'aurait vu

**Deux des trois chiffres du volet gauche étaient faux.** « 3 offres » quand
`TYPE_OFFRE` en compte 8 ; « 24 mois suivis » sans aucune base. Je les avais
posés comme masse graphique et le client avait validé la composition. Un écran
de connexion qui annonce un chiffre l'affirme au nom du produit. Remplacés par
19 prestations / 8 types d'offre / 6 catégories, chacun relevé dans le catalogue
du legacy et porteur de sa provenance dans `src/contenu/identiteAuth.ts`.
**À revérifier au lot M1**, quand ces valeurs deviendront des cardinalités de tables.

**Barlow Condensed n'a pas de chiffres tabulaires.** Mesuré au navigateur :
`111111` et `999999` gardent 7,32 px d'écart à 40 px avec `tabular-nums`
appliqué, contre 0,00 px en Barlow. Une colonne de montants composée en
Condensed se décale ligne à ligne, **en silence** — aucune règle CSS ne signale
l'échec. C'est le genre de défaut qui se découvre au lot M1 sur un tableau de
budget, pas ici.

**La bordure de champ échouait à WCAG 1.4.11.** `#D5DDE7` du prototype vaut
1,37:1 sur blanc, et le filet `--line` du produit 1,23:1. Le critère exige 3:1
pour « l'information visuelle nécessaire à identifier un composant » — et la
bordure d'un champ est la seule chose qui dise où cliquer. Nouveau jeton
`--line-champ` à `#7F8EA3`, la valeur la **plus claire** qui tienne 3:1 sur les
deux surfaces. `#8493A8` passait sur blanc (3,12:1) et tombait sur le gris
(2,91:1) : un champ dans une carte aurait été conforme ou non selon l'écran.

**Le titre d'affiche était marine sur marine.** La règle de base
`h1 { color: var(--color-navy) }` s'applique à l'élément et bat la couleur
héritée du volet. Seul « compte tenu » restait lisible, parce que son `span`
porte la sienne. Trouvé à l'écran, pas par le compilateur.

**`max-w-[20ch]` ne se transpose pas.** La maquette est à 16 px de corps, le
produit à 14 px : le même `20ch` passe de 181 px à 158 px, et la phrase se casse
en sept lignes au lieu de cinq. Une unité relative qui dépend d'une taille
ambiante différente n'est pas une transposition, c'est une coïncidence.

**1 044 Ko de PNG pour un écran de connexion**, dont 258 Ko de logo pour un
affichage à 186 px — 25 fois le nécessaire. Sur la 4G d'un bureau de chantier,
c'est un écran qui ne s'affiche pas. Servis en WebP : 166 Ko. Et `public/` part
tel quel en production : la maquette et les PNG sources l'ont quitté. `dist`
passe de 2 536 à 924 Ko.

**Les deux bandes fusionnaient sur téléphone.** Empilées, deux rubans de 9 px de
même diagonale bord à bord font un bandeau de 18 px, ils ne se répondent pas.
La jonction n'en porte qu'un.

### Vérification

**Huit garde-fous exécutables** — `src/test/gardeFous.test.ts`. La liste de rejet
du plan était écrite mais rien ne la vérifiait ; elle casse maintenant la suite :
hexadécimal en dur, `transition: all`, anneau de focus retiré, rayon au-delà de
6 px, émoji, chiffres en Condensed, contrôle borné par `--line`, et `<input>`
hors du composant `Champ`.

**Contre-épreuve par mutation, 13 mutations en tout :**

- 8 violations des garde-fous introduites → 8 tests tombent, **correspondance exacte** vérifiée nom par nom
- 5 mutations sur la bascule de mot de passe (nom accessible figé, `type="button"` retiré, focus volé, région `aria-live` conditionnelle, `type` désolidarisé de l'état) → 1 test chacune

Une première lecture de la contre-épreuve affichait toujours le même nom de test
— l'extraction lisait la première ligne de la sortie, pas l'échec. Corrigée :
sans cela, huit mutations auraient pu tuer un seul et même garde-fou sans que
rien ne le montre.

29 tests, `tsc -b` et ESLint verts, `npm run build` passant. À noter :
`tsc --noEmit` ne voyait pas trois erreurs que `tsc -b` a levées, dont un appel
à l'ancienne API de `Marque` dans `Profil.tsx`. **C'est `npm run build` qui fait
foi**, pas `tsc --noEmit`.

### Écarts assumés à la maquette

1. **Le halo vert de focus est retiré.** Superposé à l'anneau marine global, il
   faisait deux cercles concentriques de deux couleurs autour d'un champ.
2. **La bascule ne vole plus le focus.** La maquette le renvoyait dans le champ ;
   au clavier on perd alors le bouton qu'on vient d'actionner.
3. **Adaptation au téléphone**, absente de la maquette qui est composée pour un
   poste de travail.

---

## Reste à faire

| # | Tâche | État |
|---|---|---|
| 2 | Shell, barre latérale filtrée par rôle, bandeau d'impersonation | à faire |
| 3 | Annuaire des entreprises et fiche | à faire |
| 4 | Contacts et carnet d'adresses | à faire |
| 5 | Comptes et grille de droits | à faire |
| 6 | Mon compte et flux de lien | partiel — les écrans existent, les parcours ne sont pas éprouvés |
| 7 | Quatre parcours Playwright et intégration continue | à faire |

**Arbitrage clos :** Barlow partout, Fira retirée. C'était le dernier point
typographique en attente.

**Ouvert côté client :** le Superviseur peut-il écrire dans l'annuaire.
