// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { VitePWA } from "file:///app/code/node_modules/vite-plugin-pwa/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/app/code";
var vite_config_default = defineConfig(({ mode }) => {
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
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["react-router-dom"],
            ui: [
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-dialog"
            ],
            icons: ["lucide-react"],
            utils: ["clsx", "tailwind-merge", "class-variance-authority"]
          }
        }
      },
      // Enable minification and compression
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production"
        }
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Reduce bundle size
      sourcemap: mode !== "production"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIHJldHVybiB7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiAxMDAwMCxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMVwiLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgdmVuZG9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICAgICAgICAgIHJvdXRlcjogW1wicmVhY3Qtcm91dGVyLWRvbVwiXSxcbiAgICAgICAgICAgIHVpOiBbXG4gICAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWFjY29yZGlvblwiLFxuICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1hbGVydC1kaWFsb2dcIixcbiAgICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgaWNvbnM6IFtcImx1Y2lkZS1yZWFjdFwiXSxcbiAgICAgICAgICAgIHV0aWxzOiBbXCJjbHN4XCIsIFwidGFpbHdpbmQtbWVyZ2VcIiwgXCJjbGFzcy12YXJpYW5jZS1hdXRob3JpdHlcIl0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvLyBFbmFibGUgbWluaWZpY2F0aW9uIGFuZCBjb21wcmVzc2lvblxuICAgICAgbWluaWZ5OiBcInRlcnNlclwiLFxuICAgICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgICBjb21wcmVzczoge1xuICAgICAgICAgIGRyb3BfY29uc29sZTogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIsXG4gICAgICAgICAgZHJvcF9kZWJ1Z2dlcjogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy8gRW5hYmxlIENTUyBjb2RlIHNwbGl0dGluZ1xuICAgICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgICAgLy8gUmVkdWNlIGJ1bmRsZSBzaXplXG4gICAgICBzb3VyY2VtYXA6IG1vZGUgIT09IFwicHJvZHVjdGlvblwiLFxuICAgIH0sXG4gICAgLy8gRW5hYmxlIGd6aXAgY29tcHJlc3Npb24gZm9yIGFzc2V0c1xuICAgIGVzYnVpbGQ6IHtcbiAgICAgIGRyb3A6IG1vZGUgPT09IFwicHJvZHVjdGlvblwiID8gW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdIDogW10sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIC8vIEVuYWJsZSBSZWFjdCBGYXN0IFJlZnJlc2ggZm9yIGJldHRlciBkZXYgZXhwZXJpZW5jZVxuICAgICAgICBmYXN0UmVmcmVzaDogdHJ1ZSxcbiAgICAgIH0pLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsIC8vIFx1RDgzRFx1REVBOCBLZXkgZm9yIGF1dG9tYXRpYyB1cGRhdGVzXG4gICAgICAgIGluY2x1ZGVBc3NldHM6IFtcbiAgICAgICAgICBcImZhdmljb24uaWNvXCIsXG4gICAgICAgICAgXCJhcHBsZS10b3VjaC1pY29uLnBuZ1wiLFxuICAgICAgICAgIFwibWFza2VkLWljb24uc3ZnXCIsXG4gICAgICAgIF0sXG4gICAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgICAgbmFtZTogXCJDbGVhbkNhcmUgUHJvIC0gTGF1bmRyeSBTZXJ2aWNlc1wiLFxuICAgICAgICAgIHNob3J0X25hbWU6IFwiQ2xlYW5DYXJlIFByb1wiLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlByb2Zlc3Npb25hbCBsYXVuZHJ5IGFuZCBkcnkgY2xlYW5pbmcgc2VydmljZXNcIixcbiAgICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxuICAgICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxuICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiBcIiMyMmM1NWVcIixcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwicGxhY2Vob2xkZXIuc3ZnXCIsXG4gICAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9zdmcreG1sXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwicGxhY2Vob2xkZXIuc3ZnXCIsXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9zdmcreG1sXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsIC8vIFx1RDgzRFx1REVBOCBSZW1vdmUgb2xkIGNhY2hlc1xuICAgICAgICAgIGNsaWVudHNDbGFpbTogdHJ1ZSwgLy8gXHVEODNEXHVERUE4IFRha2UgY29udHJvbCBpbW1lZGlhdGVseVxuICAgICAgICAgIHNraXBXYWl0aW5nOiB0cnVlLCAvLyBcdUQ4M0RcdURFQTggQWN0aXZhdGUgbmV3IFNXIGltbWVkaWF0ZWx5XG4gICAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9jZG5cXC5idWlsZGVyXFwuaW9cXC8uKi9pLFxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJpbWFnZXMtY2FjaGVcIixcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMDAsXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzMCwgLy8gMzAgZGF5c1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZNLFNBQVMsb0JBQW9CO0FBQzFPLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLHVCQUF1QjtBQUFBLE1BQ3ZCLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWM7QUFBQSxZQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxZQUM3QixRQUFRLENBQUMsa0JBQWtCO0FBQUEsWUFDM0IsSUFBSTtBQUFBLGNBQ0Y7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLFlBQ0Y7QUFBQSxZQUNBLE9BQU8sQ0FBQyxjQUFjO0FBQUEsWUFDdEIsT0FBTyxDQUFDLFFBQVEsa0JBQWtCLDBCQUEwQjtBQUFBLFVBQzlEO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFVBQ1IsY0FBYyxTQUFTO0FBQUEsVUFDdkIsZUFBZSxTQUFTO0FBQUEsUUFDMUI7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUVBLGNBQWM7QUFBQTtBQUFBLE1BRWQsV0FBVyxTQUFTO0FBQUEsSUFDdEI7QUFBQTtBQUFBLElBRUEsU0FBUztBQUFBLE1BQ1AsTUFBTSxTQUFTLGVBQWUsQ0FBQyxXQUFXLFVBQVUsSUFBSSxDQUFDO0FBQUEsSUFDM0Q7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQTtBQUFBLFFBRUosYUFBYTtBQUFBLE1BQ2YsQ0FBQztBQUFBLE1BQ0QsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsUUFDZCxlQUFlO0FBQUEsVUFDYjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLFFBQ0EsVUFBVTtBQUFBLFVBQ1IsTUFBTTtBQUFBLFVBQ04sWUFBWTtBQUFBLFVBQ1osYUFBYTtBQUFBLFVBQ2IsV0FBVztBQUFBLFVBQ1gsU0FBUztBQUFBLFVBQ1Qsa0JBQWtCO0FBQUEsVUFDbEIsYUFBYTtBQUFBLFVBQ2IsT0FBTztBQUFBLFlBQ0w7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLGNBQ0UsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLFlBQ1I7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsU0FBUztBQUFBLFVBQ1AsdUJBQXVCO0FBQUE7QUFBQSxVQUN2QixjQUFjO0FBQUE7QUFBQSxVQUNkLGFBQWE7QUFBQTtBQUFBLFVBQ2IsZ0JBQWdCO0FBQUEsWUFDZDtBQUFBLGNBQ0UsWUFBWTtBQUFBLGNBQ1osU0FBUztBQUFBLGNBQ1QsU0FBUztBQUFBLGdCQUNQLFdBQVc7QUFBQSxnQkFDWCxZQUFZO0FBQUEsa0JBQ1YsWUFBWTtBQUFBLGtCQUNaLGVBQWUsS0FBSyxLQUFLLEtBQUs7QUFBQTtBQUFBLGdCQUNoQztBQUFBLGNBQ0Y7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
