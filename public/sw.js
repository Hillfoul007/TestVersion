const CACHE_NAME = "laundrify-v5-safari-fix";
const STATIC_CACHE = "laundrify-static-v5-safari-fix";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icons/icon-144x144.svg",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
];

// Install service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing v5 (Safari Fix)...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell");
      return cache.addAll(urlsToCache).catch((error) => {
        console.warn("Service Worker: Failed to cache some resources:", error);
        // Continue anyway to avoid breaking the installation
        return Promise.resolve();
      });
    }),
  );
  self.skipWaiting(); // Force the waiting service worker to become active
});

// Activate service worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating v5 (Safari Fix)...");
  event.waitUntil(
    // Clear all old caches to prevent conflicts
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }).then(() => {
      // Safari-specific: Clear all cached data if it's a new version
      if (self.registration && self.registration.active === self) {
        console.log("Service Worker: Claiming clients...");
        return self.clients.claim();
      }
    }).then(() => {
      // Notify all clients about the cache update
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'CACHE_UPDATED',
            version: 'v5-safari-fix'
          });
        });
      });
    }).catch((error) => {
      console.error("Service Worker: Error during activation:", error);
    })
  );
});

// Fetch event - Enhanced for Safari cache management
self.addEventListener("fetch", (event) => {
  // Skip chrome-extension and non-HTTP requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Safari-specific: Force fresh requests for API calls to prevent cache issues
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("railway.app/api") ||
    event.request.url.includes("onrender.com/api") ||
    event.request.url.includes("localhost:3001") ||
    event.request.method !== "GET"
  ) {
    // For Safari: Always bypass cache for API requests
    event.respondWith(
      fetch(event.request, {
        cache: 'no-cache',
        headers: {
          ...event.request.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }).catch((error) => {
        console.error('API fetch failed:', error);
        return new Response(JSON.stringify({
          error: 'Network request failed',
          message: 'Please check your connection and try again'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Handle static assets with careful caching
  if (
    event.request.url.includes("/assets/") ||
    event.request.url.includes("/static/") ||
    event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'default' })
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response("Asset not available", {
              status: 404,
              statusText: "Not Found",
            });
          });
        })
    );
    return;
  }

  // Handle navigation requests with Safari-specific fallbacks
  event.respondWith(
    fetch(event.request, {
      cache: 'default',
      credentials: 'same-origin'
    })
      .then((response) => {
        // Cache successful HTML responses
        if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to index.html for SPA routing
        return caches.match("/").then((indexResponse) => {
          if (indexResponse) {
            return indexResponse;
          }
          // If no cached index, return a basic fallback
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Laundrify</title>
              </head>
              <body>
                <div id="root">
                  <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                    <div style="text-align: center;">
                      <h1>Laundrify</h1>
                      <p>Loading... Please refresh if this takes too long.</p>
                    </div>
                  </div>
                </div>
                <script>
                  setTimeout(() => {
                    window.location.reload();
                  }, 3000);
                </script>
              </body>
            </html>
          `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
        });
      })
  );
});

// Push event handler
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  const options = {
    body: event.data
      ? event.data.text()
      : "New notification from Laundrify",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "view",
        title: "View Details",
        icon: "/icons/icon-72x72.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/icon-72x72.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Laundrify", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received.");

  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync tasks
  return Promise.resolve();
}
