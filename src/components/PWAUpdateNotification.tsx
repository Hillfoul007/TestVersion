import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, X } from "lucide-react";

const PWAUpdateNotification: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Simple service worker update detection
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setUpdateAvailable(true);
        setShowUpdatePrompt(true);
      });

      // Check for updates periodically
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            if (registration.waiting) {
              setUpdateAvailable(true);
              setShowUpdatePrompt(true);
            }
            registration.update();
          });
        });
      };

      // Check on load and every 30 seconds
      checkForUpdates();
      const interval = setInterval(checkForUpdates, 30000);

      return () => clearInterval(interval);
    }
  }, []);

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
    setShowUpdatePrompt(false);
    setUpdateAvailable(false);
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
