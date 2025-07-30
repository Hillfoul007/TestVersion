/**
 * Production Environment Configuration
 * All URLs must now be configured via environment variables for security
 */

import { config } from "./env";

export const getProductionApiUrl = (): string => {
  if (!config.API_BASE_URL) {
    console.error("❌ VITE_API_BASE_URL environment variable is required but not set");
    throw new Error("API_BASE_URL must be configured in environment variables");
  }

  console.log("🔍 API URL from Environment:", {
    hostname: window.location.hostname,
    apiUrl: config.API_BASE_URL,
    isProduction: config.IS_PRODUCTION,
  });

  return config.API_BASE_URL;
};

// Export a flag to check if backend should be used
export const shouldUseBackend = (): boolean => {
  const hostname = window.location.hostname;

  // Disable backend for certain hosted environments
  if (hostname.includes("fly.dev")) {
    return false;
  }

  return true;
};
