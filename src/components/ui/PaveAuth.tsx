import type { ReactNode } from 'react'

import { Marque } from '@/components/ui/Marque'

/**
 * Le pave des trois ecrans sans session : connexion, mot de passe oublie,
 * choix du mot de passe.
 *
 * Il existe parce que les trois portent exactement le meme chrome — marque,
 * titre, sous-titre, filet, rayon 6 px — et que le repeter trois fois est le
 * chemin le plus court vers trois variantes qui divergent.
 *
 * AUCUNE OMBRE. MASTER § 6 : « les filets separent ; l'elevation est reservee
 * aux vrais calques : modales, popovers. » Un pave de connexion n'est pas un
 * calque : il est le contenu de la page. Un filet de 1 px, et rien de plus.
 *
 * 360 px de large. Assez pour un champ confortable, pas assez pour que la ligne
 * de saisie devienne un ruban.
 *
 * MOUVEMENT. C'est l'un des deux seuls endroits du lot ou une animation est
 * justifiee : MASTER § 5 classe « premiere connexion » et « acceptation
 * d'invitation » dans le rare, qui « peut avoir du soin ». L'entree part de
 * `scale(0.98)` et `opacity: 0` — jamais de `scale(0)`, rien n'apparait de rien
 * — sur 200 ms en `ease-out`, et seules `transform` et `opacity` bougent. Sous
 * `prefers-reduced-motion`, l'echelle et le deplacement tombent ; le fondu reste.
 */
export interface PaveAuthProps {
  titre: string
  /** Une phrase, pas un paragraphe : elle dit ce que l'ecran attend. */
  sousTitre: string
  children: ReactNode
}

export function PaveAuth({ titre, sousTitre, children }: PaveAuthProps) {
  return (
    <div
      className={[
        'bg-card border-line w-full max-w-[360px] rounded-6 border p-6',
        'transition-[opacity,transform] duration-200 ease-out',
        'starting:translate-y-1 starting:scale-[0.98] starting:opacity-0',
        'motion-reduce:starting:translate-y-0 motion-reduce:starting:scale-100',
      ].join(' ')}
    >
      <Marque />

      <h1 className="mt-5 text-20">{titre}</h1>
      <p className="text-slate mt-1 mb-5 text-13">{sousTitre}</p>

      {children}
    </div>
  )
}
