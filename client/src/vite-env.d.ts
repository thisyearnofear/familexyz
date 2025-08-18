/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_SERVER_PORT?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_API_RETRY_ATTEMPTS?: string
  
  // App Configuration
  readonly VITE_APP_VERSION?: string
  readonly VITE_APP_NAME?: string
  
  // Debug Configuration
  readonly VITE_DEBUG?: string
  readonly VITE_LOG_LEVEL?: string
  
  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_ENABLE_ERROR_REPORTING?: string
  
  // Cache Configuration
  readonly VITE_CACHE_TIME?: string
  readonly VITE_STALE_TIME?: string
  
  // Security
  readonly VITE_TRUST_PROXY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
