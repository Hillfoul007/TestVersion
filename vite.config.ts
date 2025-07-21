import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isPWAEnabled = process.env.ENABLE_PWA !== "false";

  // Dynamically import PWA plugin
  let VitePWA;
  if (isPWAEnabled) {
    try {
      VitePWA = require("vite-plugin-pwa").VitePWA;
    } catch (e) {
      console.warn("vite-plugin-pwa not available, PWA features disabled");
    }
  }
  return {
    server: {
      host: "::",
      port: 10000,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
            build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
                output: {
          // Simplified chunking strategy for memory efficiency
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slot'],
          },
        },
        // Minimize parallel operations to reduce memory usage
        maxParallelFileOps: 1,
      },
      // Use esbuild instead of terser for lower memory usage
      minify: mode === "production" ? "esbuild" : false,
      // Disable CSS code splitting to reduce memory usage
      cssCodeSplit: false,
      // Disable sourcemap to save memory
      sourcemap: false,
      // Disable reporting to save memory
      reportCompressedSize: false,
      // Reduce target to minimize polyfills
      target: 'esnext',
    },
    // Enable gzip compression for assets
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
    plugins: [
      react({
        // Enable React Fast Refresh for better dev experience
        fastRefresh: true,
      }),
      // Conditionally add PWA plugin
      ...(VitePWA
        ? [
            VitePWA({
              registerType: "autoUpdate", // 🚨 Key for automatic updates
              includeAssets: [
                "favicon.ico",
                "apple-touch-icon.png",
                "masked-icon.svg",
              ],
              manifest: {
                name: "CleanCare Pro - Laundry Services",
                short_name: "CleanCare Pro",
                description: "Professional laundry and dry cleaning services",
                start_url: "/",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#22c55e",
                icons: [
                  {
                    src: "placeholder.svg",
                    sizes: "192x192",
                    type: "image/svg+xml",
                  },
                  {
                    src: "placeholder.svg",
                    sizes: "512x512",
                    type: "image/svg+xml",
                  },
                ],
              },
              workbox: {
                cleanupOutdatedCaches: true, // 🚨 Remove old caches
                clientsClaim: true, // 🚨 Take control immediately
                skipWaiting: true, // 🚨 Activate new SW immediately
                runtimeCaching: [
                  {
                    urlPattern: /^https:\/\/cdn\.builder\.io\/.*/i,
                    handler: "CacheFirst",
                    options: {
                      cacheName: "images-cache",
                      expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                      },
                    },
                  },
                ],
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
