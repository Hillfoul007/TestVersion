import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
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
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["react-router-dom"],
            ui: [
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-dialog",
            ],
            icons: ["lucide-react"],
            utils: ["clsx", "tailwind-merge", "class-variance-authority"],
          },
        },
      },
      // Enable minification and compression
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production",
        },
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Reduce bundle size
      sourcemap: mode !== "production",
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
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
