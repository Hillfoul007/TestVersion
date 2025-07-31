/**
 * Centralized environment configuration
 * All URLs and API endpoints should be configured here
 */

interface EnvironmentConfig {
  // Backend/API URLs
  API_BASE_URL: string;
  BACKEND_URL: string;
  FRONTEND_URL: string;
  
  // External Services
  GOOGLE_MAPS_API_KEY: string;
  NOMINATIM_API_URL: string;
  BIGDATA_CLOUD_API_URL: string;
  GUPSHUP_API_URL: string;
  
  // Social/Sharing URLs
  WHATSAPP_BASE_URL: string;
  TWITTER_SHARE_URL: string;
  FACEBOOK_SHARE_URL: string;
  TELEGRAM_SHARE_URL: string;
  
  // CDN/Assets
  LAUNDRIFY_LOGO_URL: string;
  CDN_BASE_URL: string;
  
  // App Configuration
  APP_NAME: string;
  APP_URL: string;
  IS_PRODUCTION: boolean;
  NODE_ENV: string;
}

// Create configuration from environment variables
const createConfig = (): EnvironmentConfig => {
  const isProduction = import.meta.env.VITE_NODE_ENV === 'production' || 
                      !window.location.hostname.includes('localhost');

  return {
    // Backend/API URLs - Must be configured in environment
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '',
    FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || window.location.origin,
    
    // External Services
    GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    NOMINATIM_API_URL: import.meta.env.VITE_NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org',
    BIGDATA_CLOUD_API_URL: import.meta.env.VITE_BIGDATA_CLOUD_API_URL || 'https://api.bigdatacloud.net',
    GUPSHUP_API_URL: import.meta.env.VITE_GUPSHUP_API_URL || 'https://api.gupshup.io/wa/api/v1/msg',
    
    // Social/Sharing URLs
    WHATSAPP_BASE_URL: import.meta.env.VITE_WHATSAPP_BASE_URL || 'https://wa.me/',
    TWITTER_SHARE_URL: import.meta.env.VITE_TWITTER_SHARE_URL || 'https://twitter.com/intent/tweet',
    FACEBOOK_SHARE_URL: import.meta.env.VITE_FACEBOOK_SHARE_URL || 'https://www.facebook.com/sharer/sharer.php',
    TELEGRAM_SHARE_URL: import.meta.env.VITE_TELEGRAM_SHARE_URL || 'https://t.me/share/url',
    
    // CDN/Assets
    LAUNDRIFY_LOGO_URL: import.meta.env.VITE_LAUNDRIFY_LOGO_URL || '/placeholder.svg',
    CDN_BASE_URL: import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.builder.io',
    
    // App Configuration
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Laundrify',
    APP_URL: import.meta.env.VITE_APP_URL || window.location.origin,
    IS_PRODUCTION: isProduction,
    NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  };
};

// Export the configuration
export const config = createConfig();

// Export individual configurations for backward compatibility
export const apiBaseUrl = config.API_BASE_URL;
export const backendUrl = config.BACKEND_URL;
export const frontendUrl = config.FRONTEND_URL;

// Validation function to ensure required environment variables are set
export const validateEnvironment = (): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  if (!config.API_BASE_URL) {
    errors.push('VITE_API_BASE_URL is required but not set');
  }
  
  if (!config.GOOGLE_MAPS_API_KEY) {
    warnings.push('VITE_GOOGLE_MAPS_API_KEY is not set - Maps functionality may not work');
  }

  // Development-specific warnings
  if (!config.IS_PRODUCTION) {
    if (!config.BACKEND_URL) {
      warnings.push('VITE_BACKEND_URL is not set - using API_BASE_URL fallback');
    }
  }

  return { errors, warnings };
};

// Environment validation on load
const { errors, warnings } = validateEnvironment();

if (errors.length > 0) {
  console.error('❌ Environment Configuration Errors:', errors);
}

if (warnings.length > 0) {
  console.warn('⚠️ Environment Configuration Warnings:', warnings);
}

console.log('🔧 Environment Configuration Loaded:', {
  API_BASE_URL: config.API_BASE_URL || 'NOT SET',
  BACKEND_URL: config.BACKEND_URL || 'NOT SET',
  IS_PRODUCTION: config.IS_PRODUCTION,
  NODE_ENV: config.NODE_ENV,
});

// Helper functions for backward compatibility and convenience
export const getApiBaseUrl = (): string => config.API_BASE_URL;
export const isBackendAvailable = (): boolean => !!config.API_BASE_URL;

export default config;
