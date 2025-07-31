const CACHE_NAME = "laundrify-v4";
const STATIC_CACHE = "laundrify-static-v4";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
];

// Install service worker with iOS mobile data considerations
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing v4...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell");
      // For iOS mobile data, cache with longer timeout
      const cachePromises = urlsToCache.map(url => {
        const fetchOptions = {
          signal: AbortSignal.timeout(30000) // 30 second timeout during install
        };
        return fetch(url, fetchOptions)
          .then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
            console.warn('Failed to cache:', url, response.status);
          })
          .catch(error => {
            console.warn('Error caching:', url, error.message);
          });
      });
      return Promise.allSettled(cachePromises);
    }),
  );
  self.skipWaiting(); // Force the waiting service worker to become active
});

// Activate service worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating v4...");
  event.waitUntil(
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
      // Only claim clients after cleanup is complete and if this is the active worker
      if (self.registration && self.registration.active === self) {
        console.log("Service Worker: Claiming clients...");
        return self.clients.claim();
      } else {
        console.log("Service Worker: Not the active worker, skipping client claim");
      }
    }).catch((error) => {
      console.error("Service Worker: Error during activation:", error);
    })
  );
});

// iOS Mobile Data Detection
const isIOSMobileData = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isMobileData = connection && (connection.type === 'cellular' || connection.effectiveType === '2g' || connection.effectiveType === '3g');
  return isIOS && isMobileData;
};

// Fetch event with iOS mobile data optimizations
self.addEventListener("fetch", (event) => {
  // Skip chrome-extension requests and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // For iOS mobile data, let ALL API requests pass through without caching to avoid timeout issues
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("railway.app") ||
    event.request.url.includes("onrender.com") ||
    event.request.url.includes("localhost:3001") ||
    event.request.url.includes("laundrify") ||
    event.request.method !== "GET" ||
    isIOSMobileData() // Skip service worker for iOS mobile data to prevent timeout conflicts
  ) {
    // Let these requests pass through without any service worker intervention
    if (isIOSMobileData()) {
      console.log('🍎 iOS mobile data detected - bypassing service worker for:', event.request.url);
    }
    return;
  }

  // Handle static assets with caching - but with iOS mobile data timeout handling
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

        // For iOS mobile data, use longer timeout and avoid aggressive caching
        const fetchOptions = isIOSMobileData() ? {
          signal: AbortSignal.timeout(60000) // 60 second timeout for iOS mobile data
        } : {};

        return fetch(event.request, fetchOptions)
          .then((response) => {
            // Cache successful responses for static assets
            if (response.status === 200 && !isIOSMobileData()) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch((error) => {
            if (isIOSMobileData()) {
              console.log('🍎 iOS mobile data asset fetch timeout:', event.request.url);
            }
            return new Response("Asset not available offline", {
              status: 503,
              statusText: "Service Unavailable",
            });
          });
      }),
    );
    return;
  }

  // Handle regular navigation requests with iOS mobile data optimizations
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response && !isIOSMobileData()) {
        return response;
      }

      // For iOS mobile data, always try network first with longer timeout
      const fetchOptions = isIOSMobileData() ? {
        signal: AbortSignal.timeout(60000) // 60 second timeout for iOS mobile data
      } : {};

      return fetch(event.request, fetchOptions)
        .then((networkResponse) => {
          // Cache for non-iOS mobile data users
          if (networkResponse.ok && !isIOSMobileData()) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          if (isIOSMobileData()) {
            console.log('🍎 iOS mobile data navigation timeout:', event.request.url);
          }
          // Fallback to cached version or index.html for SPA routing
          return response || caches.match("/").then((indexResponse) => {
            return (
              indexResponse ||
              new Response("Page not available offline", {
                status: 503,
                statusText: "Service Unavailable",
              })
            );
          });
        });
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
