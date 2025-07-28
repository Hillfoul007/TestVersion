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
 * Setup controlled page reload on service worker updates
 */
export const setupControlledReload = (): void => {
  if ("serviceWorker" in navigator) {
    let reloadScheduled = false;

    // Add event listener for when the service worker updates
    const handleControllerChange = () => {
      // Prevent multiple reloads
      if (reloadScheduled) return;

      reloadScheduled = true;
      console.log("Service worker controller changed, scheduling reload");

      // Small delay to ensure proper cleanup
      setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
  }
};

/**
 * Initialize PWA update handling
 */
export const initializePWAUpdates = (): void => {
  // Only initialize once
  if (window.pwaUpdatesInitialized) {
    console.log("PWA updates already initialized, skipping");
    return;
  }

  // Clean up any old service workers on app start
  cleanupOldServiceWorkers();

  // Set up controlled reload handling
  setupControlledReload();

  // Mark as initialized
  window.pwaUpdatesInitialized = true;
  console.log("PWA updates initialized");
};
