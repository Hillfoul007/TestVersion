import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/contexts/NotificationContext";
import LaundryIndex from "@/pages/LaundryIndex";
import LocationConfigPage from "@/pages/LocationConfigPage";
import ErrorBoundary from "@/components/ErrorBoundary";
import InstallPrompt from "@/components/InstallPrompt";
import PWAUpdateNotification from "@/components/PWAUpdateNotification";
import AddressSearchDemo from "@/components/AddressSearchDemo";
import ReferralLoginPage from "@/pages/ReferralLoginPage";
import IosBlankPageRecovery from "@/components/IosBlankPageRecovery";
import {
  initializeAuthPersistence,
  restoreAuthState,
} from "@/utils/authPersistence";
import { initializePWAUpdates } from "@/utils/swCleanup";
import { isIOSSafari, isProbablyMobileData, preloadForIOS, checkIOSConnectivity } from "@/utils/iosNetworkUtils";
import { IosBlankPageManager } from "@/utils/iosBlankPageFix";
import "./App.css";
import "./styles/mobile-fixes.css";
import "./styles/mobile-touch-fixes.css";

function App() {
  // Initialize authentication persistence and restore user session
  useEffect(() => {
    const initializeAuth = async () => {
      // Auto-clear cart on deploy (only once)
      const versionKey = "catalogue-version-v2";
      if (!localStorage.getItem(versionKey)) {
        localStorage.removeItem("cart");
        localStorage.setItem(versionKey, "true");
      }

      // Initialize auth persistence handlers (storage events, page lifecycle, etc.)
      initializeAuthPersistence();

      // Initialize PWA updates and service worker cleanup
      initializePWAUpdates();

      // Initialize iOS blank page prevention (must be early)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                   (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      if (isIOS) {
        console.log('🍎 Initializing iOS blank page prevention...');
        IosBlankPageManager.getInstance();

        // Handle recovery from previous blank page
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('ios_recovery') === 'blank_page') {
          console.log('🍎✅ Recovered from blank page, removing recovery parameters');
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          // Reset recovery attempt counter on successful recovery
          localStorage.removeItem('ios_recovery_attempt');
        }
      }

      // Check iOS mobile data connectivity before auth restoration
      if (isIOSSafari() && isProbablyMobileData()) {
        console.log('🍎 iOS Safari on mobile data detected - performing connectivity check...');

        try {
          // Preload critical resources for iOS
          await preloadForIOS();

          // Check connectivity with health endpoint
          const isConnected = await checkIOSConnectivity();
          if (!isConnected) {
            console.warn('⚠️ iOS connectivity issue detected - showing connection warning');
            // You could show a toast notification here
            window.dispatchEvent(new CustomEvent('ios-connectivity-issue', {
              detail: { type: 'mobile-data-connection-failed' }
            }));
          } else {
            console.log('✅ iOS connectivity check passed');
          }
        } catch (error) {
          console.error('🍎 iOS connectivity check failed:', error);
          window.dispatchEvent(new CustomEvent('ios-connectivity-issue', {
            detail: { type: 'connectivity-check-error', error: error.message }
          }));
        }
      }

      // Restore authentication state from localStorage
      const restored = await restoreAuthState();

      // For iOS devices, ensure auth state is properly broadcasted after restoration
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      if (isIOS && restored) {
        console.log("🍎 iOS auth restored in App - broadcasting auth event");
        // Trigger auth event to ensure all components are updated
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("auth-login", {
            detail: { restored: true }
          }));
        }, 100);
      }

      // For iOS: Set up continuous monitoring for session loss
      if (isIOS) {
        const continuousAuthCheck = setInterval(() => {
          const hasAuth = localStorage.getItem('current_user') || localStorage.getItem('cleancare_user');
          const hasToken = localStorage.getItem('auth_token') || localStorage.getItem('cleancare_auth_token');

          if (!hasAuth || !hasToken) {
            // Auth lost - attempt immediate restoration
            import('./utils/iosAuthFix').then(({ restoreIosAuth }) => {
              restoreIosAuth().then((authRestored) => {
                if (authRestored) {
                  console.log('🍎✨ Continuous monitoring: Auth restored successfully');
                  window.dispatchEvent(new CustomEvent('ios-session-restored', {
                    detail: { source: 'continuous-monitoring' }
                  }));
                }
              });
            });
          }
        }, 10000); // Check every 10 seconds

        // Clean up interval on unmount (though App rarely unmounts)
        return () => clearInterval(continuousAuthCheck);
      }
    };

    initializeAuth();
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LaundryIndex />} />
              <Route path="/login" element={<ReferralLoginPage />} />
              <Route path="/refer" element={<ReferralLoginPage />} />
              <Route path="/address-demo" element={<AddressSearchDemo />} />
              <Route
                path="/admin/location-config"
                element={<LocationConfigPage />}
              />
              <Route path="*" element={<LaundryIndex />} />
            </Routes>
            <Toaster />
            <InstallPrompt />
            <PWAUpdateNotification />
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
