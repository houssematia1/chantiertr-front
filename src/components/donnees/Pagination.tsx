/**
 * La pagination de liste.
 *
 * DIX PAR PAGE, comme leur `V-FlexPagination`, et COTE FRONT parce que l'API ne
 * pagine pas : `GET /companies` rend la collection entiere. Le jour ou elle
 * paginera, ce composant devra lire ses bornes de la reponse au lieu de decouper
 * un tableau deja complet.
 *
 * ELLE DISPARAIT QUAND IL N'Y A QU'UNE PAGE. Une pagination a un seul bouton est
 * un ornement qui occupe une ligne et n'informe de rien.
 *
 * `aria-current="page"` sur la page courante, et un `<nav>` nomme : sans eux, un
 * lecteur d'ecran annonce sept boutons numerotes sans dire lequel est actif.
 */
export interface PaginationProps {
  page: number
  pages: number
  onChanger: (page: number) => void
}

export function Pagination({ page, pages, onChanger }: PaginationProps) {
  if (pages <= 1) return null

  const numeros = Array.from({ length: pages }, (_, index) => index + 1)

  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-center gap-1.5">
      <Bouton
        libelle="Page précédente"
        desactive={page === 1}
        onClick={() => {
          onChanger(page - 1)
        }}
      >
        ‹
      </Bouton>

      {numeros.map((numero) => (
        <Bouton
          key={numero}
          libelle={`Page ${String(numero)}`}
          courante={numero === page}
          onClick={() => {
            onChanger(numero)
          }}
        >
          {String(numero)}
        </Bouton>
      ))}

      <Bouton
        libelle="Page suivante"
        desactive={page === pages}
        onClick={() => {
          onChanger(page + 1)
        }}
      >
        ›
      </Bouton>
    </nav>
  )
}

function Bouton({
  libelle,
  children,
  courante = false,
  desactive = false,
  onClick,
}: {
  libelle: string
  children: string
  courante?: boolean
  desactive?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      aria-current={courante ? 'page' : undefined}
      disabled={desactive}
      onClick={onClick}
      className={[
        'h-8 min-w-8 rounded-6 border px-2 text-13',
        courante
          ? 'bg-green-strong text-on-green-strong border-green-strong font-medium'
          : 'bg-card text-navy border-line hover:bg-bg',
        'disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
