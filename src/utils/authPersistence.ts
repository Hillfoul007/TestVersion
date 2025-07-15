/**
 * Authentication persistence utility to handle session restoration
 * and prevent automatic logouts on page refresh/browser events
 */

import { DVHostingSmsService } from "@/services/dvhostingSmsService";
import { validateAuthConsistency } from "@/utils/authDebug";

let authCheckInitialized = false;

export const initializeAuthPersistence = () => {
  if (authCheckInitialized) return;
  authCheckInitialized = true;

  const authService = DVHostingSmsService.getInstance();

  // Handle page visibility changes (user switching tabs, minimizing browser)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // User returned to the tab - ensure auth is still valid
      if (authService.isAuthenticated()) {
        console.log("✅ User returned to tab - auth state maintained");
      }
    }
  });

  // Handle storage events (syncing auth across tabs)
  window.addEventListener("storage", (event) => {
    if (
      event.key === "current_user" ||
      event.key === "cleancare_user" ||
      event.key === "auth_token" ||
      event.key === "cleancare_auth_token"
    ) {
      console.log("🔄 Auth storage change detected - syncing auth state");

      // Auth change detected in another tab
      if (event.newValue === null) {
        // User logged out in another tab
        console.log("🚪 User logged out in another tab");
        window.dispatchEvent(new CustomEvent("auth-logout"));
      } else if (event.oldValue === null && event.newValue) {
        // User logged in in another tab
        console.log("🎉 User logged in in another tab");
        window.dispatchEvent(
          new CustomEvent("auth-login", {
            detail: { user: authService.getCurrentUser() },
          }),
        );
      }
    }
  });

  // Prevent accidental navigation away from the app
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // Don't show the confirmation dialog anymore - users want seamless experience
    // Just ensure auth state is preserved
    const user = authService.getCurrentUser();
    if (user) {
      console.log("💾 Preserving auth state before page unload");
      // Ensure user data is saved to localStorage
      authService.setCurrentUser(user);
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  // Handle page hide (iOS Safari and mobile browsers)
  const handlePageHide = () => {
    const user = authService.getCurrentUser();
    if (user) {
      console.log("💾 Preserving auth state on page hide (mobile)");
      authService.setCurrentUser(user);
    }
  };

  window.addEventListener("pagehide", handlePageHide);

  console.log("✅ Authentication persistence initialized");
};

/**
 * Check and restore authentication state on app startup
 */
export const restoreAuthState = async (): Promise<boolean> => {
  try {
    const authService = DVHostingSmsService.getInstance();

    // Check multiple storage locations for auth data
    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("cleancare_auth_token");
    const userStr =
      localStorage.getItem("current_user") ||
      localStorage.getItem("cleancare_user");

    if (!token || !userStr) {
      console.log("ℹ️ No authentication data found");
      return false;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      console.warn("⚠️ Corrupted user data found - attempting recovery");
      // Don't auto-logout, try to preserve what we can
      return false;
    }

    if (!user || (!user.phone && !user.id && !user._id)) {
      console.warn("⚠️ Invalid user data found - attempting recovery");
      // Don't auto-logout, try to preserve what we can
      return false;
    }

    // Restore user session
    authService.setCurrentUser(user, token);
    console.log("✅ Authentication state restored:", {
      phone: user.phone,
      name: user.name,
      hasToken: !!token,
    });

    // Try to sync with backend (but never fail if it doesn't work)
    try {
      await authService.restoreSession();
      console.log("✅ Backend session synchronized");
    } catch (error) {
      console.warn(
        "⚠️ Backend sync failed, continuing with local auth:",
        error,
      );
      // Continue anyway - local auth is sufficient
    }

    return true;
  } catch (error) {
    console.error("❌ Error restoring auth state:", error);
    // Never fail completely - preserve user sessions
    console.warn("🔒 Continuing with existing auth state");
    return false;
  }
};

/**
 * Ensure auth state is consistent across all storage keys
 */
export const syncAuthStorage = () => {
  const authService = DVHostingSmsService.getInstance();
  const user = authService.getCurrentUser();

  if (user) {
    // Ensure all storage keys are in sync
    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("cleancare_auth_token");
    if (token) {
      authService.setCurrentUser(user, token);
      console.log("🔄 Auth storage synchronized");
    }
  }
};
