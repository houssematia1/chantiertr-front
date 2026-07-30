import { useDeconnexion, useSession } from '@/api/auth'
import { Bouton } from '@/components/ui/Bouton'
import { Marque } from '@/components/ui/Marque'

/**
 * Le profil du compte connecte.
 *
 * ECRAN PROVISOIRE, et il est utile de le dire : la tache 1 doit prouver que
 * `GET /me` remonte, que la garde de route tient et que la deconnexion ferme la
 * session. C'est tout ce que cet ecran fait. Le lot 2 le remplacera par
 * `AppLayout` — barre laterale filtree par role, bandeau d'impersonation, menu
 * utilisateur en pied.
 *
 * Il est neanmoins ecrit a la densite du produit et non en carte vide au centre
 * de l'ecran : contenu a 30 px du bord (16013), titre a 25 px (16030), panneau
 * a 17 px sur 22 px (16097), tuiles cle/valeur a 13 px sur 15 px (16103).
 */
export function Profil() {
  const session = useSession()
  const deconnexion = useDeconnexion()

  const utilisateur = session.data
  if (utilisateur == null) return null

  const initiales = `${utilisateur.prenom.charAt(0)}${utilisateur.nom.charAt(0)}`.toUpperCase()

  return (
    // 16013 : `.content { padding:30px; max-width:1320px }`
    <div className="min-h-screen">
      {/* 16007 : la barre haute fait 64 px et 30 px de rembourrage lateral. */}
      <header className="flex h-64 items-center justify-between border-b border-line bg-white px-30">
        <Marque echelle="barre" />

        <div className="text-navy-soft flex items-center gap-10 text-13">
          {/* 16012 : pastille de 32 px, vert clair sur vert fonce. */}
          <span className="bg-green-l text-green-d grid size-32 place-items-center rounded-full text-12 font-bold">
            {initiales}
          </span>
          <span>
            {utilisateur.prenom} {utilisateur.nom}
          </span>
          <Bouton
            variante="ghost"
            taille="sm"
            onClick={() => {
              deconnexion.mutate()
            }}
            disabled={deconnexion.isPending}
          >
            {deconnexion.isPending ? 'Déconnexion…' : 'Se déconnecter'}
          </Bouton>
        </div>
      </header>

      <div className="max-w-[1320px] p-30">
        {/* 16029-16031 : titre a 25 px, sous-titre a 13,5 px, 24 px sous le bloc. */}
        <div className="mb-24">
          <h1 className="text-25">Mon compte</h1>
          <p className="text-slate mt-5 text-13.5">
            Écran provisoire du socle — le shell complet arrive au lot suivant.
          </p>
        </div>

        {/* 16096 : `.panel` */}
        <section className="mb-20 overflow-hidden rounded-14 border border-line bg-white shadow-card">
          {/* 16097-16099 */}
          <div className="flex flex-wrap items-center justify-between gap-12 border-b border-line px-22 py-17">
            <div>
              <h2 className="text-15.5">Identité</h2>
              <p className="text-slate mt-2 text-12 font-normal">
                Servie par <code>GET /api/v1/me</code>, session portée par cookie.
              </p>
            </div>
          </div>

          {/* 16100 : `.panel .pc { padding:22px }` */}
          <div className="p-22">
            {/* 16102 : `.params` — colonnes de 190 px minimum, gouttiere de 16 px. */}
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-16">
              <Parametre cle="Prénom" valeur={utilisateur.prenom} />
              <Parametre cle="Nom" valeur={utilisateur.nom} />
              <Parametre cle="E-mail" valeur={utilisateur.email} />
              <Parametre cle="Téléphone" valeur={utilisateur.tel} />
              <Parametre cle="Poste" valeur={utilisateur.poste} />
              <Parametre cle="Rôle" valeur={utilisateur.role_label} accentue />
              <Parametre cle="Statut" valeur={utilisateur.statut_label} />
              <Parametre cle="Entreprise" valeur={utilisateur.company_name ?? null} />
            </dl>
          </div>
        </section>
      </div>
    </div>
  )
}

/**
 * Tuile cle/valeur, relevee lignes 16103 a 16108.
 *
 * `accentue` reprend `.param.hl` (16107) : fond vert clair, bordure verte,
 * valeur en vert fonce.
 */
function Parametre({
  cle,
  valeur,
  accentue = false,
}: {
  cle: string
  valeur: string | null
  accentue?: boolean
}) {
  return (
    <div
      className={[
        'rounded-11 border px-15 py-13',
        accentue ? 'bg-green-l border-green-line' : 'bg-bg border-line',
      ].join(' ')}
    >
      <dt className="text-slate mb-7 text-11.5 font-semibold">{cle}</dt>
      <dd
        className={[
          'text-18 font-bold break-words',
          valeur == null ? 'text-slate font-normal' : accentue ? 'text-green-d' : 'text-navy',
        ].join(' ')}
      >
        {valeur ?? '—'}
      </dd>
    </div>
  )
}
