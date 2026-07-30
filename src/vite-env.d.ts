/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Racine de l'API. Sans elle, `http://localhost:8000` par defaut. */
  readonly VITE_API_URL?: string

  /**
   * Texte de l'encart de bas de pave sur l'ecran de connexion.
   *
   * Vide ou absente en production, ou l'encart disparait. Elle ne sert qu'au
   * poste de developpement, et elle ne doit JAMAIS contenir de mot de passe :
   * le logiciel d'origine en portait un en dur dans sa source, et c'est l'une
   * des raisons pour lesquelles il est reecrit.
   */
  readonly VITE_INDICATION_CONNEXION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
