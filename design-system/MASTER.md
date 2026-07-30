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

## 3. Palette — Construction / Architecture

Gris industriel et orange de sécurité. L'accent a été ajusté de `#F97316` à `#EA580C` pour tenir le ratio WCAG 3:1 — ne le remettez pas à sa valeur d'origine.

| Rôle | Valeur | Usage |
|---|---|---|
| `--primary` | `#64748B` | Chrome, barre latérale, éléments structurants |
| `--on-primary` | `#FFFFFF` | |
| `--secondary` | `#94A3B8` | Éléments secondaires |
| `--accent` | `#EA580C` | **L'action, et elle seule.** Orange de sécurité. |
| `--on-accent` | `#FFFFFF` | |
| `--background` | `#F8FAFC` | Surface de travail |
| `--card` | `#FFFFFF` | Cartes, tableaux |
| `--foreground` | `#334155` | Texte courant |
| `--muted` | `#EBF0F5` | Fonds atténués, en-têtes de tableau |
| `--muted-foreground` | `#64748B` | Texte secondaire, libellés |
| `--border` | `#E2E8F0` | Filets, séparateurs |
| `--destructive` | `#DC2626` | Suppression, dépassement |
| `--ring` | `#64748B` | Anneau de focus |

**Discipline de couleur.** L'orange est réservé à l'action. Le rouge et le vert gardent leur sens métier — validé, dépassé — et ne servent jamais à décorer. Trois couleurs qui ne se disputent pas l'attention.

Jetons sémantiques obligatoires. **Aucun hexadécimal en dur dans un composant.**

---

## 4. Typographie — Fira Code et Fira Sans

Humeur retournée par le référentiel : *dashboard, données, technique, précis.*

| Rôle | Police |
|---|---|
| Titres, libellés de colonnes | **Fira Code** 500/600 |
| Texte courant, formulaires | **Fira Sans** 400/500 |
| **Chiffres, montants, références** | **Fira Code**, tabulaire |

```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@400;500;600&display=swap');
```

**Tous les chiffres en tabulaire**, alignés à droite. C'est une règle du référentiel (`number-tabular`) et c'est le cœur du design de cette application : un tableau de budget doit se lire comme un registre, pas comme un tableau web. Sans tabulaire, les colonnes dansent d'une ligne à l'autre.

Échelle : 12 · 13 · 14 · 16 · 20 · 24. Interligne 1.5 sur le texte courant.

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
- Zone `aria-live` sur les erreurs de formulaire.

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

## 9. Le legacy — ce qu'on lui prend, ce qu'on lui laisse

`chantiertr-api/docs/legacy-index.html` est la **seule spécification du comportement métier**.

**On lui prend :** la logique, les libellés, la structure du menu, les attentes de densité, le vocabulaire métier.

**On ne lui prend pas son style.** Il est daté. Ses tokens — marine et vert, rayon 14 px — ne sont pas repris. Ce fichier-ci fait foi sur le visuel.
