/**
 * L'etat d'un compte, en pastille.
 *
 * C'EST LE SEUL ENDROIT OU LA COULEUR PORTE DU SENS, et elle le porte
 * legitimement : MASTER § 3 reserve le vert et le rouge au sens metier — valide,
 * depasse. Un compte en attente d'invitation prend l'ambre, qui ne s'ecrit jamais
 * et se contente de remplir, avec du marine dessus (5,79:1).
 *
 * MASTER § 7 : la couleur ne porte pas SEULE l'information — le libelle de l'API
 * est dans la pastille, et c'est lui qu'on lit.
 *
 * Extrait de `MonCompte` au lot 3 : l'annuaire des comptes de la tache 5 en aura
 * besoin sur chaque ligne de son tableau.
 */
const TONS: Record<string, string> = {
  actif: 'bg-green-wash text-green-strong',
  invite: 'bg-warn-fill text-on-warn-fill',
  archive: 'bg-danger text-on-danger',
}

export interface EtatProps {
  /** La valeur brute de l'API — `actif`, `invite`, `archive`. */
  statut: string
  /** Le libelle de l'API, affiche tel quel. */
  libelle: string
}

export function Etat({ statut, libelle }: EtatProps) {
  return (
    <span
      className={`inline-block rounded-4 px-2 py-px text-12 font-medium ${TONS[statut] ?? 'bg-bg text-navy'}`}
    >
      {libelle}
    </span>
  )
}
