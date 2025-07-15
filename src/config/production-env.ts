/**
 * Production Environment Configuration
 * Handles proper API URL detection for production deployment
 */

// Define the correct production API URL - always point to the backend
export const PRODUCTION_API_URL = "https://cleancarepro-95it.onrender.com/api";

export const getProductionApiUrl = (): string => {
  // Check if we're in production based on hostname
  const hostname = window.location.hostname;
  const isProduction =
    !hostname.includes("localhost") && !hostname.includes("127.0.0.1");

  console.log("🔍 API URL Detection:", {
    hostname,
    isProduction,
    currentUrl: window.location.href,
    apiUrl: isProduction ? PRODUCTION_API_URL : "http://localhost:3001/api",
  });

  if (isProduction) {
    console.log(
      "🚀 Production environment detected, using:",
      PRODUCTION_API_URL,
    );
    return PRODUCTION_API_URL;
  }

  return "http://localhost:3001/api";
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
