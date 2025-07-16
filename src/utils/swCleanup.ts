/**
 * Clean up old service workers that might be causing caching issues
 */
export const cleanupOldServiceWorkers = async (): Promise<void> => {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      console.log(`Found ${registrations.length} service worker registrations`);

      for (const registration of registrations) {
        // Only unregister if it's not the current PWA service worker
        if (
          registration.scope.includes("/sw.js") ||
          registration.scope.includes("/service-worker.js") ||
          !registration.scope.includes("workbox")
        ) {
          console.log(
            `Unregistering old service worker: ${registration.scope}`,
          );
          await registration.unregister();
        }
      }
    } catch (error) {
      console.warn("Error cleaning up service workers:", error);
    }
  }
};

/**
 * Force reload the page to get the latest version
 */
export const forcePageReload = (): void => {
  if ("serviceWorker" in navigator) {
    // Add event listener for when the service worker updates
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Service worker controller changed, reloading page");
      window.location.reload();
    });
  }
};

/**
 * Initialize PWA update handling
 */
export const initializePWAUpdates = (): void => {
  // Clean up any old service workers on app start
  cleanupOldServiceWorkers();

  // Set up force reload handling
  forcePageReload();

  console.log("PWA updates initialized");
};
