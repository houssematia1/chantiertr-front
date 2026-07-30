import { Outlet } from 'react-router'

import { Marque } from '@/components/ui/Marque'
import { CHIFFRES_CATALOGUE, PHRASE_AFFICHE, TITRE_AFFICHE } from '@/contenu/identiteAuth'

/**
 * Enveloppe des ecrans sans session : connexion, acceptation d'invitation, mot
 * de passe oublie.
 *
 * C'EST LA TRANSPOSITION DE `design-system/reference/connexion.html`, valide par
 * le client. Cette maquette fait foi sur la composition ; ce fichier n'invente
 * rien et ne « corrige » rien. Cinq decisions y sont acquises et ne se
 * redefaisent pas — elles sont dans MASTER § 10, et les voici en clair parce que
 * c'est ici qu'on serait tente de les defaire :
 *
 *   1. LE LOGO RESTE A GAUCHE, en tete du volet marine. Pas a droite.
 *   2. LE VOLET DROIT NE PORTE AUCUN TEXTE d'accompagnement — ni titre, ni
 *      phrase, ni « bienvenue ». Rien que les champs.
 *   3. LES CHAMPS SONT CENTRES VERTICALEMENT dans leur volet, pas ancres en
 *      haut.
 *   4. LA BANDE DE CHANTIER ferme le volet marine en pied et le volet du
 *      formulaire en tete : les deux se repondent en diagonale.
 *   5. L'ILLUSTRATION DEBORDE DU CADRE. Elle n'est pas contenue, elle est coupee
 *      par les bords — c'est ce qui l'empeche de ressembler a une vignette.
 *
 * Le layout precedent etait une carte de 360 px centree sur un fond gris, avec du
 * blanc partout autour. Il a ete rejete, et il l'a ete a raison.
 *
 * ADAPTATION AU TELEPHONE. La maquette de reference n'en traite pas : elle est
 * composee pour un poste de travail. Elle est completee ici, parce que le lot
 * s'adresse a « un conducteur de travaux entre deux appels, sur un ecran de
 * portable, dans un bureau de chantier ». Sous 1 024 px les deux volets
 * s'empilent et le volet marine se reduit a une en-tete — logo, titre, bande —
 * sans la phrase, sans les chiffres et sans l'illustration : sur 380 px de large,
 * ils repousseraient les champs sous la ligne de flottaison.
 */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:h-dvh lg:min-h-0 lg:grid-cols-[1fr_480px]">
      <VoletIdentite />

      {/*
       * Le volet du formulaire.
       *
       * `relative` porte la bande de chantier en tete. Aucune bordure a gauche :
       * l'aplat marine fait sa propre arete, et un filet clair par-dessus ne
       * ferait qu'un lisere sale.
       */}
      <section className="bg-card relative flex flex-col px-8 pt-12 pb-10 lg:px-14 lg:pb-11">
        {/*
         * MASQUEE SOUS 1 024 PX. Les deux volets s'y empilent, et cette bande se
         * retrouverait collee a celle du volet marine : deux rubans de 9 px de
         * meme diagonale, bord a bord, ne se repondent pas — ils font un seul
         * bandeau de 18 px. La jonction n'en porte donc qu'un, celui du volet
         * marine.
         */}
        <div
          className="bande-chantier absolute inset-x-0 top-0 hidden h-[9px] lg:block"
          aria-hidden="true"
        />

        {/*
         * `flex-1` et `justify-center` : les champs sont centres dans la hauteur
         * disponible — decision 3. Sur telephone la colonne n'a pas de hauteur
         * excedentaire et le centrage est sans effet, ce qui est le comportement
         * voulu.
         *
         * `max-w-[420px]` ne vaut QUE sous 1 024 px. Au-dela, le volet fait
         * 480 px et son rembourrage laisse 368 px utiles : le plafonner serait
         * redondant. En dessous, la colonne prend toute la largeur de l'ecran, et
         * sur une tablette en paysage un champ de 900 px de long devient une
         * ligne qu'on ne relit pas.
         */}
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center lg:max-w-none">
          <Outlet />
        </div>

        <PiedApi />
      </section>
    </div>
  )
}

/**
 * Le volet d'identite : l'aplat marine.
 *
 * `overflow-hidden` est ce qui fait la decision 5 : l'illustration est posee en
 * debord et c'est le volet qui la coupe. Sans lui, elle deborderait sur le
 * formulaire.
 */
function VoletIdentite() {
  return (
    <section className="bg-navy text-on-navy relative flex flex-col overflow-hidden px-8 pt-10 pb-8 lg:px-15 lg:pt-13 lg:pb-11">
      {/*
       * L'illustration, en debord bas-droite.
       *
       * `aria-hidden` et `alt=""` : elle ne porte aucune information que le texte
       * ne porte deja. Une description de benne n'apprendrait rien a qui se
       * connecte.
       *
       * Elle est ABSENTE sous 1 024 px et non simplement reduite : sur un
       * telephone, elle occuperait la moitie d'une en-tete qui doit rester une
       * en-tete.
       *
       * `pointer-events-none` : un glisser-deposer accidentel sur l'ecran de
       * connexion ouvrirait l'image dans l'onglet.
       */}
      <img
        src="/benne.webp"
        alt=""
        aria-hidden="true"
        width={907}
        height={604}
        className="pointer-events-none absolute -right-[8%] -bottom-[6%] hidden w-[54%] max-w-none select-none lg:block"
      />

      {/*
       * `self-start` est INDISPENSABLE et non cosmetique : dans une colonne flex,
       * un enfant s'etire par defaut sur toute la largeur transversale, et
       * l'image du logo se laisserait etirer sur les 1 030 px du volet.
       * `shrink-0` l'empeche d'etre comprimee quand la colonne manque de place.
       */}
      {/*
       * 186 px est la mesure de la maquette, pour un volet de 1 032 px — 18 % de
       * sa largeur. Sur un telephone de 375 px, le meme logo en occuperait 60 %.
       * La classe de largeur l'emporte sur l'attribut `width` ; l'attribut reste
       * utile, c'est lui qui donne le rapport avant chargement.
       */}
      <Marque
        ton="blanc"
        largeur={186}
        className="relative w-[156px] shrink-0 self-start lg:w-[186px]"
      />

      {/*
       * `mt-auto` pousse le bloc en pied de volet : le titre s'appuie sur la
       * bande de chantier, il ne flotte pas au milieu.
       *
       * 181 PX ET NON `max-w-[20ch]`. La maquette de reference ecrit `20ch`, et
       * cela y vaut 181 px parce que son corps de texte est a 16 px. Ici le corps
       * est a 14 px — MASTER § 2 — et le meme `20ch` ne vaudrait que 158 px : la
       * phrase se casserait en sept lignes au lieu de cinq. Une unite relative
       * qui depend d'une taille ambiante differente n'est pas une transposition,
       * c'est une coincidence. La mesure validee est donc ecrite en dur.
       *
       * ET CETTE BOITE EST PLUS ETROITE QUE SON TITRE, volontairement : a 76 px,
       * chaque mot du titre est plus large que 181 px, donc chacun tombe sur sa
       * ligne et le texte deborde a droite. C'est ce qui produit les quatre
       * lignes « DEPENSES / COMMUNES, / COMPTE / TENU » de la composition
       * validee. Elargir la boite les recollerait — ne pas le faire.
       */}
      <div className="relative mt-10 max-w-[181px] lg:mt-auto">
        {/*
         * `text-on-navy` EST OBLIGATOIRE ICI. La regle de base d'`index.css`
         * ecrit `h1 { color: var(--color-navy) }`, et une declaration portee par
         * l'element bat la couleur heritee du volet : sans cette classe, le titre
         * est marine sur marine, donc invisible. Seul « compte tenu » resterait
         * lisible, parce que son `span` porte sa propre couleur.
         */}
        <h1 className="font-display text-on-navy leading-affiche tracking-affiche text-[52px] font-bold uppercase lg:text-affiche">
          {TITRE_AFFICHE.debut}{' '}
          {/* L'ambre sur le marine vaut 5,79:1 : il passe le seuil du texte
              courant, pas seulement celui du grand texte. */}
          <span className="text-warn-fill">{TITRE_AFFICHE.accent}</span>
        </h1>

        {/* La phrase et les chiffres disparaissent sur telephone — voir l'en-tete
            du fichier. Aucune largeur propre : le conteneur la gouverne, et lui
            en donner une seconde qu'il plafonne serait une regle morte. */}
        <p className="text-on-navy-soft leading-corps mt-5 hidden text-[15.5px] lg:block">
          {PHRASE_AFFICHE}
        </p>

        <dl className="mt-9 hidden lg:flex">
          {CHIFFRES_CATALOGUE.map((chiffre) => (
            <div
              key={chiffre.source}
              className="border-navy-line mr-7 border-r pr-7 last:mr-0 last:border-r-0 last:pr-0"
            >
              {/*
               * `chiffres` porte la chasse tabulaire — et impose Barlow. Barlow
               * Condensed n'a PAS de fonte tabulaire : la lui demander ici
               * n'aurait aucun effet. Voir `tokens.css`, section « Les chiffres ».
               */}
              <dd className="chiffres leading-affiche tracking-affiche text-affiche-chiffre font-semibold">
                {chiffre.valeur}
              </dd>
              <dt className="font-display text-on-navy-faint mt-2 text-[11px] font-semibold tracking-[0.15em] uppercase">
                {chiffre.libelle}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      {/* La bande de chantier, en pied — decision 4. */}
      <div className="bande-chantier absolute inset-x-0 bottom-0 h-[9px]" aria-hidden="true" />
    </section>
  )
}

/**
 * Le pied du volet droit : l'hote de l'API contre lequel ce front parle.
 *
 * Il existe parce qu'un front peut parler a une API de recette en croyant parler
 * a la production, et que ce genre de meprise se paie en donnees. Le logiciel
 * d'origine affichait a cet endroit le compte de demonstration ET son mot de
 * passe, en dur dans la source ; ici il n'y a qu'un nom d'hote.
 *
 * `font-mono` sur l'hote : c'est une chaine technique qu'on compare caractere
 * par caractere, et c'est le seul usage du monospace du produit.
 */
function PiedApi() {
  const brut = import.meta.env.VITE_API_URL
  const hote =
    brut === undefined || brut === ''
      ? window.location.host
      : new URL(brut, window.location.origin).host

  return (
    <p className="text-slate shrink-0 text-12">
      API{' '}
      <code className="bg-bg border-line text-navy font-mono rounded-4 border px-[7px] py-[2px] text-[11.5px]">
        {hote}
      </code>
    </p>
  )
}
