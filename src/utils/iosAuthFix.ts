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
