import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import PerformanceMonitor from "./utils/performanceMonitor";

// iOS Safari compatibility fixes
const initializeiOSFixes = () => {
  // Fix for iOS viewport issues
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
    );
  }

  // Prevent zoom on input focus for iOS
  document.addEventListener('touchstart', () => {
    const style = document.createElement('style');
    style.innerHTML = `
      input, textarea, select {
        font-size: 16px !important;
        transform: translateZ(0);
        -webkit-appearance: none;
        border-radius: 0;
      }
    `;
    document.head.appendChild(style);
  }, { once: true });

  // Handle iOS-specific console errors
  window.addEventListener('error', (event) => {
    console.log('Global error caught:', event.error);
    // Don't let unhandled errors crash the app on iOS
    event.preventDefault();
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.log('Unhandled promise rejection:', event.reason);
    // Don't let unhandled rejections crash the app on iOS
    event.preventDefault();
  });
};

// Initialize iOS fixes
initializeiOSFixes();

// Initialize performance monitoring with error handling
try {
  const perfMonitor = PerformanceMonitor.getInstance();
  perfMonitor.init();
} catch (error) {
  console.log('Performance monitor failed to initialize:', error);
}

// Safe render with error boundary
const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error('Failed to render app:', error);
    // Fallback rendering
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;">Loading Laundrify...</div>';
  }
} else {
  console.error('Root element not found');
}

// Service worker registration is handled by Vite PWA plugin
// Manual registration removed to avoid conflicts
