import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import PerformanceMonitor from "./utils/performanceMonitor";

// iOS Safari compatibility fixes with enhanced authentication
const initializeiOSFixes = () => {
  // Immediate iOS authentication initialization
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    console.log("🍎 Early iOS authentication initialization");

    // Import and initialize iOS auth fixes as early as possible
    import("./utils/iosAuthFix").then(({ preventIosAutoLogout, restoreIosAuth }) => {
      preventIosAutoLogout();
      restoreIosAuth().then((restored) => {
        if (restored) {
          console.log("🍎📱 Early iOS auth restoration successful");
        }
      });
    }).catch(error => {
      console.warn("🍎⚠️ Early iOS auth import failed:", error);
    });

    // Initialize iOS Session Manager early
    import("./utils/iosSessionManager").then(({ default: IosSessionManager }) => {
      const sessionManager = IosSessionManager.getInstance();
      sessionManager.forceSessionRestore().then((restored) => {
        if (restored) {
          console.log("🍎📱 Early iOS session manager restoration successful");
        }
      });
    }).catch(error => {
      console.warn("🍎⚠️ Early iOS session manager import failed:", error);
    });
  }
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

  // Enhanced iOS session monitoring and restoration
  if (isIOS) {
    // Listen for iOS app lifecycle events
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // App became visible - check and restore auth if needed
        setTimeout(() => {
          const hasAuth = localStorage.getItem('current_user') || localStorage.getItem('cleancare_user');
          if (!hasAuth) {
            console.log('🍎 App visible - no auth detected, attempting restoration');
            import('./utils/iosAuthFix').then(({ restoreIosAuth }) => {
              restoreIosAuth();
            });
          }
        }, 1000);
      }
    });

    // Listen for page show events (iOS Safari cache restoration)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('🍎 Page restored from cache - checking auth state');
        setTimeout(() => {
          const hasAuth = localStorage.getItem('current_user') || localStorage.getItem('cleancare_user');
          if (!hasAuth) {
            console.log('🍎 Cache restore - no auth detected, attempting restoration');
            import('./utils/iosAuthFix').then(({ restoreIosAuth }) => {
              restoreIosAuth();
            });
          }
        }, 500);
      }
    });

    // Enhanced iOS PWA detection and handling
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true;

    if (isPWA) {
      console.log('🍎📱 iOS PWA mode detected - enhanced auth monitoring');

      // PWA focus/blur events for session restoration
      window.addEventListener('focus', () => {
        setTimeout(() => {
          const hasAuth = localStorage.getItem('current_user') || localStorage.getItem('cleancare_user');
          if (!hasAuth) {
            console.log('🍎 PWA focus - no auth detected, attempting restoration');
            import('./utils/iosAuthFix').then(({ restoreIosAuth }) => {
              restoreIosAuth();
            });
          }
        }, 1000);
      });
    }
  }
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
