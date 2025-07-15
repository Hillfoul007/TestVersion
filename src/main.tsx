import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import PerformanceMonitor from "./utils/performanceMonitor";

// Initialize performance monitoring
const perfMonitor = PerformanceMonitor.getInstance();
perfMonitor.init();

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for caching
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
