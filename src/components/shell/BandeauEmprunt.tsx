import type { Emprunt } from '@/api/auth'
import { useArreterEmprunt } from '@/api/auth'
import { Bouton } from '@/components/ui/Bouton'

/**
 * Le bandeau d'emprunt de compte.
 *
 * IL EST LA PIECE MANQUANTE D'UN DISPOSITIF DE SECURITE, pas un ornement. Tout
 * l'emprunt de compte cote API — lecture seule par `ImpersonationReadOnly`, trace
 * dans `impersonations`, refus d'emprunter un compte de plateforme — repose sur
 * un postulat : que l'operateur SACHE dans quel compte il se trouve. Sans ce
 * bandeau, l'interface d'un emprunt est indiscernable d'une vraie connexion, et
 * un super-administrateur lit les donnees d'un adherent en croyant lire les
 * siennes.
 *
 * `GET /me` ne le disait pas avant le 30/07 : l'emprunt vit dans la session sous
 * `impersonator_id`, et le cookie de session est `HttpOnly`. Aucun JavaScript ne
 * peut le deviner — c'est l'API qui doit le dire, et elle le dit maintenant.
 *
 * L'AMBRE REMPLIT, LE MARINE ECRIT — MASTER § 3. Blanc sur l'ambre vaut 2,16:1 ;
 * marine sur l'ambre, 5,79:1. Et la bande de chantier ferme le bandeau en pied :
 * c'est le seul endroit du produit ou son sens est litteral, « zone sous
 * surveillance ».
 *
 * AUCUNE ANIMATION D'ENTREE. MASTER § 5 reserve le soin a ce qui est rare, et un
 * emprunt l'est — mais un bandeau qui glisse est un bandeau qu'on regarde
 * arriver puis qu'on oublie. Celui-ci est present ou absent, sans transition :
 * il doit se lire comme un etat, pas comme une notification.
 */
export interface BandeauEmpruntProps {
  emprunt: Emprunt
  /** Le compte dans lequel on se trouve. */
  nomEmprunte: string
}

export function BandeauEmprunt({ emprunt, nomEmprunte }: BandeauEmpruntProps) {
  const arret = useArreterEmprunt()

  return (
    // `role="status"` et non `role="alert"` : ce n'est pas un evenement qui
    // survient, c'est un etat qui dure. `alert` interromprait la lecture a chaque
    // navigation.
    <div
      role="status"
      className="bg-warn-fill text-on-warn-fill relative flex shrink-0 items-center gap-3 px-4 pt-2.5 pb-[calc(0.625rem+9px)]"
    >
      <IconeAvertissement />

      <p className="text-13 leading-corps">
        {/* Le nom du compte emprunte d'abord : c'est l'information dont on a
            besoin pour savoir ce qu'on lit. Le nom de l'emprunteur ensuite, parce
            qu'un poste partage existe. */}
        Vous agissez en tant que <strong className="font-semibold">{nomEmprunte}</strong>. Session
        en lecture seule, ouverte par {emprunt.par.nom} et tracée.
      </p>

      <Bouton
        variante="neutre"
        taille="sm"
        className="ml-auto"
        disabled={arret.isPending}
        aria-busy={arret.isPending}
        onClick={() => {
          arret.mutate()
        }}
      >
        {arret.isPending ? 'Sortie…' : 'Reprendre mon compte'}
      </Bouton>

      {/* La bande de chantier, en pied. Le rembourrage bas du bandeau lui laisse
          ses 9 px : sans cela elle recouvrirait la derniere ligne de texte. */}
      <div className="bande-chantier absolute inset-x-0 bottom-0 h-[9px]" aria-hidden="true" />
    </div>
  )
}

/**
 * Le triangle d'avertissement.
 *
 * `aria-hidden` : le texte du bandeau dit tout. MASTER § 7 exige que la couleur
 * ne porte jamais seule une information — ce glyphe est la seconde marque, pour
 * qui ne distingue pas l'ambre du reste.
 */
function IconeAvertissement() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path d="M12 3.6 2.3 20.4h19.4L12 3.6z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.4h.01" />
    </svg>
  )
}
