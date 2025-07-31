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

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip chrome-extension requests and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Don't interfere with API requests at all - let them pass through normally
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("railway.app") ||
    event.request.url.includes("onrender.com") ||
    event.request.url.includes("localhost:3001") ||
    event.request.url.includes("laundrify") ||
    event.request.method !== "GET"
  ) {
    // Let these requests pass through without any service worker intervention
    return;
  }

  // Handle static assets with caching
  if (
    event.request.url.includes("/assets/") ||
    event.request.url.includes("/static/") ||
    event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Cache successful responses for static assets
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return new Response("Asset not available offline", {
              status: 503,
              statusText: "Service Unavailable",
            });
          });
      }),
    );
    return;
  }

  // Handle regular navigation requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // Return cached index.html for SPA routing
          return caches.match("/").then((indexResponse) => {
            return (
              indexResponse ||
              new Response("Page not available offline", {
                status: 503,
                statusText: "Service Unavailable",
              })
            );
          });
        })
      );
    }),
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
