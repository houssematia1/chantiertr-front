import { useRef, useState } from 'react'

import { useRetirerLogo, useTeleverserLogo } from '@/api/entreprises'
import type { Entreprise } from '@/api/entreprises'
import { LogoEntreprise } from '@/components/donnees/LogoEntreprise'
import { Alerte } from '@/components/ui/Alerte'
import { Bouton } from '@/components/ui/Bouton'
import { messageDErreur } from '@/lib/erreurs'

/**
 * Le logo de la fiche : le montrer, le remplacer, le retirer.
 *
 * UN `<input type="file">` CACHE DERRIERE UN BOUTON, et non stylise. Le controle
 * natif ne se met pas en forme — Chrome, Safari et Firefox rendent trois choses
 * differentes, et aucune ne ressemble aux boutons du produit. Le motif est donc :
 * l'input reste dans le document pour que le navigateur ouvre son selecteur et que
 * la validation reste native, et un `<button>` visible le declenche.
 *
 * `sr-only` ET NON `display: none`. Un input masque par `display:none` sort du
 * parcours au clavier, et le libelle qui le decrit devient inaccessible : un
 * lecteur d'ecran n'annonce plus rien. `sr-only` le garde dans l'arbre
 * d'accessibilite.
 *
 * L'API REFUSE LE SVG et borne poids et dimensions. Le front n'en refait pas la
 * verification : deux jeux de regles divergent toujours, et c'est celle du serveur
 * qui compte. Il annonce simplement ce qui est accepte, et affiche le refus tel
 * quel.
 *
 * `accept` N'EST PAS UNE SECURITE — c'est un filtre du selecteur de fichiers, que
 * l'utilisateur peut contourner en une ligne. Il est la pour le confort ; la regle
 * est cote serveur.
 */
export interface TeleverseurDeLogoProps {
  entreprise: Entreprise
}

export function TeleverseurDeLogo({ entreprise }: TeleverseurDeLogoProps) {
  const champ = useRef<HTMLInputElement>(null)
  const [confirmeRetrait, setConfirmeRetrait] = useState(false)

  const televersement = useTeleverserLogo(entreprise.id)
  const retrait = useRetirerLogo(entreprise.id)

  const enCours = televersement.isPending || retrait.isPending
  const echec = televersement.error ?? retrait.error

  return (
    <div className="flex flex-wrap items-start gap-4">
      <LogoEntreprise url={entreprise.logo_url} nom={entreprise.name} />

      <div className="min-w-0 flex-1">
        <h2 className="text-navy text-[1.05rem]">Logo</h2>
        <p className="text-slate mt-1">
          JPEG, PNG ou WebP. 2 Mo au plus, 4000 pixels de côté au plus.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Bouton
            taille="sm"
            disabled={enCours}
            aria-busy={televersement.isPending}
            onClick={() => {
              champ.current?.click()
            }}
          >
            {televersement.isPending
              ? 'Envoi…'
              : entreprise.logo_url == null
                ? 'Choisir un logo'
                : 'Remplacer'}
          </Bouton>

          {entreprise.logo_url != null &&
            (confirmeRetrait ? (
              <>
                <Bouton
                  variante="destructif"
                  taille="sm"
                  disabled={enCours}
                  aria-busy={retrait.isPending}
                  onClick={() => {
                    retrait.mutate(undefined, {
                      onSuccess: () => {
                        setConfirmeRetrait(false)
                      },
                    })
                  }}
                >
                  {retrait.isPending ? 'Retrait…' : 'Confirmer le retrait'}
                </Bouton>
                <Bouton
                  variante="neutre"
                  taille="sm"
                  onClick={() => {
                    setConfirmeRetrait(false)
                  }}
                >
                  Annuler
                </Bouton>
              </>
            ) : (
              <Bouton
                variante="neutre"
                taille="sm"
                disabled={enCours}
                onClick={() => {
                  setConfirmeRetrait(true)
                }}
              >
                Retirer
              </Bouton>
            ))}
        </div>

        {/* Le message de l'API, mot pour mot. Il nomme la cause — « le logo doit
            être une image JPEG, PNG ou WebP », « ne peut pas dépasser 2 Mo » — et la
            reecrire ferait perdre cette precision. */}
        {echec != null && (
          <div className="mt-3">
            <Alerte ton="erreur">{messageDErreur(echec)}</Alerte>
          </div>
        )}

        <label className="sr-only" htmlFor="logo-entreprise">
          Fichier du logo
        </label>
        <input
          ref={champ}
          id="logo-entreprise"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(evenement) => {
            const fichier = evenement.target.files?.[0]
            if (fichier === undefined) return

            televersement.mutate(fichier)

            // LE CHAMP EST VIDE APRES COUP, et c'est indispensable : sans cela,
            // choisir deux fois de suite LE MEME fichier ne declenche pas de second
            // `change` — le navigateur ne voit pas de changement de valeur — et
            // l'utilisateur croit que le bouton ne marche plus.
            evenement.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
