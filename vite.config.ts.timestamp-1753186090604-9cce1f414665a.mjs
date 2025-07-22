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
            name: "Laundrify - Quick clean & convenient",
            short_name: "Laundrify",
            description: "Quick clean & convenient thats laundrify",
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#C46DD8",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgaXNQV0FFbmFibGVkID0gcHJvY2Vzcy5lbnYuRU5BQkxFX1BXQSAhPT0gXCJmYWxzZVwiO1xuXG4gIC8vIER5bmFtaWNhbGx5IGltcG9ydCBQV0EgcGx1Z2luXG4gIGxldCBWaXRlUFdBO1xuICBpZiAoaXNQV0FFbmFibGVkKSB7XG4gICAgdHJ5IHtcbiAgICAgIFZpdGVQV0EgPSByZXF1aXJlKFwidml0ZS1wbHVnaW4tcHdhXCIpLlZpdGVQV0E7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKFwidml0ZS1wbHVnaW4tcHdhIG5vdCBhdmFpbGFibGUsIFBXQSBmZWF0dXJlcyBkaXNhYmxlZFwiKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDEwMDAwLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgXCIvYXBpXCI6IHtcbiAgICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCIsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgICAgICAgICBidWlsZDoge1xuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAvLyBNaW5pbWl6ZSBwYXJhbGxlbCBvcGVyYXRpb25zIHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcbiAgICAgICAgbWF4UGFyYWxsZWxGaWxlT3BzOiAxLFxuICAgICAgfSxcbiAgICAgIC8vIFVzZSBlc2J1aWxkIGluc3RlYWQgb2YgdGVyc2VyIGZvciBsb3dlciBtZW1vcnkgdXNhZ2VcbiAgICAgIG1pbmlmeTogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgPyBcImVzYnVpbGRcIiA6IGZhbHNlLFxuICAgICAgLy8gRGlzYWJsZSBDU1MgY29kZSBzcGxpdHRpbmcgdG8gcmVkdWNlIG1lbW9yeSB1c2FnZVxuICAgICAgY3NzQ29kZVNwbGl0OiBmYWxzZSxcbiAgICAgIC8vIERpc2FibGUgc291cmNlbWFwIHRvIHNhdmUgbWVtb3J5XG4gICAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgICAgLy8gRGlzYWJsZSByZXBvcnRpbmcgdG8gc2F2ZSBtZW1vcnlcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgICAgIC8vIFJlZHVjZSB0YXJnZXQgdG8gbWluaW1pemUgcG9seWZpbGxzXG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIH0sXG4gICAgLy8gRW5hYmxlIGd6aXAgY29tcHJlc3Npb24gZm9yIGFzc2V0c1xuICAgIGVzYnVpbGQ6IHtcbiAgICAgIGRyb3A6IG1vZGUgPT09IFwicHJvZHVjdGlvblwiID8gW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdIDogW10sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIC8vIEVuYWJsZSBSZWFjdCBGYXN0IFJlZnJlc2ggZm9yIGJldHRlciBkZXYgZXhwZXJpZW5jZVxuICAgICAgICBmYXN0UmVmcmVzaDogdHJ1ZSxcbiAgICAgIH0pLFxuICAgICAgLy8gQ29uZGl0aW9uYWxseSBhZGQgUFdBIHBsdWdpblxuICAgICAgLi4uKFZpdGVQV0FcbiAgICAgICAgPyBbXG4gICAgICAgICAgICBWaXRlUFdBKHtcbiAgICAgICAgICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIiwgLy8gXHVEODNEXHVERUE4IEtleSBmb3IgYXV0b21hdGljIHVwZGF0ZXNcbiAgICAgICAgICAgICAgaW5jbHVkZUFzc2V0czogW1xuICAgICAgICAgICAgICAgIFwiZmF2aWNvbi5pY29cIixcbiAgICAgICAgICAgICAgICBcImFwcGxlLXRvdWNoLWljb24ucG5nXCIsXG4gICAgICAgICAgICAgICAgXCJtYXNrZWQtaWNvbi5zdmdcIixcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkxhdW5kcmlmeSAtIFF1aWNrIGNsZWFuICYgY29udmVuaWVudFwiLFxuICAgICAgICAgICAgICAgIHNob3J0X25hbWU6IFwiTGF1bmRyaWZ5XCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUXVpY2sgY2xlYW4gJiBjb252ZW5pZW50IHRoYXRzIGxhdW5kcmlmeVwiLFxuICAgICAgICAgICAgICAgIHN0YXJ0X3VybDogXCIvXCIsXG4gICAgICAgICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICAgICAgICAgICAgdGhlbWVfY29sb3I6IFwiI0M0NkREOFwiLFxuICAgICAgICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogXCJwbGFjZWhvbGRlci5zdmdcIixcbiAgICAgICAgICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogXCJwbGFjZWhvbGRlci5zdmdcIixcbiAgICAgICAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSwgLy8gXHVEODNEXHVERUE4IFJlbW92ZSBvbGQgY2FjaGVzXG4gICAgICAgICAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLCAvLyBcdUQ4M0RcdURFQTggVGFrZSBjb250cm9sIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgc2tpcFdhaXRpbmc6IHRydWUsIC8vIFx1RDgzRFx1REVBOCBBY3RpdmF0ZSBuZXcgU1cgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICBydW50aW1lQ2FjaGluZzogW1xuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2NkblxcLmJ1aWxkZXJcXC5pb1xcLy4qL2ksXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImltYWdlcy1jYWNoZVwiLFxuICAgICAgICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLCAvLyAzMCBkYXlzXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF1cbiAgICAgICAgOiBbXSksXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7QUFBNk0sU0FBUyxvQkFBb0I7QUFDMU8sT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLGVBQWUsUUFBUSxJQUFJLGVBQWU7QUFHaEQsTUFBSTtBQUNKLE1BQUksY0FBYztBQUNoQixRQUFJO0FBQ0YsZ0JBQVUsVUFBUSw2REFBaUIsRUFBRTtBQUFBLElBQ3ZDLFNBQVMsR0FBRztBQUNWLGNBQVEsS0FBSyxzREFBc0Q7QUFBQSxJQUNyRTtBQUFBLEVBQ0Y7QUFDQSxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDUSxPQUFPO0FBQUEsTUFDYix1QkFBdUI7QUFBQSxNQUNqQixlQUFlO0FBQUE7QUFBQSxRQUVuQixvQkFBb0I7QUFBQSxNQUN0QjtBQUFBO0FBQUEsTUFFQSxRQUFRLFNBQVMsZUFBZSxZQUFZO0FBQUE7QUFBQSxNQUU1QyxjQUFjO0FBQUE7QUFBQSxNQUVkLFdBQVc7QUFBQTtBQUFBLE1BRVgsc0JBQXNCO0FBQUE7QUFBQSxNQUV0QixRQUFRO0FBQUEsSUFDVjtBQUFBO0FBQUEsSUFFQSxTQUFTO0FBQUEsTUFDUCxNQUFNLFNBQVMsZUFBZSxDQUFDLFdBQVcsVUFBVSxJQUFJLENBQUM7QUFBQSxJQUMzRDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBO0FBQUEsUUFFSixhQUFhO0FBQUEsTUFDZixDQUFDO0FBQUE7QUFBQSxNQUVELEdBQUksVUFDQTtBQUFBLFFBQ0UsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBO0FBQUEsVUFDZCxlQUFlO0FBQUEsWUFDYjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsVUFBVTtBQUFBLFlBQ1IsTUFBTTtBQUFBLFlBQ04sWUFBWTtBQUFBLFlBQ1osYUFBYTtBQUFBLFlBQ2IsV0FBVztBQUFBLFlBQ1gsU0FBUztBQUFBLFlBQ1Qsa0JBQWtCO0FBQUEsWUFDbEIsYUFBYTtBQUFBLFlBQ2IsT0FBTztBQUFBLGNBQ0w7QUFBQSxnQkFDRSxLQUFLO0FBQUEsZ0JBQ0wsT0FBTztBQUFBLGdCQUNQLE1BQU07QUFBQSxjQUNSO0FBQUEsY0FDQTtBQUFBLGdCQUNFLEtBQUs7QUFBQSxnQkFDTCxPQUFPO0FBQUEsZ0JBQ1AsTUFBTTtBQUFBLGNBQ1I7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFVBQ0EsU0FBUztBQUFBLFlBQ1AsdUJBQXVCO0FBQUE7QUFBQSxZQUN2QixjQUFjO0FBQUE7QUFBQSxZQUNkLGFBQWE7QUFBQTtBQUFBLFlBQ2IsZ0JBQWdCO0FBQUEsY0FDZDtBQUFBLGdCQUNFLFlBQVk7QUFBQSxnQkFDWixTQUFTO0FBQUEsZ0JBQ1QsU0FBUztBQUFBLGtCQUNQLFdBQVc7QUFBQSxrQkFDWCxZQUFZO0FBQUEsb0JBQ1YsWUFBWTtBQUFBLG9CQUNaLGVBQWUsS0FBSyxLQUFLLEtBQUs7QUFBQTtBQUFBLGtCQUNoQztBQUFBLGdCQUNGO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSCxJQUNBLENBQUM7QUFBQSxJQUNQO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
