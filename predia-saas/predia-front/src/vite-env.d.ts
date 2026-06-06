/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@fontsource-variable/inter' {
  // Side-effect import — no exports needed
}

declare module '@fontsource/jetbrains-mono' {
  // Side-effect import — no exports needed
}
