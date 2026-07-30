import { useId } from 'react'

/**
 * Une liste deroulante, avec son libelle visible.
 *
 * ELLE EXISTE POUR LA MEME RAISON QUE `Champ` : MASTER § 7 exige un libelle
 * visible sur chaque controle, et le type le rend obligatoire — un selecteur sans
 * libelle ne compile pas.
 *
 * `appearance-none` PLUS UN CHEVRON DESSINE : le chevron natif differe entre
 * Chrome, Safari et Firefox, et sur macOS il impose un fond gris que le reste de
 * la barre de filtres n'a pas. Le dessiner est le seul moyen d'avoir la meme
 * hauteur et le meme filet que le champ de recherche a cote.
 *
 * `pointer-events-none` sur le chevron : sans lui, cliquer dessus ne deroule pas.
 */
export interface OptionDeSelecteur {
  valeur: string
  libelle: string
}

export interface SelecteurProps {
  libelle: string
  value: string
  options: readonly OptionDeSelecteur[]
  onChange: (valeur: string) => void
}

export function Selecteur({ libelle, value, options, onChange }: SelecteurProps) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="text-navy mb-1 block text-13 font-medium">
        {libelle}
      </label>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(evenement) => {
            onChange(evenement.target.value)
          }}
          className="text-navy bg-card border-line-champ hover:border-slate focus:border-green-strong h-9.5 w-full appearance-none rounded-8 border-[1.5px] pr-9 pl-3 text-corps transition-[border-color] duration-150 ease-out"
        >
          {options.map((option) => (
            <option key={option.valeur} value={option.valeur}>
              {option.libelle}
            </option>
          ))}
        </select>

        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="text-slate pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>
    </div>
  )
}
