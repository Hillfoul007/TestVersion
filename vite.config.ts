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
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@radix-ui')) {
                return 'radix-ui';
              }
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              return 'vendor';
            }
          },
        },
        // Reduce memory usage during build
        maxParallelFileOps: 2,
      },
      // Reduce memory usage
      minify: mode === "production" ? "terser" : false,
      terserOptions: mode === "production" ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          safari10: true,
        },
        format: {
          safari10: true,
        },
      } : {},
      // Disable CSS code splitting to reduce memory usage
      cssCodeSplit: false,
      // Disable sourcemap in production to save memory
      sourcemap: false,
      // Reduce memory usage
      reportCompressedSize: false,
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
