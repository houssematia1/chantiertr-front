# Socle front (S0-B) — Plan d'implémentation

**Périmètre :** le front React du socle. **Le déploiement est explicitement hors lot** — il sera traité en dernier, après les modules métier.

**Dépôt :** `houssematia1/chantiertr-front`
**API :** `houssematia1/chantiertr-api`, branche `feature/s0a-socle-api` — 665 tests, PHPStan niveau 8.

---

## Ce contre quoi ce plan existe

Le risque de ce lot n'est pas technique. C'est de produire une interface **générique** — celle qu'on reconnaît immédiatement comme générée : cartes à coins très arrondis, ombres portées partout, dégradés violets, icônes émoji, titres surdimensionnés, espacements doubles de ce qu'il faut, et un vide au centre de l'écran.

Chantier Tranquille est un outil de travail. Un conducteur de travaux y saisit un avancement entre deux appels, sur un écran de portable, dans un bureau de chantier. Ce qu'il veut : **de la densité et de la vitesse.** Pas de la respiration.

Les trois sources de vérité de ce lot, dans cet ordre :

1. **`docs/legacy-index.html` de l'API** — l'application d'origine. Ses 480 lignes de CSS (lignes 15951 à 16427) portent l'identité visuelle réelle et la densité réelle. C'est la référence.
2. **`orvea-io/wastern-vue`** — l'application front de l'équipe. À reprendre pour la **structure de layout uniquement** : `src/layouts/AppLayout.vue` et `src/scss/layout/`. Pas ses composants métier, pas son style.
3. **La philosophie d'ingénierie d'interface d'Emil Kowalski**, dans `~/Downloads/emilkowalski-skills/skills/emil-design-eng/SKILL.md`.

---

## L'identité visuelle, relevée dans le legacy

```
--navy:      #13233B    --navy-soft: #2B3E59    --slate:  #5A6B82
--green:     #1FA37A    --green-d:   #157C5C    --green-l: #E7F5F0
--bg:        #F4F7FA    --card:      #FFFFFF    --line:   #E3E8EF
--ok:        #1FA37A    --warn:      #E8A33D    --danger: #D9534F
--radius:    14px
--shadow:    0 1px 3px rgba(19,35,59,.06)  ← une ombre, discrète, une seule
```

Bleu marine et vert. **Pas** le teal du projet mobile, qui est un autre produit.

Le rayon est de **14 px**, pas 24. L'ombre est **unique et à peine visible**. Ces deux valeurs disent tout du registre : sobre, dense, professionnel.

---

## Ce que dit la philosophie d'Emil, appliquée ici

**La première question est « faut-il animer ? »**, et elle se répond par la fréquence :

| Fréquence d'apparition | Décision | Dans ce produit |
|---|---|---|
| 100+ fois par jour | **Aucune animation, jamais** | Navigation, lignes de tableau, champs de saisie, onglets |
| Des dizaines de fois | Réduire drastiquement | Survols, ouverture de menus |
| Occasionnel | Animation standard | Modales, tiroirs, notifications |
| Rare | Peut avoir du soin | Première connexion, acceptation d'invitation |

**Jamais d'animation sur une action déclenchée au clavier.** Elle est répétée des centaines de fois par jour ; l'animation la fait paraître lente.

**Courbes personnalisées obligatoires** — les courbes CSS natives sont trop molles :

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);    /* entrées, sorties */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* déplacement à l'écran */
```

**Jamais `ease-in`** sur une animation d'interface : elle démarre lentement, précisément au moment où l'œil regarde.

**Durées :** retour de clic 100-160 ms, infobulle 125-200 ms, menu 150-250 ms, modale 200-300 ms. **Rien au-dessus de 300 ms.**

**Jamais `transition: all`** — nommer la propriété.

**Un bouton doit répondre au clic :** `transform: scale(0.97)` sur `:active`. Sans ça, l'interface paraît morte.

**Rien n'apparaît de rien :** une entrée part de `scale(0.95)` et `opacity: 0`, jamais de `scale(0)`.

---

## Structure de layout, d'après wastern-vue

`src/layouts/AppLayout.vue` donne le patron, à transposer en React :

- Un shell avec **barre latérale**, dont chaque entrée est **filtrée par le rôle** de l'utilisateur — l'équivalent de leurs composables `useGuard` et `useRoutePermission`
- Des **badges de comptage** sur les entrées concernées
- Un **menu utilisateur** en pied de barre, avec le logo de l'entreprise
- Un **état de route active** explicite
- Un `AuthLayout` distinct pour les écrans sans session : connexion, acceptation d'invitation, mot de passe oublié
- Leur `src/scss/layout/` sépare barre latérale, barre de navigation, panneau latéral droit et adaptation mobile — cette séparation est bonne, à conserver

**La structure du menu vient du legacy**, pas d'une invention. Ses libellés et son regroupement sont dans la render function précompilée, autour des lignes 4100 à 4240 : un groupe « Contacts » contenant *Entreprises* et *Contacts*, un groupe « Administration » contenant *Mes entreprises* pour le super-administrateur ou *Mon entreprise* sinon.

---

## Découpage en tâches

| # | Tâche | Livrable |
|---|---|---|
| 1 | Échafaudage, tokens, client HTTP, authentification | Vite + React + TS + Tailwind, tokens du legacy, connexion fonctionnelle contre l'API |
| 2 | Shell et navigation | `AppLayout`, `AuthLayout`, barre latérale filtrée par rôle, bandeau d'impersonation |
| 3 | Annuaire des entreprises et fiche | Liste, filtres par catégorie, fiche, attribution du numéro d'adhérent |
| 4 | Contacts | Liste, carnet d'adresses, création, retrait du carnet |
| 5 | Comptes et grille de droits | Annuaire des utilisateurs, invitation, archivage, réactivation, grille de droits |
| 6 | Mon compte et flux de lien | Profil, changement de mot de passe, acceptation d'invitation, mot de passe oublié |
| 7 | Parcours de bout en bout | Quatre parcours Playwright, et l'intégration continue |

Le déploiement Envoyer ne figure pas dans cette liste : il est reporté en fin de projet.

---

## Contraintes techniques

- **React, TypeScript, Vite, Tailwind.** Pas de bibliothèque de composants imposée d'office — voir la compétence `pick-ui-library` d'Emil avant d'introduire une dépendance, et ne l'introduire que si le composant est réellement difficile (saisie de dates, tableaux virtualisés, sélecteurs à recherche).
- **Authentification par cookie de session Sanctum.** Le jeton ne transite jamais en JavaScript. Il faut appeler `/sanctum/csrf-cookie` avant la première écriture, et envoyer les requêtes avec les identifiants de session.
- **État serveur : TanStack Query.** Aucun état serveur dupliqué dans un magasin global — c'est la source des incohérences d'affichage.
- **Formulaires : React Hook Form et Zod.**
- **Aucun calcul métier dans le front.** L'API expose déjà les totaux ; le front affiche. Cette règle vaudra surtout au lot M1, autant la tenir dès maintenant.
- **Textes en français.** L'API renvoie déjà ses messages d'erreur en français : les afficher, ne pas les réécrire.
- **Aucune marque tierce** héritée du logiciel d'origine.

## Méthode

Chaque tâche se termine par une capture de l'écran livré, comparée à l'écran correspondant du legacy. **Si l'écran neuf est plus aéré, plus arrondi et plus vide que l'ancien, il est faux.**
