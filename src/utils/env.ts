/**
 * Safe environment variable access utility
 * Handles cases where process.env might not be available or properly defined
 */

export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    // Check if process and process.env exist
    if (typeof process !== 'undefined' && process.env && typeof process.env === 'object') {
      return process.env[key] || defaultValue;
    }
    
    // Fallback: check if the variable is available on window (for debugging)
    if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV[key]) {
      return (window as any).ENV[key];
    }
    
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to access environment variable ${key}:`, error);
    return defaultValue;
  }
};

export const getRequiredEnvVar = (key: string): string => {
  const value = getEnvVar(key);
  if (!value) {
    console.error(`Required environment variable ${key} is not set`);
  }
  return value;
};

// Specific environment variable getters
export const getGoogleMapsApiKey = (): string => {
  return getEnvVar('REACT_APP_GOOGLE_MAPS_API_KEY', '');
};

export const getGoogleMapsMapId = (): string => {
  return getEnvVar('REACT_APP_GOOGLE_MAPS_MAP_ID', '');
};

export const getApiBaseUrl = (): string => {
  return getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:3001/api');
};

export const isDevelopment = (): boolean => {
  return getEnvVar('NODE_ENV') !== 'production';
};

// Log environment status for debugging
if (typeof console !== 'undefined') {
  console.log('🔧 Environment variables loaded:', {
    hasProcessEnv: typeof process !== 'undefined' && !!process.env,
    googleMapsKey: getGoogleMapsApiKey() ? 'Set' : 'Not set',
    apiBaseUrl: getApiBaseUrl(),
    nodeEnv: getEnvVar('NODE_ENV', 'development')
  });
}
