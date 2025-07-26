import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, X } from "lucide-react";

const PWAUpdateNotification: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [lastDismissedTime, setLastDismissedTime] = useState<number | null>(null);
  const [currentSwVersion, setCurrentSwVersion] = useState<string | null>(null);

  useEffect(() => {
    // Load previous dismissal state from localStorage
    const savedDismissTime = localStorage.getItem('pwa_update_dismissed_time');
    const savedSwVersion = localStorage.getItem('pwa_sw_version');

    if (savedDismissTime) {
      setLastDismissedTime(parseInt(savedDismissTime));
    }

    if (savedSwVersion) {
      setCurrentSwVersion(savedSwVersion);
    }

    // Service worker update detection
    if ("serviceWorker" in navigator) {
      let hasShownUpdate = false;

      const handleControllerChange = () => {
        // Only show update if we haven't shown it recently
        const now = Date.now();
        const dismissCooldown = 5 * 60 * 1000; // 5 minutes

        if (!hasShownUpdate && (!lastDismissedTime || now - lastDismissedTime > dismissCooldown)) {
          console.log('PWA: New service worker available');
          setUpdateAvailable(true);
          setShowUpdatePrompt(true);
          hasShownUpdate = true;
        }
      };

      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

      // Check for updates less frequently and with better logic
      const checkForUpdates = async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();

          for (const registration of registrations) {
            if (registration.waiting) {
              // Check if this is a new version we haven't dismissed
              const swUrl = registration.waiting.scriptURL;
              const newVersion = swUrl.split('?')[1] || new Date(registration.waiting.scriptURL).toString();

              if (newVersion !== currentSwVersion && !hasShownUpdate) {
                const now = Date.now();
                const dismissCooldown = 5 * 60 * 1000; // 5 minutes

                if (!lastDismissedTime || now - lastDismissedTime > dismissCooldown) {
                  console.log('PWA: Update waiting, showing notification');
                  setUpdateAvailable(true);
                  setShowUpdatePrompt(true);
                  setCurrentSwVersion(newVersion);
                  localStorage.setItem('pwa_sw_version', newVersion);
                  hasShownUpdate = true;
                }
              }
            } else {
              // Check for updates but don't spam
              await registration.update();
            }
          }
        } catch (error) {
          console.warn('PWA: Error checking for updates:', error);
        }
      };

      // Check on load
      checkForUpdates();

      // Check less frequently - every 2 minutes instead of 30 seconds
      const interval = setInterval(checkForUpdates, 2 * 60 * 1000);

      return () => {
        clearInterval(interval);
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      };
    }
  }, [lastDismissedTime, currentSwVersion]);

  const handleUpdate = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    const now = Date.now();
    setShowUpdatePrompt(false);
    setUpdateAvailable(false);
    setLastDismissedTime(now);

    // Remember dismissal in localStorage
    localStorage.setItem('pwa_update_dismissed_time', now.toString());

    console.log('PWA: Update notification dismissed');
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <Alert className="border-green-200 bg-green-50 shadow-lg">
        <RefreshCw className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <p className="font-medium mb-1">New version available!</p>
              <p className="text-sm">
                Update Laundrify to get the latest features and
                improvements.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Update
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-green-600 hover:text-green-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PWAUpdateNotification;
