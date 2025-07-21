var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/app/code";
var vite_config_default = defineConfig(({ mode }) => {
  const isPWAEnabled = process.env.ENABLE_PWA !== "false";
  let VitePWA;
  if (isPWAEnabled) {
    try {
      VitePWA = __require("file:///app/code/node_modules/vite-plugin-pwa/dist/index.js").VitePWA;
    } catch (e) {
      console.warn("vite-plugin-pwa not available, PWA features disabled");
    }
  }
  return {
    server: {
      host: "::",
      port: 1e4,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 1e3,
      rollupOptions: {
        output: {
          // Simplified chunking strategy for memory efficiency
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "vendor": ["@radix-ui/react-dialog", "@radix-ui/react-slot"]
          }
        },
        // Minimize parallel operations to reduce memory usage
        maxParallelFileOps: 1
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
      target: "esnext"
    },
    // Enable gzip compression for assets
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : []
    },
    plugins: [
      react({
        // Enable React Fast Refresh for better dev experience
        fastRefresh: true
      }),
      // Conditionally add PWA plugin
      ...VitePWA ? [
        VitePWA({
          registerType: "autoUpdate",
          // 🚨 Key for automatic updates
          includeAssets: [
            "favicon.ico",
            "apple-touch-icon.png",
            "masked-icon.svg"
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
                type: "image/svg+xml"
              },
              {
                src: "placeholder.svg",
                sizes: "512x512",
                type: "image/svg+xml"
              }
            ]
          },
          workbox: {
            cleanupOutdatedCaches: true,
            // 🚨 Remove old caches
            clientsClaim: true,
            // 🚨 Take control immediately
            skipWaiting: true,
            // 🚨 Activate new SW immediately
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/cdn\.builder\.io\/.*/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "images-cache",
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30
                    // 30 days
                  }
                }
              }
            ]
          }
        })
      ] : []
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgaXNQV0FFbmFibGVkID0gcHJvY2Vzcy5lbnYuRU5BQkxFX1BXQSAhPT0gXCJmYWxzZVwiO1xuXG4gIC8vIER5bmFtaWNhbGx5IGltcG9ydCBQV0EgcGx1Z2luXG4gIGxldCBWaXRlUFdBO1xuICBpZiAoaXNQV0FFbmFibGVkKSB7XG4gICAgdHJ5IHtcbiAgICAgIFZpdGVQV0EgPSByZXF1aXJlKFwidml0ZS1wbHVnaW4tcHdhXCIpLlZpdGVQV0E7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKFwidml0ZS1wbHVnaW4tcHdhIG5vdCBhdmFpbGFibGUsIFBXQSBmZWF0dXJlcyBkaXNhYmxlZFwiKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDEwMDAwLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgXCIvYXBpXCI6IHtcbiAgICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCIsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgICAgICAgICBidWlsZDoge1xuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIC8vIFNpbXBsaWZpZWQgY2h1bmtpbmcgc3RyYXRlZ3kgZm9yIG1lbW9yeSBlZmZpY2llbmN5XG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICAgICd2ZW5kb3InOiBbJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLCAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAvLyBNaW5pbWl6ZSBwYXJhbGxlbCBvcGVyYXRpb25zIHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcbiAgICAgICAgbWF4UGFyYWxsZWxGaWxlT3BzOiAxLFxuICAgICAgfSxcbiAgICAgIC8vIFVzZSBlc2J1aWxkIGluc3RlYWQgb2YgdGVyc2VyIGZvciBsb3dlciBtZW1vcnkgdXNhZ2VcbiAgICAgIG1pbmlmeTogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgPyBcImVzYnVpbGRcIiA6IGZhbHNlLFxuICAgICAgLy8gRGlzYWJsZSBDU1MgY29kZSBzcGxpdHRpbmcgdG8gcmVkdWNlIG1lbW9yeSB1c2FnZVxuICAgICAgY3NzQ29kZVNwbGl0OiBmYWxzZSxcbiAgICAgIC8vIERpc2FibGUgc291cmNlbWFwIHRvIHNhdmUgbWVtb3J5XG4gICAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgICAgLy8gRGlzYWJsZSByZXBvcnRpbmcgdG8gc2F2ZSBtZW1vcnlcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgICAgIC8vIFJlZHVjZSB0YXJnZXQgdG8gbWluaW1pemUgcG9seWZpbGxzXG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIH0sXG4gICAgLy8gRW5hYmxlIGd6aXAgY29tcHJlc3Npb24gZm9yIGFzc2V0c1xuICAgIGVzYnVpbGQ6IHtcbiAgICAgIGRyb3A6IG1vZGUgPT09IFwicHJvZHVjdGlvblwiID8gW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdIDogW10sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIC8vIEVuYWJsZSBSZWFjdCBGYXN0IFJlZnJlc2ggZm9yIGJldHRlciBkZXYgZXhwZXJpZW5jZVxuICAgICAgICBmYXN0UmVmcmVzaDogdHJ1ZSxcbiAgICAgIH0pLFxuICAgICAgLy8gQ29uZGl0aW9uYWxseSBhZGQgUFdBIHBsdWdpblxuICAgICAgLi4uKFZpdGVQV0FcbiAgICAgICAgPyBbXG4gICAgICAgICAgICBWaXRlUFdBKHtcbiAgICAgICAgICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIiwgLy8gXHVEODNEXHVERUE4IEtleSBmb3IgYXV0b21hdGljIHVwZGF0ZXNcbiAgICAgICAgICAgICAgaW5jbHVkZUFzc2V0czogW1xuICAgICAgICAgICAgICAgIFwiZmF2aWNvbi5pY29cIixcbiAgICAgICAgICAgICAgICBcImFwcGxlLXRvdWNoLWljb24ucG5nXCIsXG4gICAgICAgICAgICAgICAgXCJtYXNrZWQtaWNvbi5zdmdcIixcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkNsZWFuQ2FyZSBQcm8gLSBMYXVuZHJ5IFNlcnZpY2VzXCIsXG4gICAgICAgICAgICAgICAgc2hvcnRfbmFtZTogXCJDbGVhbkNhcmUgUHJvXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUHJvZmVzc2lvbmFsIGxhdW5kcnkgYW5kIGRyeSBjbGVhbmluZyBzZXJ2aWNlc1wiLFxuICAgICAgICAgICAgICAgIHN0YXJ0X3VybDogXCIvXCIsXG4gICAgICAgICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICAgICAgICAgICAgdGhlbWVfY29sb3I6IFwiIzIyYzU1ZVwiLFxuICAgICAgICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogXCJwbGFjZWhvbGRlci5zdmdcIixcbiAgICAgICAgICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogXCJwbGFjZWhvbGRlci5zdmdcIixcbiAgICAgICAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSwgLy8gXHVEODNEXHVERUE4IFJlbW92ZSBvbGQgY2FjaGVzXG4gICAgICAgICAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLCAvLyBcdUQ4M0RcdURFQTggVGFrZSBjb250cm9sIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgc2tpcFdhaXRpbmc6IHRydWUsIC8vIFx1RDgzRFx1REVBOCBBY3RpdmF0ZSBuZXcgU1cgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICBydW50aW1lQ2FjaGluZzogW1xuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2NkblxcLmJ1aWxkZXJcXC5pb1xcLy4qL2ksXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImltYWdlcy1jYWNoZVwiLFxuICAgICAgICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLCAvLyAzMCBkYXlzXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF1cbiAgICAgICAgOiBbXSksXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7QUFBNk0sU0FBUyxvQkFBb0I7QUFDMU8sT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLGVBQWUsUUFBUSxJQUFJLGVBQWU7QUFHaEQsTUFBSTtBQUNKLE1BQUksY0FBYztBQUNo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
