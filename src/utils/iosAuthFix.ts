/**
 * iOS-specific authentication fixes for OTP and session management
 */

export const clearIosAuthState = (): void => {
  try {
    // Only clear auth-related keys, preserve cart and other user data
    const keysToRemove = [
      "current_user",
      "cleancare_user",
      "cleancare_auth_token",
      "auth_token",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage completely for iOS
    sessionStorage.clear();

    // Clear any cached form data in iOS Safari
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      if (form instanceof HTMLFormElement) {
        form.reset();
      }
    });

    // Clear input fields that might be cached
    const inputs = document.querySelectorAll(
      'input[type="tel"], input[type="text"]',
    );
    inputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.value = "";
      }
    });

    console.log("✅ iOS auth state cleared (explicit logout)");
  } catch (error) {
    console.error("❌ Error clearing iOS auth state:", error);
  }
};

export const addIosNoCacheHeaders = (
  fetchOptions: RequestInit = {},
): RequestInit => {
  return {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  };
};

export const isIosDevice = (): boolean => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export const addIosOtpDelay = async (): Promise<void> => {
  if (isIosDevice()) {
    // Add 2-3 second delay for iOS to prevent DVHosting rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
};

/**
 * iPhone-specific session persistence to prevent auto logout
 */
export const preventIosAutoLogout = (): void => {
  if (!isIosDevice()) return;

  console.log("🍎 Initializing iPhone-specific auth persistence");

  // Handle iOS PWA state changes that can clear localStorage
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // User returned to the app - ensure auth is preserved
      const user =
        localStorage.getItem("current_user") ||
        localStorage.getItem("cleancare_user");
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("cleancare_auth_token");

      if (user && token) {
        console.log("🍎 iPhone visibility change - auth preserved");
        // Trigger a storage event to sync auth state
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "auth_heartbeat",
            newValue: Date.now().toString(),
            storageArea: localStorage,
          }),
        );
      }
    }
  });

  // Handle iOS Safari memory pressure that can clear localStorage
  window.addEventListener("pagehide", () => {
    const user =
      localStorage.getItem("current_user") ||
      localStorage.getItem("cleancare_user");
    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("cleancare_auth_token");

    if (user && token) {
      // Double-write auth data to multiple keys for redundancy
      localStorage.setItem("ios_backup_user", user);
      localStorage.setItem("ios_backup_token", token);
      localStorage.setItem("ios_auth_timestamp", Date.now().toString());
      console.log("🍎 iPhone pagehide - created auth backup");
    }
  });

  // Handle iOS app resume/focus
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      // Page was restored from cache - check auth state
      const user =
        localStorage.getItem("current_user") ||
        localStorage.getItem("cleancare_user");
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("cleancare_auth_token");

      if (!user || !token) {
        // Try to restore from backup
        const backupUser = localStorage.getItem("ios_backup_user");
        const backupToken = localStorage.getItem("ios_backup_token");

        if (backupUser && backupToken) {
          localStorage.setItem("current_user", backupUser);
          localStorage.setItem("cleancare_user", backupUser);
          localStorage.setItem("auth_token", backupToken);
          localStorage.setItem("cleancare_auth_token", backupToken);
          console.log("🍎 iPhone pageshow - restored auth from backup");

          // Trigger auth restoration event
          window.dispatchEvent(
            new CustomEvent("ios-auth-restored", {
              detail: { user: JSON.parse(backupUser) },
            }),
          );
        }
      }
    }
  });

  // Prevent iOS from clearing localStorage when memory is low
  const preserveAuth = () => {
    const user =
      localStorage.getItem("current_user") ||
      localStorage.getItem("cleancare_user");
    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("cleancare_auth_token");

    if (user && token) {
      // Create multiple backup copies
      sessionStorage.setItem("ios_session_user", user);
      sessionStorage.setItem("ios_session_token", token);

      // Use a more persistent storage method
      try {
        document.cookie = `ios_auth_backup=${encodeURIComponent(user)}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Strict`;
      } catch (e) {
        // Cookie storage failed, continue
      }
    }
  };

  // Run preservation every 30 seconds on iPhone
  setInterval(preserveAuth, 30000);

  // Run initial preservation
  preserveAuth();
};

/**
 * Restore auth from various iPhone backup locations
 */
export const restoreIosAuth = (): boolean => {
  if (!isIosDevice()) return false;

  const user =
    localStorage.getItem("current_user") ||
    localStorage.getItem("cleancare_user");
  const token =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("cleancare_auth_token");

  if (user && token) {
    return true; // Auth already exists
  }

  // Try to restore from backups
  const backupUser =
    localStorage.getItem("ios_backup_user") ||
    sessionStorage.getItem("ios_session_user");
  const backupToken =
    localStorage.getItem("ios_backup_token") ||
    sessionStorage.getItem("ios_session_token");

  if (backupUser && backupToken) {
    localStorage.setItem("current_user", backupUser);
    localStorage.setItem("cleancare_user", backupUser);
    localStorage.setItem("auth_token", backupToken);
    localStorage.setItem("cleancare_auth_token", backupToken);
    console.log("🍎 Restored iPhone auth from backup storage");
    return true;
  }

  // Try to restore from cookie backup
  try {
    const cookies = document.cookie.split(";");
    const authCookie = cookies.find((c) =>
      c.trim().startsWith("ios_auth_backup="),
    );

    if (authCookie) {
      const cookieUser = decodeURIComponent(authCookie.split("=")[1]);
      // Parse user to get phone and create proper token
      try {
        const user = JSON.parse(cookieUser);
        const phone = user.phone || user.mobile || user.id;
        const persistentToken = `user_token_${phone}_persistent`;

        localStorage.setItem("current_user", cookieUser);
        localStorage.setItem("cleancare_user", cookieUser);
        localStorage.setItem("auth_token", persistentToken);
        localStorage.setItem("cleancare_auth_token", persistentToken);
        console.log("🍎 Restored iPhone auth from cookie backup with token");
        return true;
      } catch (e) {
        // Fallback without token
        localStorage.setItem("current_user", cookieUser);
        localStorage.setItem("cleancare_user", cookieUser);
        console.log("🍎 Restored iPhone auth from cookie backup (no token)");
        return true;
      }
    }
  } catch (e) {
    // Cookie restore failed
  }

  return false;
};
