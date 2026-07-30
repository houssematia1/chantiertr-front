# Chantier Tranquille — Système de design

**Source de vérité.** Toute page se construit à partir de ce fichier. Une page qui doit s'en écarter pose son écart dans `design-system/pages/<nom>.md`, qui prime alors localement.

Établi via le référentiel `ui-ux-pro-max`, avec les réglages **variance 3 / motion 2 / density 9** — minimal, mouvement discret, dense.

---

## 1. Le produit, en une phrase

Une application de gestion de **compte prorata de chantier BTP**. Ses utilisateurs sont des conducteurs de travaux et des chefs de chantier. Ils y passent la journée sur des tableaux de prestations, des budgets et des montants qui finissent dans des documents contractuels.

**Ce qu'ils veulent : densité et vitesse.** Pas de respiration.

---

## 2. Style — Data-Dense Dashboard

Retenu contre « Exaggerated Minimalism », que la première recherche proposait : typographie surdimensionnée et vastes blancs, recommandés pour la mode et les portfolios d'agence. À l'opposé du besoin.

```
--sidebar-width:     240px
--header-height:     56px
--table-row-height:  36px
--card-padding:      12px
--grid-gap:          8px
```

Corps de texte **12 à 14 px**. Padding **8 à 12 px**. En-têtes de tableau collants. Tri sur les colonnes. Surbrillance de ligne au survol. Grille 12 colonnes.

**Densité maximale d'information, tout en restant lisible.**

---

## 3. Palette — la charte du prototype

> ### Le bleu de la marque — résolu le 30/07
>
> **Le bleu réel de la marque est `#0F3071`**, un bleu roi profond, relevé au pixel dans le fichier de logo officiel. Le `#13233B` employé jusque-là venait du CSS du prototype HTML : plus sombre, plus gris, **ce n'était pas la couleur de la marque.**
>
> **Les ratios ont été remesurés sur `#0F3071` et sont reportés ci-dessous.** Le marine est plus clair, donc tout ce qu'il porte perd du contraste : `--navy` passe de 14,67:1 à 11,62:1 sur la surface de travail, et le marine sur l'ambre de 7,31:1 à **5,79:1**. Aucun ne tombe sous son seuil. Le seul à surveiller est l'ambre : il reste au-dessus de 4,5:1, mais la marge s'est réduite de moitié.
>
> Deux couples nouveaux sont apparus à cette occasion et figurent dans les interdits : `--navy` contre `--green-strong` ne vaut que **2,42:1**, et `--line` en bordure de champ **1,23:1**.

**La charte graphique du prototype est l'identité de la marque et elle est conservée.** Marine et vert. C'est le *style* du logiciel d'origine qui était daté, pas ses couleurs.

Mais trois de ses couleurs ne tiennent pas les seuils d'accessibilité en usage texte. Les ratios ont été mesurés, pas estimés :

| Paire | Ratio | Verdict |
|---|---|---|
| Blanc sur vert `#1FA37A` | **3,19:1** | ⚠ gros texte et éléments d'interface seulement |
| Rouge `#D9534F` sur blanc | **3,96:1** | ⚠ échoue en texte courant |
| Ambre `#E8A33D` sur blanc | **2,16:1** | ✗ inutilisable en texte |
| Bordure de champ `#D5DDE7` sur blanc | **1,37:1** | ✗ échoue WCAG 1.4.11 |

La réponse n'est pas de changer les teintes, c'est de **donner à chacune deux valeurs : une pour remplir, une pour écrire.** C'est ce qu'un designer fait dans ce cas.

**La quatrième ligne est d'une autre nature et a été trouvée en transposant l'écran de connexion.** WCAG 1.4.11 exige 3:1 pour « l'information visuelle nécessaire à identifier un composant d'interface ». La bordure d'un champ de saisie est la seule chose qui dise où cliquer : elle doit passer. Celle du prototype vaut 1,37:1, et le filet `--line` du produit 1,23:1 — les deux échouent.

D'où un **second filet**, et la règle qui va avec :

| Filet | Valeur | Usage | Ratio |
|---|---|---|---|
| `--line` | `#E3E8EF` | Séparateurs, bords de carte — **décoratif** | 1,23:1, hors périmètre de 1.4.11 |
| `--line-champ` | `#7F8EA3` | **Bordure de tout contrôle** | 3,33:1 sur `card` · 3,10:1 sur `bg` |

`#7F8EA3` est la valeur la **plus claire** qui tienne 3:1 sur les deux surfaces du produit. `#8493A8` passait sur blanc (3,12:1) et tombait sur le gris (2,91:1) : un champ dans une carte posée sur la surface de travail aurait été conforme ou non selon l'écran. Une seule valeur, mesurée sur les deux fonds.

### Les jetons

| Jeton | Valeur | Rôle | Ratio |
|---|---|---|---|
| `--navy` | `#0F3071` | Chrome, barre latérale, texte principal | 12,49:1 · 11,62:1 |
| `--navy-soft` | `#2A4A8C` | Chrome secondaire | 8,55:1 · 7,95:1 |
| `--navy-line` | `#2A4A8C` | Filet **sur** un aplat marine — décoratif | 1,46:1 |
| `--on-navy` | `#FFFFFF` | Texte sur un aplat marine | 12,49:1 |
| `--on-navy-soft` | `#B3C4DE` | Texte secondaire sur marine | 7,06:1 |
| `--on-navy-faint` | `#93A8C9` | Libellés en capitales sur marine | 5,16:1 |
| `--slate` | `#5A6B82` | Texte secondaire, libellés | 5,06:1 |
| `--green` | `#1FA37A` | **Le vert de la marque.** Logo, indicateurs actifs, aplats, badges à texte foncé | identitaire |
| `--green-strong` | `#157C5C` | **Tout ce qui porte du texte blanc** : boutons, bandeaux. Et le vert en texte sur fond clair | 5,16:1 · 4,80:1 |
| `--green-wash` | `#E7F5F0` | Fond validé, avec texte `--green-strong` dessus | |
| `--bg` | `#F4F7FA` | Surface de travail | |
| `--card` | `#FFFFFF` | Cartes, tableaux | |
| `--line` | `#E3E8EF` | Filets, séparateurs — **décoratif** | 1,23:1 |
| `--line-champ` | `#7F8EA3` | **Bordure de tout contrôle** — WCAG 1.4.11 | 3,33:1 · 3,10:1 |
| `--danger` | `#C0332F` | Suppression, dépassement — texte **et** remplissage | 5,59:1 |
| `--warn-fill` | `#E8A33D` | **Remplissage uniquement**, texte marine dessus | 5,79:1 |
| `--ring` | `#0F3071` | Anneau de focus | 12,49:1 · 11,62:1 |

### Discipline

- **Aucun texte blanc sur `--green`.** Il se pose sur `--green-strong`.
- **L'ambre ne s'écrit jamais.** Il remplit, et le texte qui le surmonte est marine.
- **Un contrôle prend `--line-champ`, jamais `--line`.** Le second sépare, il ne borne pas.
- **L'anneau de focus d'un bouton vert garde son `outline-offset`.** Le marine ne vaut que 2,42:1 contre `--green-strong` : l'anneau est conforme parce qu'il se pose dans le blanc autour du bouton, pas au ras du vert. Le retirer le ferait tomber sous 3:1.
- Le vert et le rouge gardent leur sens métier — validé, dépassé — et ne servent jamais à décorer.
- Jetons sémantiques obligatoires. **Aucun hexadécimal en dur dans un composant.**

Le style « Data-Dense Dashboard » retenu en section 2 vient du référentiel `ui-ux-pro-max` ; sa palette proposée — gris industriel et orange de sécurité — est écartée au profit de la charte du produit. Seules la densité, la structure et les règles y sont reprises.

---

## 4. Typographie — Barlow et Barlow Condensed

> ### Fira est retirée — décidé le 30/07 par validation
>
> Cette section portait **Fira Code et Fira Sans**. L'écran de connexion validé par le client est composé en **Barlow et Barlow Condensed**, et une validation vaut décision. Fira est retirée : deux systèmes typographiques dans un même produit sont un défaut, pas une richesse.

Humeur retournée par le référentiel : *dashboard, données, technique, précis.*

| Rôle | Police |
|---|---|
| Titres, libellés en capitales, boutons d'écran sans session | **Barlow Condensed** 600/700 |
| Texte courant, formulaires | **Barlow** 400/500/600 |
| **Chiffres, montants, références** | **Barlow**, tabulaire |
| Chaînes techniques à comparer caractère par caractère | pile monospace du système |

Les fontes sont **auto-hébergées** (`@fontsource`), pas chargées depuis Google Fonts : un `@import` distant bloque l'analyse du CSS, hotlinker Google Fonts transmet l'adresse IP du visiteur à un tiers — ce que la CNIL a jugé illicite, et le produit est un SaaS français —, et un bureau de chantier derrière un proxy filtrant retomberait sur la police système, précisément l'interdit § 6.

### ⚠ Barlow Condensed n'a pas de chiffres tabulaires

Mesuré au navigateur, à 40 px, avec `font-variant-numeric: tabular-nums` appliqué :

| Police | Écart `111111` vs `999999` | `tnum` |
|---|---|---|
| Barlow | 40,45 px → **0,00 px** | présente et active |
| Barlow Condensed | 7,32 px → **7,32 px** | **absente** |

Barlow Condensed ignore `font-variant-numeric` : elle n'embarque pas la chasse tabulaire. Un titre peut porter un chiffre isolé, mais **une colonne de montants composée en Condensed se décale ligne à ligne, en silence** — aucune règle CSS ne signale l'échec.

**Donc : tous les chiffres alignés sont en Barlow.** La règle est vérifiée par un test (`src/test/gardeFous.test.ts`) qui refuse `font-display` et `chiffres` sur un même élément.

**Tous les chiffres en tabulaire**, alignés à droite. C'est une règle du référentiel (`number-tabular`) et c'est le cœur du design de cette application : un tableau de budget doit se lire comme un registre, pas comme un tableau web.

Échelle : 12 · 13 · 14 · 16 · 20 · 24. Interligne 1.5 sur le texte courant.

**Deux tailles d'affiche hors échelle** — 76 px pour le titre du volet d'identité, 46 px pour les chiffres du catalogue. L'échelle 12-24 gouverne la *surface de travail*, où « aucun titre surdimensionné » est la règle. Un écran sans session est une couverture, pas une surface de travail.

---

## 5. Mouvement — réglage 2 sur 10

Le référentiel et la philosophie d'Emil Kowalski convergent : **la première question est « faut-il animer ? »**, et elle se répond par la fréquence d'apparition.

| Fréquence | Décision | Ici |
|---|---|---|
| 100+ fois par jour | **Jamais** | Navigation, lignes de tableau, onglets, champs |
| Des dizaines | Réduire au minimum | Survols, ouverture de menus |
| Occasionnel | Standard | Modales, tiroirs, notifications |

**Règles dures :**

- Durées **150 à 300 ms**, jamais au-delà. Sortie à 60-70 % de l'entrée.
- `ease-out` à l'entrée, `ease-in` à la sortie. **Jamais `ease-in` sur une entrée** : elle démarre lentement, au moment précis où l'œil regarde.
- Courbe personnalisée : `--ease-out: cubic-bezier(.23,1,.32,1)`. Les courbes CSS natives sont trop molles.
- **Jamais `transition: all`.** Nommer la propriété.
- **`transform` et `opacity` uniquement.** Jamais `width`, `height`, `top`, `left`.
- Retour de clic : `scale(.97)`, 100 à 160 ms. Sans lui, l'interface paraît morte.
- Rien n'apparaît de rien : entrée depuis `scale(.95)` et `opacity: 0`, jamais `scale(0)`.
- `prefers-reduced-motion` respecté.

---

## 6. Interdits

Du référentiel, et de l'observation de ce qui trahit une interface générée :

- **Aucun émoji comme icône.** Jeu vectoriel unique — Phosphor ou Heroicons —, épaisseur de trait constante.
- **Aucun dégradé décoratif.** Aucun violet sur blanc.
- **Aucune ombre portée sur la surface de travail.** Les filets séparent ; l'élévation est réservée aux vrais calques : modales, popovers.
- **Aucun grand rayon.** 4 à 6 px. Précision, pas douceur.
- **Aucun blanc excessif.** C'est un outil dense ; l'espace vide y est une perte.
- **Aucun titre surdimensionné.** Pas de `clamp(3rem, 10vw, 12rem)`.
- **Aucune police par défaut** — ni Inter, ni Roboto, ni système.
- **Aucune colonne de chiffres en Barlow Condensed.** Elle n'a pas de chasse tabulaire — voir la section 4.
- **Aucun contrôle borné par `--line`.** Un champ prend `--line-champ` : WCAG 1.4.11, section 3.
- **Aucun `transition: all`.** Nommer la propriété, sinon la géométrie s'anime aussi.

**Sept de ces interdits sont vérifiés par un test**, `src/test/gardeFous.test.ts` : hexadécimal en dur, `transition: all`, anneau de focus retiré, rayon au-delà de 6 px, émoji, chiffres en Condensed, contrôle borné par `--line`. Le huitième garde-fou vérifie qu'aucun `<input>` n'est écrit hors du composant `Champ`, qui est le seul à tenir les quatre exigences de la section 7. Chacun a été mis à l'épreuve par mutation : huit violations introduites, huit tests qui tombent, correspondance exacte.

Une règle qu'aucun test ne vérifie finit toujours par être enfreinte, et elle l'est le jour où personne ne relit — pas le jour où on l'écrit.

---

## 7. Accessibilité — non négociable

- Contraste **4.5:1** sur le texte, **3:1** sur les grands éléments et les glyphes. L'accent a déjà été ajusté pour cela.
- Anneau de focus visible, 2 à 4 px. **Ne jamais le retirer.**
- Ordre de tabulation identique à l'ordre visuel.
- `aria-label` sur tout bouton porté par une icône seule.
- Libellé visible sur chaque champ — **jamais un placeholder seul**.
- Erreur affichée **sous** le champ concerné, avec la cause et le moyen de corriger.
- La couleur ne porte jamais seule une information : y adjoindre une icône ou un texte.
- Cibles tactiles **44 px** minimum.
- Tableaux triables avec `aria-sort` reflétant l'état courant.
- Zone `aria-live` sur les erreurs de formulaire. **Elle doit préexister au message** : une région insérée en même temps que son contenu n'est pas annoncée.
- **Contraste 3:1 sur ce qui identifie un contrôle** — WCAG 1.4.11. La bordure d'un champ en fait partie : c'est la seule chose qui dise où cliquer. Voir `--line-champ`, section 3.
- **Une bascule d'état change son nom accessible, ou porte `aria-pressed` — jamais les deux.** Les deux ensemble font annoncer l'état deux fois.
- **Un bouton dans un formulaire porte `type="button"`** s'il ne soumet pas. Sans cela, révéler son mot de passe envoie le formulaire, et l'API compte une tentative échouée de plus vers le blocage temporisé.

---

## 8. Layout — d'après `orvea-io/wastern-vue`

La structure vient de l'application front de l'équipe, `src/layouts/AppLayout.vue` et `src/scss/layout/`. **La structure seulement**, pas le style.

- Un shell à **barre latérale de 240 px**, dont chaque entrée est **filtrée par le rôle** — leur équivalent de `useGuard` et `useRoutePermission`
- Des **badges de comptage** sur les entrées concernées
- Un **menu utilisateur** en pied de barre
- Un **état de route actif** explicite, marqué par un filet et non par une pastille arrondie
- Un `AuthLayout` distinct pour les écrans sans session
- Leur séparation entre barre latérale, navigation, panneau droit et adaptation mobile est bonne : la conserver

Les libellés et le regroupement du menu viennent du logiciel d'origine, pas d'une invention : `chantiertr-api/docs/legacy-index.html`, autour des lignes 4100 à 4240.

---

## 8bis. Le shell, tel qu'il est livré

Barre latérale **240 px**, en-tête **56 px**, aucune ombre, aucune animation sur la navigation. Les trois mesures sont celles de la section 2 ; les valeurs rendues ont été relevées au navigateur et non estimées.

### Le défilement est intérieur, pas celui de la page

`h-dvh` sur le shell, `overflow-hidden`, et `overflow-y-auto` sur la seule zone de contenu. Un tableau de budget a deux cents lignes : si c'est la **page** qui défile, l'en-tête et la barre latérale partent vers le haut, et quelqu'un qui cherche la ligne 150 perd le nom des colonnes et le menu en même temps.

Corollaire : `min-w-0` sur la zone de contenu. Sans lui, un tableau large pousse ce conteneur flex au-delà de son parent — la valeur par défaut de `min-width` pour un enfant flex est `auto`, donc la taille de son contenu — et c'est **la barre latérale** qui se fait comprimer.

### Le bandeau d'emprunt surmonte tout, barre latérale comprise

**C'est la pièce manquante d'un dispositif de sécurité, pas un ornement.** Tout l'emprunt de compte côté API — lecture seule, trace dans `impersonations`, refus d'emprunter un compte de plateforme — repose sur un postulat : que l'opérateur **sache** dans quel compte il se trouve.

`GET /me` ne le disait pas jusqu'au 30/07. L'emprunt vit dans la session sous `impersonator_id`, et le cookie de session est `HttpOnly` : **aucun JavaScript ne peut le deviner.** L'interface d'un emprunt était indiscernable d'une vraie connexion.

Le bandeau est donc au-dessus de la barre latérale et non dans la zone de contenu : un bandeau qui défile disparaît, précisément au moment où l'on oublie où l'on est. Une mutation qui le déplace sous la barre fait tomber un test.

Il porte l'**ambre en remplissage et le marine en écriture** — 5,79:1 —, un triangle d'avertissement pour que la couleur ne porte pas seule l'information, et la bande de chantier en pied : c'est le seul endroit du produit où son sens est littéral, « zone sous surveillance ».

`role="status"` et non `role="alert"` : un emprunt **dure**. `alert` interromprait la lecture à chaque navigation.

### L'état actif porte deux marques, jamais la couleur seule

Un filet vert de 2 px à gauche, un fond `--green-wash`, et le texte en `--green-strong`. Le filet est **toujours présent**, transparent au repos : sans cela l'apparition de la bordure décalerait le libellé de 2 px à chaque changement d'écran.

`NavLink` pose `aria-current="page"` — c'est cette marque que les technologies d'assistance lisent, et elle ne dépend d'aucune couleur.

### Le filtrage par rôle est un confort, pas une sécurité

Toutes les policies `viewAny` de l'API rendent `true`. Le cloisonnement se joue dans les requêtes, par `TenantScope`, et dans les policies par enregistrement. Cacher une entrée évite de montrer un écran vide ou une action refusée ; **cela ne protège rien.**

Une seule entrée est filtrée aujourd'hui : la grille des droits, réservée au `superadmin` — seul rôle dont `bypassesTenantScope()` est vrai, donc seul à pouvoir la régler. Pour un administrateur, ce serait un tableau de dix-huit cases qu'il ne peut pas toucher, décrivant des profils dont deux ne sont pas le sien.

Et « Mon entreprise » devient « Mes entreprises » pour le `superadmin`, comme dans le logiciel d'origine.

### Ce que `GET /me` doit rendre pour que tout cela tienne

| Clef | Contenu | Employée par |
|---|---|---|
| `data` | le compte | pied de barre, « Mon compte » |
| `emprunt` | `{ par: { id, nom } }` ou `null` | le bandeau |
| `droits` | les facultés **appliquées** et accordées | les boutons, à partir de la tâche 5 |

`droits` est filtré **deux fois** côté API : par la grille, et par `estApplique()`. Quatre des six droits n'appliquent encore rien. Les annoncer permettrait de masquer un bouton au nom d'un droit qu'aucune policy ne vérifie — **une restriction visible que le serveur n'applique pas inspire une confiance qu'elle ne mérite pas.**

---

## 9. Le legacy — ce qu'on lui prend, ce qu'on lui laisse

`chantiertr-api/docs/legacy-index.html` est la **seule spécification du comportement métier**.

**On lui prend :** la logique, les libellés, la structure du menu, les attentes de densité, le vocabulaire métier.

**On ne lui prend pas son style.** Il est daté. Ses tokens — marine et vert, rayon 14 px — ne sont pas repris. Ce fichier-ci fait foi sur le visuel.

---

---

---

## 10. Écrans sans session — direction validée

**Référence : `design-system/reference/connexion.html`.** Validée à l'écran par le client. Elle fait foi et **se transpose telle quelle en React** — elle ne s'interprète pas.

Ses ressources sont à côté : `logo.png` (détouré), `logo-blanc.png` (renversé pour fond sombre), `benne.png` (détouré, alpha). **Transposée en React :** `src/layouts/AuthLayout.tsx`, servie en WebP depuis `public/` — voir « Le poids des ressources » plus bas.

### Composition

Deux volets pleine hauteur, sans marge. Gauche `1fr`, droite **480 px fixes**.

**Volet gauche — bleu de marque `#0F3071` :**
- Le **logo blanc** en haut à gauche, largeur 186 px. `align-self:flex-start` est nécessaire : sans lui, le conteneur flex étire l'image sur toute la largeur.
- Un bloc poussé vers le bas par `margin-top:auto`, sur `max-width:20ch` : titre, paragraphe, chiffres
- **L'illustration de benne débordant du cadre** en bas à droite : `right:-8%`, `bottom:-6%`, largeur 54 %. Elle est en `::before`, donc sous le texte, et `pointer-events:none`.
- **La bande d'avertissement ambre en pied**, 9 px, rayures à 135°

**Volet droit — blanc, variante « Bande », validée le 30/07 :**
- **La bande d'avertissement reprise en tête**, 9 px. Les deux bandes se répondent en diagonale et referment la composition. C'est le seul ornement du volet.
- **Aucun titre, aucun sous-titre.** Les champs seuls.
- Les champs **centrés verticalement**, pleine largeur, 56 px ; bouton 58 px
- Un filet referme le formulaire au-dessus du lien « Mot de passe oublié ? »
- Un pied discret portant l'hôte de l'API

Trois traitements ont été comparés côte à côte avant ce choix : *Surface* (le volet en gris de travail, le formulaire en carte blanche posée dessus), *Filets* (champs soulignés, bouton marine traversant le volet de bord à bord) et *Bande*. La première version, sans aucun de ces trois partis, a été rejetée : le formulaire y flottait dans un blanc que rien ne justifiait.

### Six décisions à ne pas défaire

Chacune a été essayée dans l'autre sens et rejetée. Ne pas y revenir sans demander.

1. **Le logo reste à gauche.** Le déplacer à droite a été rejeté.
2. **Le volet droit ne porte aucun texte** hors libellés de champs et intitulé de bouton. *Sur la connexion seulement* — voir la nuance ci-dessous.
3. **Les champs sont centrés verticalement**, pas ancrés en haut.
4. **La bande d'avertissement ferme le volet gauche en pied et le volet droit en tête.** Jamais en couture verticale.
5. **L'illustration déborde du cadre.** C'est voulu : elle est cadrée serré pour être coupée.
6. **La typographie est Barlow et Barlow Condensed.** C'est cet écran qui a tranché — voir la section 4.

**La nuance sur la décision 2.** L'absence de texte vaut pour la *connexion*, où deux champs libellés « Adresse e-mail » et « Mot de passe » disent tout. Les deux autres écrans sans session — acceptation d'invitation, mot de passe oublié — **portent un titre**, parce qu'ils ne sont pas déductibles de leurs champs : arriver au bout d'un lien de courriel devant deux champs de mot de passe sans titre, c'est ne pas savoir ce qu'on fait. L'absence de texte est une élégance sur un écran évident ; c'est une faute sur un écran qui ne l'est pas. Composant : `EnteteAuth`.

### Les ressources visuelles

**Le logo.** Le fichier officiel est bleu sur blanc. Deux versions en sont dérivées : l'originale détourée sur alpha, et une **version renversée** où tout le bleu devient blanc et **seule la feuille garde son vert**. C'est celle-ci qui va sur fond sombre.

**L'illustration.** Générée par le client à partir d'un prompt cadré : sujet unique, palette stricte de la marque, fond transparent, cadrage serré destiné à être coupé. Elle arrivait sur un fond kaki dégradé avec ombre portée ; le détourage se fait par remplissage depuis les bords, en discriminant sur le fait que **le kaki a le rouge et le vert dominants là où les contours de l'illustration ont le bleu dominant.** Ce test épargne les contours, ce qu'un seuil de luminosité ne fait pas.

Le script de détourage est reproductible pour les prochaines illustrations.

### Les trois chiffres du volet gauche

**Ils sont relevés dans le catalogue du logiciel d'origine, pas choisis pour la composition.** La première version en portait deux de faux — « 3 offres » quand `TYPE_OFFRE` en compte 8, et « 24 mois suivis » qui n'avait aucune base. Un écran de connexion qui annonce un chiffre l'affirme au nom du produit.

| Chiffre | Constante du legacy | Contenu |
|---|---|---|
| **19** prestations | `PRESTATIONS` | P1 à P19, le bordereau de prix unitaires de référence |
| **8** types d'offre | `TYPE_OFFRE` | logiciel, prorata classique, prorata amélioré, lot 00, lot déchets, grand projet, avenant, ponctuel |
| **6** catégories | `CAT_ORDER` | maître d'ouvrage, AMO, société de facturation, entreprise de BTP, entreprise de services, fournisseur |

Ils vivent dans `src/contenu/identiteAuth.ts`, chacun avec sa provenance. **À revérifier au lot M1**, quand ces valeurs deviendront les cardinalités de vraies tables.

### Le poids des ressources

Les PNG fournis pesaient **1 044 Ko** pour le seul écran de connexion — le logo à 258 Ko pour un affichage à 186 px de large, soit 25 fois le nécessaire. Sur la 4G d'un bureau de chantier, c'est un écran de connexion qui ne s'affiche pas.

| Ressource | PNG | WebP | Codage |
|---|---|---|---|
| `logo-blanc` | 258 Ko | **10 Ko** | sans perte, redimensionné à 560 px |
| `logo` | 446 Ko | **49 Ko** | sans perte, redimensionné à 560 px |
| `benne` | 787 Ko | **157 Ko** | avec perte, q88, taille d'origine |

**166 Ko au lieu de 1 044**, soit 84 % de moins. Les logos sont **sans perte** : un tracé à aplats et bords nets ne supporte pas la compression avec perte, elle salit les contours. L'illustration, texturée, ne s'en aperçoit pas. Les PNG restent dans `design-system/reference/` comme sources.

### Ce que l'ambre porte ici

**L'ambre porte l'emphase du titre** — `compte tenu` sur bleu de marque.

Écart assumé à la discipline de la section 3, qui réserve l'ambre à l'alerte. Le client l'a choisi, c'est sa marque. **La règle de la section 3 reste valable partout ailleurs** : dans l'application connectée, l'ambre alerte et le vert agit.

### Règles de formulaire, du référentiel

- **Libellé visible** au-dessus de chaque champ. Jamais un placeholder seul.
- **Bascule afficher / masquer le mot de passe**, avec `aria-label` qui change d'état.
- **Types sémantiques** : `type="email"`, `inputmode="email"`, `autocomplete="username"` et `current-password`.
- **Anneau de focus visible** sur les champs, le bouton et la bascule. Jamais supprimé.
- Champs à **56 px**, bouton à **58 px**, **22 px entre les champs** — au-delà des minimums.
- Champs visuellement distincts : bordure **1,5 px en `--line-champ`**, état de survol distinct du repos.
- **La bascule ne vole pas le focus.** La maquette le renvoyait dans le champ ; au clavier, on perd alors le bouton qu'on vient d'actionner. Le focus reste sur la bascule.
- **Le halo vert de la maquette est retiré.** Superposé à l'anneau marine global, il faisait deux cercles concentriques de deux couleurs autour d'un même champ. La bordure verte au focus, elle, est conservée.

Tout cela est vérifié par `src/components/ui/Champ.test.tsx`, et les cinq mutations correspondantes tuent bien chacune un test.

### Typographie de ces écrans

Barlow Condensed 700 en capitales pour le titre, les chiffres d'affiche et les micro-libellés. Barlow 400/500/600 pour le texte courant. Titre à 76 px, interligne 0,90.

**L'arbitrage est clos.** Il était en attente entre Barlow et Fira ; cet écran l'a tranché en étant validé. Barlow partout, Fira retirée — et les chiffres des colonnes de montants sont en **Barlow tabulaire**, dont la fonte `tnum` a été mesurée présente. Barlow Condensed, elle, ne l'a pas : voir l'avertissement de la section 4.

### Deux mesures que la transposition a corrigées

**`max-w-[20ch]` ne se transpose pas.** La maquette écrit `20ch`, ce qui y vaut 181 px parce que son corps de texte est à 16 px. Le produit est à 14 px — section 2 — et le même `20ch` n'y vaut que 158 px : la phrase se casse en sept lignes au lieu de cinq. **La mesure est donc écrite en dur, 181 px.** Une unité relative qui dépend d'une taille ambiante différente n'est pas une transposition, c'est une coïncidence.

Et cette boîte est **plus étroite que son titre**, volontairement : à 76 px chaque mot dépasse 181 px, donc chacun tombe sur sa ligne et le texte déborde à droite. C'est ce qui produit les quatre lignes « DÉPENSES / COMMUNES, / COMPTE / TENU ». L'élargir les recollerait.

**Le titre doit porter sa couleur explicitement.** La règle de base `h1 { color: var(--color-navy) }` s'applique à l'élément et bat la couleur héritée du volet : sans classe de couleur, le titre est marine sur marine, donc invisible. Seul « compte tenu » resterait lisible, parce que son `span` porte la sienne.

### Adaptation au téléphone

La maquette n'en traite pas — elle est composée pour un poste de travail. Sous **1 024 px** :

- les deux volets s'empilent, le volet marine devient une en-tête
- la phrase, les trois chiffres et l'illustration **disparaissent** : sur 375 px, ils repousseraient les champs sous la ligne de flottaison
- le titre passe de 76 px à 52 px, le logo de 186 px à 156 px
- **la bande du volet droit disparaît.** Empilées, les deux bandes de même diagonale se retrouvent bord à bord et font un seul bandeau de 18 px au lieu de se répondre. La jonction n'en porte qu'une.
