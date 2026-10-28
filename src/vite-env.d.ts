/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_API?: string;
  readonly VITE_WEB_API?: string;
  readonly VITE_ADMIN_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
