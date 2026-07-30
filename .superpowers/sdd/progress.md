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

## Tâches 3, 4 et 5 — annuaires, comptes, grille · **terminées**

### Le design a été refait sur demande, et deux fois

La tâche 3 a d'abord été livrée en **tableau dense** — lignes de 36 px, tri par
colonne, `aria-sort`, douze tests éprouvés par mutation. Le client l'a refusée en
bloc : « je veux pas ce theme ni ce police ni le layout », et demandé d'imiter la
liste de sociétés de l'application Vue de l'équipe.

**Depuis, chaque écran passe par un prototype validé avant qu'une ligne ne soit
écrite.** C'est la méthode que le client a imposée — « montre un prototype avant de
commencer » — et elle a économisé deux réécritures : le bandeau coloré en tête de
carte a été refusé sur maquette, pas sur code.

Les prototypes sont dans `design-system/reference/` :
`prototype-liste-entreprises.html` et `prototype-contacts-comptes.html`.

### Deux mises en page, et c'est leur choix

**Cartes pour les entreprises, tableau souple pour les personnes.** Ce n'est pas
une incohérence : une entreprise a un logo et vingt champs, on la lit une par une ;
une personne a cinq colonnes qu'on compare d'une ligne à l'autre. Les mesures des
deux viennent de leur SCSS, relevées et non approchées.

Le composant `Tableau` du premier jet est **retiré** — plus rien ne l'emploie. Il
est dans l'historique, ses tests étaient éprouvés par mutation, il est reprenable
tel quel si un écran tabulaire arrive au métier.

### Ce que l'API a dû apprendre

| Ajout | Pourquoi |
|---|---|
`tel`, `logo_path` | la carte gardait un cadre vide et une colonne de moins |
`created_at` exposé | il était en base depuis le premier jour |
`nombre_de_comptes` | sous la **même règle de confidentialité** que le numéro d'adhérent : c'est un effectif |
`POST/DELETE /companies/{id}/logo` | téléversement, avec le SVG refusé et poids **et** dimensions bornés |

**Deux garde-fous ont refusé mon premier jet, et tous deux avaient raison.**
`RouteRegistryTest` a rejeté les routes de logo non classées et exigé leur test
d'isolation. `DomainTest` a rejeté l'action, qui vivait dans `App\Domain` et
importait `Illuminate\Http\UploadedFile` — le stockage est remonté dans le
contrôleur, l'action ne garde que l'invariant.

### Cinq erreurs que la vérification a trouvées, et qu'aucun test n'attrapait

1. **`APP_URL` sans le port.** Le téléversement réussissait, l'API rendait 200, et
   l'image ne s'affichait pas : `Storage::url()` construisait une adresse qui ne
   résout pas. Les tests vérifient que l'URL *contient* le chemin, pas qu'elle
   résout. Noté dans `docs/deploiement.md`.

2. **La case de la grille ne basculait pas.** Contrôlée sur la valeur du cache,
   elle revenait en place au clic et n'attendait que le rafraîchissement. Sur
   dix-huit cases cela se lit comme une panne. Corrigé par une **mise à jour
   optimiste** avec retour en arrière sur refus.

3. **Le nom accessible se composait par accident.** « Réglages » plus un
   complément en `sr-only` donnait `Réglages— Thomas Nguyen`, sans l'espace : le
   calcul de nom accessible ne joint pas les nœuds comme `textContent`. Le nom est
   maintenant posé, pas composé.

4. **Une erreur de conception, trouvée par un test qui refusait de passer.** J'avais
   câblé la visibilité du numéro d'adhérent sur le rôle, côté front. Faux :
   `CompanyResource` décide seule à qui elle le rend, et un membre le reçoit sur
   *sa propre* fiche. Deux vérités, la seconde se trompait.

5. **Le test des dimensions d'image a fait tomber le runner.** Générer un
   9000 × 9000 a épuisé les 512 Mo du processus de test — ce qui EST l'argument
   pour la borne en pixels, puisque `max:2048` aurait laissé passer ce fichier.

### Trois assertions vacueuses, trouvées par mutation

Elles passaient sans rien prouver, et c'est le mode d'échec que la contre-épreuve
existe pour attraper :

| Assertion | Pourquoi elle ne prouvait rien |
|---|---|
`image` dans les règles du logo | `mimes` lit déjà le contenu — retirer `image` ne fait tomber aucun test. Ma documentation affirmait le contraire |
« la puce de rôle absente ne se rend pas » | rendre la puce sans condition produit une puce **vide** : aucun texte, assertion verte |
« Échap rend le focus au déclencheur » | cliquer le bouton lui donne déjà le focus. Il faut le déplacer dans le menu d'abord |

Total sur les trois tâches : **43 mutations**, 40 tuant le bon test du premier
coup, 3 ayant révélé un test à refaire.

### État

**117 tests front** (29 au début de la tâche 3), `tsc -b`, ESLint,
`npm run build`. **695 tests API**, PHPStan niveau 8, Pint.

**Il n'y a plus aucun `EcranAVenir`.** La dette du lot est soldée : les six entrées
de la barre latérale mènent toutes à un écran réel, et le composant est retiré —
le garder serait garder une façon de livrer un écran vide.

**L'emprunt de compte est complet.** Le bandeau existait depuis la tâche 2 sans
déclencheur ; « Se connecter en tant que » l'allume depuis l'annuaire des comptes,
et le cycle a été vérifié de bout en bout contre l'API.

---

## Reste à faire

| # | Tâche | État |
|---|---|---|
| 2 | Shell, barre latérale filtrée par rôle, bandeau d'impersonation | **terminée** |
| 3 | Annuaire des entreprises et fiche | **terminée** |
| 4 | Contacts et carnet d'adresses | **terminée** |
| 5 | Comptes et grille de droits | **terminée** |
| 6 | Mon compte et flux de lien | partiel — les écrans existent en lecture, l'édition reste à faire |
| 7 | Quatre parcours Playwright et intégration continue | à faire |

**Arbitrage clos :** Barlow partout, Fira retirée. C'était le dernier point
typographique en attente.

**Ouvert côté client :** le Superviseur peut-il écrire dans l'annuaire.

**Dette soldée :** les cinq `EcranAVenir` ont disparu, et le composant avec eux.

**Dette ouverte — la typographie.** Deux systèmes coexistent : Barlow sur l'écran
de connexion validé, Roboto et Montserrat dans l'application. Douze fichiers de
fonte. Les jetons sont séparés — `--font-affiche` ne s'emploie que sous
`AuthLayout` —, donc rien ne se mélange, mais le poids reste. Soit la connexion
passe en Roboto/Montserrat, soit la dette reste. **À trancher par le client.**

**En attente côté API :** la PR #2 doit être fusionnée avant que le front ne soit
déployable — `GET /me` sans `emprunt` ferait un shell sans bandeau, et sans
`droits` un annuaire des comptes sans boutons.
