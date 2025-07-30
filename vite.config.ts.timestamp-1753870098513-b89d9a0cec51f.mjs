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
      },
      // Enable SPA fallback for client-side routing
      historyApiFallback: true
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
            clientsClaim: false,
            // ❌ Avoid conflicts - let page reload naturally
            skipWaiting: false,
            // ❌ Avoid conflicts - wait for page reload
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgaXNQV0FFbmFibGVkID0gcHJvY2Vzcy5lbnYuRU5BQkxFX1BXQSAhPT0gXCJmYWxzZVwiO1xuXG4gIC8vIER5bmFtaWNhbGx5IGltcG9ydCBQV0EgcGx1Z2luXG4gIGxldCBWaXRlUFdBO1xuICBpZiAoaXNQV0FFbmFibGVkKSB7XG4gICAgdHJ5IHtcbiAgICAgIFZpdGVQV0EgPSByZXF1aXJlKFwidml0ZS1wbHVnaW4tcHdhXCIpLlZpdGVQV0E7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKFwidml0ZS1wbHVnaW4tcHdhIG5vdCBhdmFpbGFibGUsIFBXQSBmZWF0dXJlcyBkaXNhYmxlZFwiKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDEwMDAwLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgXCIvYXBpXCI6IHtcbiAgICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCIsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy8gRW5hYmxlIFNQQSBmYWxsYmFjayBmb3IgY2xpZW50LXNpZGUgcm91dGluZ1xuICAgICAgaGlzdG9yeUFwaUZhbGxiYWNrOiB0cnVlLFxuICAgIH0sXG4gICAgICAgICAgICBidWlsZDoge1xuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAvLyBNaW5pbWl6ZSBwYXJhbGxlbCBvcGVyYXRpb25zIHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcbiAgICAgICAgbWF4UGFyYWxsZWxGaWxlT3BzOiAxLFxuICAgICAgfSxcbiAgICAgIC8vIFVzZSBlc2J1aWxkIGluc3RlYWQgb2YgdGVyc2VyIGZvciBsb3dlciBtZW1vcnkgdXNhZ2VcbiAgICAgIG1pbmlmeTogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgPyBcImVzYnVpbGRcIiA6IGZhbHNlLFxuICAgICAgLy8gRGlzYWJsZSBDU1MgY29kZSBzcGxpdHRpbmcgdG8gcmVkdWNlIG1lbW9yeSB1c2FnZVxuICAgICAgY3NzQ29kZVNwbGl0OiBmYWxzZSxcbiAgICAgIC8vIERpc2FibGUgc291cmNlbWFwIHRvIHNhdmUgbWVtb3J5XG4gICAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgICAgLy8gRGlzYWJsZSByZXBvcnRpbmcgdG8gc2F2ZSBtZW1vcnlcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgICAgIC8vIFJlZHVjZSB0YXJnZXQgdG8gbWluaW1pemUgcG9seWZpbGxzXG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIH0sXG4gICAgLy8gRW5hYmxlIGd6aXAgY29tcHJlc3Npb24gZm9yIGFzc2V0c1xuICAgIGVzYnVpbGQ6IHtcbiAgICAgIGRyb3A6IG1vZGUgPT09IFwicHJvZHVjdGlvblwiID8gW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdIDogW10sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIC8vIEVuYWJsZSBSZWFjdCBGYXN0IFJlZnJlc2ggZm9yIGJldHRlciBkZXYgZXhwZXJpZW5jZVxuICAgICAgICBmYXN0UmVmcmVzaDogdHJ1ZSxcbiAgICAgIH0pLFxuICAgICAgLy8gQ29uZGl0aW9uYWxseSBhZGQgUFdBIHBsdWdpblxuICAgICAgLi4uKFZpdGVQV0FcbiAgICAgICAgPyBbXG4gICAgICAgICAgICBWaXRlUFdBKHtcbiAgICAgICAgICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIiwgLy8gXHVEODNEXHVERUE4IEtleSBmb3IgYXV0b21hdGljIHVwZGF0ZXNcbiAgICAgICAgICAgICAgaW5jbHVkZUFzc2V0czogW1xuICAgICAgICAgICAgICAgIFwiZmF2aWNvbi5pY29cIixcbiAgICAgICAgICAgICAgICBcImFwcGxlLXRvdWNoLWljb24ucG5nXCIsXG4gICAgICAgICAgICAgICAgXCJtYXNrZWQtaWNvbi5zdmdcIixcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkxhdW5kcmlmeSAtIFF1aWNrIGNsZWFuICYgY29udmVuaWVudFwiLFxuICAgICAgICAgICAgICAgIHNob3J0X25hbWU6IFwiTGF1bmRyaWZ5XCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUXVpY2sgY2xlYW4gJiBjb252ZW5pZW50IHRoYXRzIGxhdW5kcmlmeVwiLFxuICAgICAgICAgICAgICAgIHN0YXJ0X3VybDogXCIvXCIsXG4gICAgICAgICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICAgICAgICAgICAgdGhlbWVfY29sb3I6IFwiI0M0NkREOFwiLFxuICAgICAgICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogXCJwbGFjZWhvbGRlci5zdmdcIixcbiAgICAgICAgICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogXCJwbGFjZWhvbGRlci5zdmdcIixcbiAgICAgICAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSwgLy8gXHVEODNEXHVERUE4IFJlbW92ZSBvbGQgY2FjaGVzXG4gICAgICAgICAgICAgICAgY2xpZW50c0NsYWltOiBmYWxzZSwgLy8gXHUyNzRDIEF2b2lkIGNvbmZsaWN0cyAtIGxldCBwYWdlIHJlbG9hZCBuYXR1cmFsbHlcbiAgICAgICAgICAgICAgICBza2lwV2FpdGluZzogZmFsc2UsIC8vIFx1Mjc0QyBBdm9pZCBjb25mbGljdHMgLSB3YWl0IGZvciBwYWdlIHJlbG9hZFxuICAgICAgICAgICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvY2RuXFwuYnVpbGRlclxcLmlvXFwvLiovaSxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiaW1hZ2VzLWNhY2hlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzAsIC8vIDMwIGRheXNcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXVxuICAgICAgICA6IFtdKSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7OztBQUE2TSxTQUFTLG9CQUFvQjtBQUMxTyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sZUFBZSxRQUFRLElBQUksZUFBZTtBQUdoRCxNQUFJO0FBQ0osTUFBSSxjQUFjO0FBQ2hCLFFBQUk7QUFDRixnQkFBVSxVQUFRLDZEQUFpQixFQUFFO0FBQUEsSUFDdkMsU0FBUyxHQUFHO0FBQ1YsY0FBUSxLQUFLLHNEQUFzRDtBQUFBLElBQ3JFO0FBQUEsRUFDRjtBQUNBLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFFQSxvQkFBb0I7QUFBQSxJQUN0QjtBQUFBLElBQ1EsT0FBTztBQUFBLE1BQ2IsdUJBQXVCO0FBQUEsTUFDakIsZUFBZTtBQUFBO0FBQUEsUUFFbkIsb0JBQW9CO0FBQUEsTUFDdEI7QUFBQTtBQUFBLE1BRUEsUUFBUSxTQUFTLGVBQWUsWUFBWTtBQUFBO0FBQUEsTUFFNUMsY0FBYztBQUFBO0FBQUEsTUFFZCxXQUFXO0FBQUE7QUFBQSxNQUVYLHNCQUFzQjtBQUFBO0FBQUEsTUFFdEIsUUFBUTtBQUFBLElBQ1Y7QUFBQTtBQUFBLElBRUEsU0FBUztBQUFBLE1BQ1AsTUFBTSxTQUFTLGVBQWUsQ0FBQyxXQUFXLFVBQVUsSUFBSSxDQUFDO0FBQUEsSUFDM0Q7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQTtBQUFBLFFBRUosYUFBYTtBQUFBLE1BQ2YsQ0FBQztBQUFBO0FBQUEsTUFFRCxHQUFJLFVBQ0E7QUFBQSxRQUNFLFFBQVE7QUFBQSxVQUNOLGNBQWM7QUFBQTtBQUFBLFVBQ2QsZUFBZTtBQUFBLFlBQ2I7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFVBQVU7QUFBQSxZQUNSLE1BQU07QUFBQSxZQUNOLFlBQVk7QUFBQSxZQUNaLGFBQWE7QUFBQSxZQUNiLFdBQVc7QUFBQSxZQUNYLFNBQVM7QUFBQSxZQUNULGtCQUFrQjtBQUFBLFlBQ2xCLGFBQWE7QUFBQSxZQUNiLE9BQU87QUFBQSxjQUNMO0FBQUEsZ0JBQ0UsS0FBSztBQUFBLGdCQUNMLE9BQU87QUFBQSxnQkFDUCxNQUFNO0FBQUEsY0FDUjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxLQUFLO0FBQUEsZ0JBQ0wsT0FBTztBQUFBLGdCQUNQLE1BQU07QUFBQSxjQUNSO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFNBQVM7QUFBQSxZQUNQLHVCQUF1QjtBQUFBO0FBQUEsWUFDdkIsY0FBYztBQUFBO0FBQUEsWUFDZCxhQUFhO0FBQUE7QUFBQSxZQUNiLGdCQUFnQjtBQUFBLGNBQ2Q7QUFBQSxnQkFDRSxZQUFZO0FBQUEsZ0JBQ1osU0FBUztBQUFBLGdCQUNULFNBQVM7QUFBQSxrQkFDUCxXQUFXO0FBQUEsa0JBQ1gsWUFBWTtBQUFBLG9CQUNWLFlBQVk7QUFBQSxvQkFDWixlQUFlLEtBQUssS0FBSyxLQUFLO0FBQUE7QUFBQSxrQkFDaEM7QUFBQSxnQkFDRjtBQUFBLGNBQ0Y7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0gsSUFDQSxDQUFDO0FBQUEsSUFDUDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
