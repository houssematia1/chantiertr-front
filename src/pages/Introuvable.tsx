import { EnteteEcran } from '@/components/shell/EnteteEcran'

/**
 * Adresse inconnue.
 *
 * Elle est rendue DANS le shell et non a la place : quelqu'un qui suit un lien
 * perime doit pouvoir repartir par la barre laterale, pas se retrouver devant une
 * page nue avec un bouton « retour ».
 *
 * Aucun code 404 n'est affiche. C'est une application, pas un site : le chiffre ne
 * dit rien a un conducteur de travaux, et le texte dit tout.
 *
 * Ce composant vit dans son propre fichier et non dans le routeur : un module qui
 * exporte a la fois des composants et autre chose casse le rafraichissement a
 * chaud de Vite, et la regle `react-refresh/only-export-components` le refuse.
 */
export function Introuvable() {
  return (
    <>
      <EnteteEcran titre="Page introuvable" />

      <div className="p-3">
        <div className="bg-card border-line max-w-[560px] rounded-6 border p-4">
          <p className="text-navy text-14">Cette adresse ne correspond à aucun écran.</p>
          <p className="text-slate mt-2 text-13">
            Le lien est peut-être périmé. Choisissez une entrée dans le menu de gauche.
          </p>
        </div>
      </div>
    </>
  )
}
