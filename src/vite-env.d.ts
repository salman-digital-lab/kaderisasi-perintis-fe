/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_API?: string;
  readonly VITE_WEB_API?: string;
  readonly VITE_ADMIN_API?: string;
  readonly VITE_PERINTIS_CLOCK?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
