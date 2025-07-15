/**
 * Centralized environment configuration for API URLs
 * This ensures consistent API URL handling across the entire application
 */

import { getProductionApiUrl, shouldUseBackend } from "./production-env";

export const getApiBaseUrl = (): string => {
  // First, check for explicit environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  if (envUrl && envUrl !== "") {
    console.log("🔧 Using environment variable API URL:", envUrl);
    return envUrl;
  }

  // Use production configuration logic
  const apiUrl = getProductionApiUrl();

  // Check if backend should be disabled for certain environments
  if (!shouldUseBackend()) {
    console.log("🌐 Backend disabled for this environment");
    return ""; // Empty string indicates no backend available
  }

  return apiUrl;
};

export const isBackendAvailable = (): boolean => {
  return getApiBaseUrl() !== "";
};

export const config = {
  apiBaseUrl: getApiBaseUrl(),
  isProduction: window.location.hostname !== "localhost",
  isBackendAvailable: isBackendAvailable(),

  // Auth token storage key
  authTokenKey: "cleancare_auth_token",

  // User storage key
  userStorageKey: "current_user",

  // Booking storage key
  bookingStorageKey: "user_bookings",
};

// Log configuration on startup
console.log("🔧 Environment Configuration:", {
  hostname: window.location.hostname,
  apiBaseUrl: config.apiBaseUrl,
  isProduction: config.isProduction,
  isBackendAvailable: config.isBackendAvailable,
});
