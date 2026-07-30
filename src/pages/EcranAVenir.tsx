import { EnteteEcran } from '@/components/shell/EnteteEcran'

/**
 * Un ecran de la barre laterale dont le contenu n'est pas encore ecrit.
 *
 * IL DOIT AVOIR DISPARU A LA FIN DU LOT S0-B. Les quatre ecrans qu'il occupe —
 * entreprises, contacts, comptes, grille des droits — sont les taches 3 a 5 du
 * plan, et chacune le remplace par le vrai. S'il reste un seul de ces
 * remplacements a faire quand le lot se ferme, c'est un ecran vide livre.
 *
 * POURQUOI IL EXISTE PLUTOT QUE RIEN. Une barre laterale se verifie en la
 * traversant : la route active, le filet vert, le titre de groupe, le
 * comportement du bandeau d'emprunt d'un ecran a l'autre. Avec des entrees qui
 * mènent a une page introuvable, rien de tout cela ne se voit.
 *
 * Ce qu'il ne fait PAS : promettre. Il ne montre ni tableau vide, ni squelette de
 * chargement, ni bouton inerte. Il dit ce qui manque et quand cela arrive — c'est
 * une note de chantier, pas une maquette.
 */
export interface EcranAVenirProps {
  titre: string
  /** Le numero de tache du plan qui livrera cet ecran. */
  tache: number
  /** Ce que l'ecran fera, en une phrase. */
  objet: string
}

export function EcranAVenir({ titre, tache, objet }: EcranAVenirProps) {
  return (
    <>
      <EnteteEcran titre={titre} />

      <div className="p-3">
        <div className="bg-card border-line max-w-[560px] rounded-6 border p-4">
          <p className="text-navy text-14">{objet}</p>
          <p className="text-slate mt-2 text-13">
            Écran non livré. Il arrive à la tâche <span className="chiffres">{tache}</span> du lot
            S0-B.
          </p>
        </div>
      </div>
    </>
  )
}
