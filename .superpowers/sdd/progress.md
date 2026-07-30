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

## Tâche 2 — Shell et navigation · **terminée**

### Préalable : l'API ne disait pas l'essentiel

Le bandeau d'emprunt ne pouvait pas être écrit. L'emprunt vit dans la session
sous `impersonator_id`, et le cookie de session est `HttpOnly` : **aucun
JavaScript ne peut le lire.** `GET /me` rendait le compte emprunté sans rien dire
de l'emprunt — l'interface d'un emprunt était indiscernable d'une vraie connexion
à ce compte.

Ce n'était pas un manque de confort. Tout le dispositif côté API — lecture seule,
trace dans `impersonations`, refus d'emprunter un compte de plateforme — repose
sur le fait que l'opérateur **sache** dans quel compte il se trouve.

`GET /me` rend donc deux clefs de plus, à côté de `data` : `emprunt` et `droits`.
Dix tests, cinq mutations. Voir la PR API #2.

**Découverte au passage : huit commits n'avaient jamais atteint `main`.** Tout le
travail d'invitation et de réinitialisation par lien à usage unique, poussé sur
`feature/s0a-socle-api` après la fusion de la PR #1. Les écrans front livrés à la
tâche 1 appelaient des routes absentes de `main`. La PR #2 les apporte.

### Ce qui a été livré

`AppLayout` — shell à défilement intérieur —, `BarreLaterale` filtrée par rôle,
`BandeauEmprunt`, `EnteteEcran`, `Introuvable`, et le menu relevé dans le
logiciel d'origine. `Profil` devient `MonCompte` et perd son en-tête propre : le
shell le lui donne, et la déconnexion descend au pied de la barre, où elle est à
sa place — une action de session, pas une action d'écran.

Cinq `EcranAVenir` occupent les routes des tâches 3 à 5. **Ils doivent avoir
disparu à la fin du lot.** Ils existent pour que la barre soit traversable :
avec des entrées qui mènent à une page introuvable, ni la route active ni le
comportement du bandeau d'un écran à l'autre ne se vérifient.

`DemoSeeder` côté API : six comptes couvrant les six rôles, et **deux
entreprises adhérentes**. La seconde n'est pas décorative — le socle a été livré
avec une faille d'accès direct aux contacts d'un autre tenant alors que 400 tests
étaient verts, parce qu'aucun ne peuplait deux entreprises. Le seeder refuse de
tourner en production : il pose des mots de passe écrits dans le dépôt.

### Un renoncement délibéré

`useConnexion` ne pose plus le compte dans le cache. `POST /login` rend une
`UserResource` — le compte seul —, là où le shell a besoin du contexte. Poser le
compte seul remplirait le cache d'un contexte à moitié vide, et la barre se
construirait un instant sur `droits: []` avant de se corriger. Une invalidation,
donc, et un `GET /me` de plus : trente millisecondes sur un événement quotidien,
contre **une seule forme de session dans l'application**.

### Vérification

**48 tests** (29 → 48). Vérifié aussi contre l'API en marche : connexion en
super-administrateur, emprunt du compte membre, bascule de la barre latérale
— « Mon entreprise » au lieu de « Mes entreprises », grille des droits
disparue —, puis retour par « Reprendre mon compte ».

Géométrie relevée au navigateur : barre 240 px, en-tête 56 px, filet actif
`#1FA37A` 2 px, fond `#E7F5F0`, texte `#157C5C`, aucune ombre, **aucune
animation sur la navigation**.

#### La mutation qui a trouvé le vrai trou

Douze mutations. Dix tuaient le bon test du premier coup. Deux ont survécu :

1. **`role="status"` → `role="alert"`** — ma mutation avait modifié le
   *commentaire* qui explique l'attribut, pas l'attribut. Faute de la
   contre-épreuve, pas du test. Reprise en ciblant le JSX : cinq tests tombent.

2. **Le shell n'affiche jamais le bandeau** — `contexte.emprunt !== null`
   remplacé par `false`, et **les 44 tests restaient verts.** `BandeauEmprunt`
   était testé, `BarreLaterale` était testée, et rien ne prouvait que le shell les
   BRANCHE. Un dispositif de sécurité parfaitement écrit, et jamais montré.

C'est la forme la plus coûteuse d'angle mort : chaque pièce testée, l'assemblage
non. `AppLayout.test.tsx` la ferme — quatre tests, dont un sur la position du
bandeau dans le document, parce qu'un bandeau logé sous la barre latérale
défilerait avec le contenu.

### Une sonde fautive, notée pour mémoire

Mon premier relevé annonçait une animation sur la navigation. Il testait
`transitionProperty === 'all'` — or `all` est la valeur **initiale** de CSS,
présente partout et sans effet tant que la durée vaut `0s`. La bonne question est
la durée, pas la propriété. Relevé corrigé : zéro élément animé dans le shell.

---

## Reste à faire

| # | Tâche | État |
|---|---|---|
| 2 | Shell, barre latérale filtrée par rôle, bandeau d'impersonation | **terminée** |
| 3 | Annuaire des entreprises et fiche | à faire |
| 4 | Contacts et carnet d'adresses | à faire |
| 5 | Comptes et grille de droits | à faire |
| 6 | Mon compte et flux de lien | partiel — les écrans existent en lecture, l'édition reste à faire |
| 7 | Quatre parcours Playwright et intégration continue | à faire |

**Arbitrage clos :** Barlow partout, Fira retirée. C'était le dernier point
typographique en attente.

**Ouvert côté client :** le Superviseur peut-il écrire dans l'annuaire.

**Dette de ce lot, à solder avant sa clôture :** les cinq `EcranAVenir`. Chacun
est remplacé par une tâche 3, 4 ou 5. S'il en reste un, c'est un écran vide livré.

**En attente côté API :** la PR #2 doit être fusionnée avant que le front ne soit
déployable — `GET /me` sans `emprunt` ferait un shell sans bandeau, et sans
`droits` un annuaire des comptes sans boutons.
