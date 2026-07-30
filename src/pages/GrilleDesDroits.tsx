import { useGrilleDesDroits, useReglerUneCase } from '@/api/comptes'
import type { LigneDeGrille } from '@/api/comptes'
import { CarteDeSection } from '@/components/donnees/TableauSouple'
import { EnteteEcran } from '@/components/shell/EnteteEcran'
import { Alerte } from '@/components/ui/Alerte'
import { messageDErreur } from '@/lib/erreurs'

/**
 * La grille des droits.
 *
 * SIX FACULTES, TROIS PROFILS, DIX-HUIT CASES. Elle ne sait que RETIRER : cote API
 * la grille est consultee en conjonction d'une policy — `policy && grille` —, de
 * sorte qu'aucune ligne de la table ne peut rendre possible ce qu'une policy
 * refuse. Un frein, jamais un moteur. Ce que l'ecran doit dire, et il le dit en
 * tete.
 *
 * QUATRE DROITS SUR SIX N'APPLIQUENT ENCORE RIEN, et l'ecran le SIGNALE plutot que
 * de les masquer. Les masquer laisserait croire que la grille compte deux lignes ;
 * les afficher sans le dire ferait croire a l'administrateur qu'il a restreint
 * quelque chose alors qu'il ne s'est rien passe. L'API le declare —
 * `actif` et `lot_attendu` — parce que la declaration ne peut pas mentir : un test
 * d'architecture la confronte aux sources.
 *
 * Leurs cases sont donc DESACTIVEES et portees par une ligne grisee, avec le lot
 * qui les branchera.
 *
 * IL N'Y A PAS DE COLONNE « SUPER-ADMINISTRATEUR », et ce n'est pas un oubli : la
 * grille ne le decrit pas. Lui en donner une reviendrait a offrir une case a
 * decocher sur le cloisonnement lui-meme.
 */
export function GrilleDesDroits() {
  const grille = useGrilleDesDroits()
  const reglage = useReglerUneCase()

  const lignes = grille.data ?? []
  const profils = lignes[0]?.profils ?? []

  return (
    <>
      <EnteteEcran
        titre="Grille des droits"
        precision="Ce que chaque profil peut faire. La grille retire des facultés, elle n'en ajoute jamais."
      />

      <div className="max-w-[1100px] p-6">
        {grille.error != null && <Alerte ton="erreur">{messageDErreur(grille.error)}</Alerte>}
        {reglage.error != null && <Alerte ton="erreur">{messageDErreur(reglage.error)}</Alerte>}

        <CarteDeSection titre="Facultés" compte={lignes.length}>
          <div role="table" aria-label="Grille des droits">
            <div role="row" className="flex items-center px-2.5">
              <span
                role="columnheader"
                className="text-slate flex flex-[3_1_0] items-center px-2.5 pb-2.5 text-[0.8rem] font-semibold uppercase"
              >
                Faculté
              </span>
              {profils.map((profil) => (
                <span
                  key={profil.profil}
                  role="columnheader"
                  className="text-slate flex flex-[1_1_0] items-center justify-center px-2.5 pb-2.5 text-center text-[0.8rem] font-semibold uppercase"
                >
                  {profil.libelle}
                </span>
              ))}
            </div>

            {lignes.length === 0 ? (
              <div className="bg-card border-line rounded-8 border p-8 text-center">
                <p className="text-slate">{grille.isPending ? '…' : 'Grille indisponible.'}</p>
              </div>
            ) : (
              lignes.map((ligne) => (
                <LigneDeLaGrille
                  key={ligne.droit}
                  ligne={ligne}
                  enCours={reglage.isPending}
                  onBasculer={(profil, accorde) => {
                    reglage.mutate({ droit: ligne.droit, profil, accorde })
                  }}
                />
              ))
            )}
          </div>
        </CarteDeSection>
      </div>
    </>
  )
}

/**
 * Une ligne de la grille.
 *
 * `bg-bg` et `opacity` sur une ligne inactive, PLUS le lot attendu en clair. La
 * couleur ne porte pas seule l'information — MASTER § 7 —, et « arrive au lot M3 »
 * dit ce que « grisé » ne dit pas.
 */
function LigneDeLaGrille({
  ligne,
  enCours,
  onBasculer,
}: {
  ligne: LigneDeGrille
  enCours: boolean
  onBasculer: (profil: string, accorde: boolean) => void
}) {
  return (
    <div
      role="row"
      className={[
        'border-line flex min-h-15 w-full items-center border p-2 first:rounded-t-8 last:rounded-b-8 not-last:border-b-0',
        ligne.actif ? 'bg-card' : 'bg-bg',
      ].join(' ')}
    >
      <div role="cell" className="flex min-w-0 flex-[3_1_0] flex-col justify-center px-2.5">
        <span className={ligne.actif ? 'text-navy' : 'text-slate'}>{ligne.libelle}</span>

        {!ligne.actif && (
          <span className="text-slate text-12">
            {ligne.lot_attendu == null
              ? "Cette faculté n'est pas encore appliquée."
              : `Cette faculté n'est pas encore appliquée — elle arrive au lot ${ligne.lot_attendu}.`}
          </span>
        )}
      </div>

      {ligne.profils.map((profil) => (
        <div key={profil.profil} role="cell" className="flex flex-[1_1_0] justify-center px-2.5">
          <label className="inline-flex cursor-pointer items-center gap-2">
            {/* Le libelle accessible porte LES DEUX noms — la faculté et le profil.
                Dix-huit cases nues, un lecteur d'écran ne saurait pas laquelle. */}
            <span className="sr-only">{`${ligne.libelle} — ${profil.libelle}`}</span>
            <input
              type="checkbox"
              checked={profil.accorde}
              disabled={enCours || !ligne.actif}
              onChange={(evenement) => {
                onBasculer(profil.profil, evenement.target.checked)
              }}
              className="accent-green-strong size-4.5 disabled:cursor-not-allowed disabled:opacity-40"
            />
          </label>
        </div>
      ))}
    </div>
  )
}
