// Production configuration settings
// This file contains all production-specific configurations
import { config } from "./env";

export const PRODUCTION_CONFIG = {
  // Environment
  NODE_ENV: config.NODE_ENV,
  IS_PRODUCTION: config.IS_PRODUCTION,

  // API Configuration - Must be set in environment variables
  API_BASE_URL: config.API_BASE_URL,

  // Authentication
  AUTH_TOKEN_KEY: "laundrify_token",
  USER_DATA_KEY: "laundrify_user",

  // Google Services
  GOOGLE_MAPS_API_KEY: config.GOOGLE_MAPS_API_KEY,

  // SMS Service - API key handled by backend only

  // App Settings
  APP_NAME: "Laundrify",
  APP_VERSION: "1.0.0",

  // Feature Flags
  FEATURES: {
    PUSH_NOTIFICATIONS: true,
    GEOLOCATION: true,
    OFFLINE_MODE: false, // Can be enabled for PWA
    VOICE_SEARCH: false, // Future feature
    CHAT_SUPPORT: false, // Future feature
  },

  // Cache Settings
  CACHE: {
    USER_DATA_TTL: 24 * 60 * 60 * 1000, // 24 hours
    API_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    OFFLINE_DATA_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Performance Settings
  PERFORMANCE: {
    IMAGE_LAZY_LOADING: true,
    VIRTUAL_SCROLLING: false, // For large lists
    DEBOUNCE_SEARCH: 300, // ms
    API_TIMEOUT: 30000, // 30 seconds
    // iOS mobile data compatibility
    IOS_NETWORK_TIMEOUT: 30000, // 30 seconds for iOS mobile networks
    IOS_RETRY_ATTEMPTS: 3,
    IOS_RETRY_DELAY: 2000, // 2 seconds between retries
    CONNECTION_TIMEOUT: 15000, // 15 seconds connection timeout
  },

  // Security Settings
  SECURITY: {
    SESSION_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // 30 days - extended for better UX
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  },
};

// Helper functions
export const isProduction = () => PRODUCTION_CONFIG.IS_PRODUCTION;

export const getApiUrl = (endpoint: string) => {
  const baseUrl = PRODUCTION_CONFIG.API_BASE_URL.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  return `${baseUrl}/${cleanEndpoint}`;
};

export const isFeatureEnabled = (
  feature: keyof typeof PRODUCTION_CONFIG.FEATURES,
) => {
  return PRODUCTION_CONFIG.FEATURES[feature];
};

export const getStorageKey = (key: "token" | "user") => {
  const keyMap = {
    token: PRODUCTION_CONFIG.AUTH_TOKEN_KEY,
    user: PRODUCTION_CONFIG.USER_DATA_KEY,
  };
  return keyMap[key];
};

// Environment validation
export const validateEnvironment = () => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Required environment variables
  if (!PRODUCTION_CONFIG.GOOGLE_MAPS_API_KEY) {
    warnings.push("Google Maps API key not configured");
  }

  // DVHosting API key validation removed - handled by backend

  if (!PRODUCTION_CONFIG.API_BASE_URL) {
    errors.push("API base URL is required");
  }

  return { warnings, errors };
};

// Cache management
export const CacheManager = {
  set: (key: string, data: any, ttl?: number) => {
    const expiresAt =
      Date.now() + (ttl || PRODUCTION_CONFIG.CACHE.API_CACHE_TTL);
    const cacheData = { data, expiresAt };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
  },

  get: (key: string) => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data, expiresAt } = JSON.parse(cached);
      if (Date.now() > expiresAt) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  },

  clear: (key?: string) => {
    if (key) {
      localStorage.removeItem(`cache_${key}`);
    } else {
      // Clear all cache items
      Object.keys(localStorage)
        .filter((k) => k.startsWith("cache_"))
        .forEach((k) => localStorage.removeItem(k));
    }
  },
};

// Error tracking (for production monitoring)
export const ErrorTracker = {
  logError: (error: Error, context?: any) => {
    console.error("Production Error:", error, context);

    // In production, you might want to send to a service like Sentry
    if (isProduction()) {
      // Example: Send to error tracking service
      // Sentry.captureException(error, { extra: context });
    }
  },

  logWarning: (message: string, context?: any) => {
    console.warn("Production Warning:", message, context);
  },

  logInfo: (message: string, context?: any) => {
    if (!isProduction()) {
      console.info("Info:", message, context);
    }
  },
};

export default PRODUCTION_CONFIG;
