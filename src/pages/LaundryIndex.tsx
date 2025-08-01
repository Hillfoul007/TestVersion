import React, { useState, useEffect } from "react";
import ResponsiveLaundryHome from "../components/ResponsiveLaundryHome";
import LaundryCart from "../components/LaundryCart";
import EnhancedBookingHistory from "@/components/EnhancedBookingHistory";
import PhoneOtpAuthModal from "@/components/PhoneOtpAuthModal";
import BookingConfirmed from "@/components/BookingConfirmed";
import ReferralCodeHandler from "@/components/ReferralCodeHandler";
import ReferralDiscountBanner from "@/components/ReferralDiscountBanner";
import First30OfferNotification from "@/components/First30OfferNotification";
import LaundrifySplashLoader from "@/components/LaundrifySplashLoader";
import AddressSyncNotification from "@/components/AddressSyncNotification";
import { DVHostingSmsService } from "../services/dvhostingSmsService";
import PushNotificationService from "../services/pushNotificationService";
import { ReferralService } from "@/services/referralService";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  createSuccessNotification,
  createErrorNotification,
} from "@/utils/notificationUtils";
import { loginLocationChecker } from "@/services/loginLocationChecker";
import LocationUnavailableModal from "@/components/LocationUnavailableModal";

// Helper function for coordinate-based location detection (fallback)
const getCoordinateBasedLocation = (
  latitude: number,
  longitude: number,
): string => {
  console.log(
    `🎯 Using coordinate-based fallback for: ${latitude}, ${longitude}`,
  );

  // Check if coordinates are within India
  if (latitude >= 8 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
    // Rough approximations for major Indian cities
    if (
      latitude >= 28.4 &&
      latitude <= 28.8 &&
      longitude >= 76.8 &&
      longitude <= 77.3
    ) {
      return "Delhi";
    } else if (
      latitude >= 18.8 &&
      latitude <= 19.3 &&
      longitude >= 72.7 &&
      longitude <= 73.0
    ) {
      return "Mumbai";
    } else if (
      latitude >= 12.8 &&
      latitude <= 13.1 &&
      longitude >= 77.4 &&
      longitude <= 77.8
    ) {
      return "Bangalore";
    } else if (
      latitude >= 22.4 &&
      latitude <= 22.7 &&
      longitude >= 88.2 &&
      longitude <= 88.5
    ) {
      return "Kolkata";
    } else if (
      latitude >= 17.2 &&
      latitude <= 17.6 &&
      longitude >= 78.2 &&
      longitude <= 78.7
    ) {
      return "Hyderabad";
    } else if (
      latitude >= 13.0 &&
      latitude <= 13.2 &&
      longitude >= 80.1 &&
      longitude <= 80.3
    ) {
      return "Chennai";
    } else {
      return "India"; // Generic fallback for India
    }
  }

  // For international coordinates, return a generic location
  return "Your Location";
};

// Helper function for reverse geocoding with multiple fallbacks
const getReverseGeocodedLocation = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  console.log(`🔄 Attempting reverse geocoding for: ${latitude}, ${longitude}`);

  // Check if we're in a hosted environment where external APIs might fail
  const isHostedEnv =
    window.location.hostname.includes("fly.dev") ||
    window.location.hostname.includes("builder.codes");

  if (isHostedEnv) {
    console.log(
      "🌐 Hosted environment - using coordinates instead of geocoding",
    );
    return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  // Method 1: Try Google Maps API via backend proxy
  try {
    console.log("🗺️ Trying Google Maps API via backend proxy...");
    const { getApiBaseUrl } = await import('../config/env');
    const apiBaseUrl = getApiBaseUrl();

    if (apiBaseUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${apiBaseUrl}/google-maps/geocode?latlng=${latitude},${longitude}&language=en&region=IN`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];

          // Extract city from address components
          const cityComponent = result.address_components?.find(
            (component: any) =>
              component.types.includes("locality") ||
              component.types.includes("administrative_area_level_2"),
          );

          const stateComponent = result.address_components?.find(
            (component: any) =>
              component.types.includes("administrative_area_level_1"),
          );

          if (cityComponent) {
            const location =
              stateComponent &&
              cityComponent.long_name !== stateComponent.long_name
                ? `${cityComponent.long_name}, ${stateComponent.long_name}`
                : cityComponent.long_name;
            console.log("✅ Google Maps success:", location);
            return location;
          }
        }
      }
    }
  } catch (error) {
    console.log("❌ Google Maps geocoding failed:", error);
  }

  // Method 2: Try OpenStreetMap with better error handling
  try {
    console.log("🌍 Trying OpenStreetMap API...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Longer timeout for OSM

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "CleanCare-App/1.0",
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.address) {
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.suburb;

        const state = data.address.state;

        if (city) {
          const location = state && city !== state ? `${city}, ${state}` : city;
          console.log("✅ OpenStreetMap success:", location);
          return location;
        } else if (state) {
          console.log("✅ OpenStreetMap success (state only):", state);
          return state;
        }
      }
    }
  } catch (error) {
    console.log("❌ OpenStreetMap geocoding failed:", error);
  }

  // Method 3: Use coordinate-based fallback
  console.log("🎯 Using coordinate-based location detection...");
  return getCoordinateBasedLocation(latitude, longitude);
};

const LaundryIndex = () => {
  const { addNotification } = useNotifications();
  const [currentView, setCurrentView] = useState<
    "home" | "cart" | "bookings" | "booking-confirmed"
  >("home");
  const [previousView, setPreviousView] = useState<
    "home" | "cart" | "bookings"
  >("home");
  const [lastBookingData, setLastBookingData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [showFirst30Notification, setShowFirst30Notification] = useState(false);
  const [showLocationUnavailable, setShowLocationUnavailable] = useState(false);
  const [detectedLocationText, setDetectedLocationText] = useState("");
  const [showAddressSyncNotification, setShowAddressSyncNotification] = useState(false);
  const [addressSyncStatus, setAddressSyncStatus] = useState<'syncing' | 'success' | 'error'>('syncing');
  const [syncedAddressCount, setSyncedAddressCount] = useState(0);

  // Single iOS detection for the entire component
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    // Check if this is a post-login navigation
    const postLoginNavigation = localStorage.getItem("ios_post_login_navigation");
    const authTimestamp = localStorage.getItem("ios_auth_timestamp");
    const isRecentLogin = authTimestamp && (Date.now() - parseInt(authTimestamp)) < 10000;

    if (postLoginNavigation || isRecentLogin) {
      console.log("🍎 Post-login navigation detected - using minimal loading");
      return false; // We'll use a different loading state
    }

    return true;
  });

  // Add a specific loading state for post-login navigation to prevent black screen
  const [isPostLoginLoading, setIsPostLoginLoading] = useState(() => {
    const postLoginNavigation = localStorage.getItem("ios_post_login_navigation");
    const authTimestamp = localStorage.getItem("ios_auth_timestamp");
    const isRecentLogin = authTimestamp && (Date.now() - parseInt(authTimestamp)) < 10000;

    return !!(postLoginNavigation || isRecentLogin);
  });

  // Safety timeout for post-login loading to prevent it from getting stuck
  useEffect(() => {
    if (isPostLoginLoading) {
      console.log("🍎 Post-login loading active - setting safety timeout");
      const safetyTimeout = setTimeout(() => {
        console.log("🍎 Post-login loading safety timeout reached - clearing loading state");
        setIsPostLoginLoading(false);
      }, 3000); // 3 second maximum for post-login loading

      return () => clearTimeout(safetyTimeout);
    }
  }, [isPostLoginLoading]);
  const authService = DVHostingSmsService.getInstance();
  const pushService = PushNotificationService.getInstance();
  const referralService = ReferralService.getInstance();

  // Initialize PWA and check auth state
  useEffect(() => {
    console.log("🔄 LaundryIndex component mounted");

    if (isIOS) {
      console.log("🍎 iOS device detected in LaundryIndex");
      console.log("🍎 User agent:", navigator.userAgent);
      console.log("🍎 Platform:", navigator.platform);
      console.log("🍎 Current loading state:", isInitialLoading);
    }

    initializeApp();
    checkAuthState();
    getUserLocation();
    checkFirst30Notification();

    // Listen for auth events from other tabs or auth persistence
    const handleAuthLogin = (event: CustomEvent) => {
      console.log("🎉 Auth login event received");
      checkAuthState(); // Refresh auth state
    };

    const handleAuthLogout = () => {
      console.log("🚪 Auth logout event received");
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentView("home");
    };

    // Handle referral notifications
    const handleReferralBonus = (event: CustomEvent) => {
      const { bonusCoupon } = event.detail;
      addNotification(
        createSuccessNotification(
          "Referral Bonus Earned! 🎉",
          `You've earned a ${bonusCoupon.discount}% discount coupon (${bonusCoupon.code}) for referring a friend!`,
        ),
      );
    };

    window.addEventListener("auth-login", handleAuthLogin as EventListener);
    window.addEventListener("auth-logout", handleAuthLogout);
    window.addEventListener(
      "referralBonusAwarded",
      handleReferralBonus as EventListener,
    );

    // Handle iOS session restoration
    const handleIOSSessionRestore = () => {
      console.log("📱 iOS session restoration event received");
      checkAuthState(); // Refresh auth state from localStorage
    };

    window.addEventListener("ios-session-restored", handleIOSSessionRestore);

    // iOS-specific: Handle potential auth persistence issues after navigation
    let iosCleanupFunctions: (() => void)[] = [];

    if (isIOS) {
      // More aggressive iOS auth checking after navigation
      const handleIOSVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Always check auth state when page becomes visible on iOS, not just when logged out
          setTimeout(() => {
            console.log("🍎 iOS visibility change detected - rechecking auth state");
            checkAuthState();
          }, 100); // Reduced delay for faster response
        }
      };

      const handleIOSFocus = () => {
        // Always check auth on focus for iOS, regardless of current login state
        setTimeout(() => {
          console.log("🍎 iOS focus detected - rechecking auth state");
          checkAuthState();
        }, 100); // Reduced delay for faster response
      };

      // Also check auth state immediately on page load for iOS
      const handleIOSPageShow = () => {
        setTimeout(() => {
          console.log("🍎 iOS page show detected - rechecking auth state");
          checkAuthState();
        }, 200);
      };

      document.addEventListener('visibilitychange', handleIOSVisibilityChange);
      window.addEventListener('focus', handleIOSFocus);
      window.addEventListener('pageshow', handleIOSPageShow);

      // Additional aggressive check after initial load for iOS
      setTimeout(() => {
        if (isIOS) {
          console.log("🍎 iOS additional auth check after page load");
          checkAuthState();
        }
      }, 1000);

      // Check for post-login navigation flag
      const postLoginNavigation = localStorage.getItem("ios_post_login_navigation");
      if (postLoginNavigation && isIOS) {
        console.log("🍎 iOS post-login navigation detected - forcing auth check");
        setTimeout(() => {
          checkAuthState();
          localStorage.removeItem("ios_post_login_navigation");
          // Clear post-login loading state after auth check
          setTimeout(() => {
            setIsPostLoginLoading(false);
          }, 200);
        }, 100);
      }

      iosCleanupFunctions = [
        () => document.removeEventListener('visibilitychange', handleIOSVisibilityChange),
        () => window.removeEventListener('focus', handleIOSFocus),
        () => window.removeEventListener('pageshow', handleIOSPageShow)
      ];
    }

    return () => {
      window.removeEventListener(
        "auth-login",
        handleAuthLogin as EventListener,
      );
      window.removeEventListener("auth-logout", handleAuthLogout);
      window.removeEventListener(
        "referralBonusAwarded",
        handleReferralBonus as EventListener,
      );
      window.removeEventListener(
        "ios-session-restored",
        handleIOSSessionRestore,
      );

      // Clean up iOS-specific listeners
      iosCleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  const initializeApp = async () => {
    console.log("🚀 Initializing app...");

    // For iOS, use multiple fallback mechanisms to ensure loading completes
    const endLoading = () => {
      console.log("✅ App initialization complete - hiding loader");
      setIsInitialLoading(false);
    };

    // Primary timer - standard 2 second delay
    const primaryTimer = setTimeout(endLoading, 2000);

    // iOS fallback mechanisms
    if (isIOS) {
      console.log("🍎 iOS detected - adding fallback loading mechanisms");

      // Fallback timer 1: 3 seconds (in case primary timer fails)
      const fallbackTimer1 = setTimeout(() => {
        if (isInitialLoading) {
          console.log("🍎 Primary timer failed - using fallback 1");
          endLoading();
        }
      }, 3000);

      // Fallback timer 2: 5 seconds (last resort)
      const fallbackTimer2 = setTimeout(() => {
        if (isInitialLoading) {
          console.log("🍎 All timers failed - using emergency fallback");
          endLoading();
        }
      }, 5000);

      // iOS specific: Also trigger on page visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isInitialLoading) {
          setTimeout(() => {
            if (isInitialLoading) {
              console.log("🍎 Visibility-based fallback triggered");
              endLoading();
            }
          }, 500);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup function to remove event listeners
      const cleanup = () => {
        clearTimeout(primaryTimer);
        clearTimeout(fallbackTimer1);
        clearTimeout(fallbackTimer2);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };

      // Auto cleanup after 10 seconds
      setTimeout(cleanup, 10000);
    }

    try {
      // Initialize PWA features
      await pushService.initializePWA();

      // Add manifest link to head if not present
      if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement("link");
        manifestLink.rel = "manifest";
        manifestLink.href = "/manifest.json";
        document.head.appendChild(manifestLink);
      }

      // Add theme color meta tag
      if (!document.querySelector('meta[name="theme-color"]')) {
        const themeColorMeta = document.createElement("meta");
        themeColorMeta.name = "theme-color";
        themeColorMeta.content = "#C46DD8";
        document.head.appendChild(themeColorMeta);
      }

      console.log("✅ PWA initialization complete");

      // For iOS, trigger immediate loading end if PWA init is fast enough
      if (isIOS) {
        setTimeout(() => {
          if (isInitialLoading) {
            console.log("🍎 PWA-based loading completion");
            endLoading();
          }
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Error during app initialization:", error);
      // Don't let initialization errors block the UI
      setTimeout(endLoading, 1000);
    }
  };

  const checkFirst30Notification = () => {
    // Check if we should show FIRST30 notification for new users
    const shouldShow = localStorage.getItem("show_first30_notification");
    if (shouldShow === "true") {
      // Show notification with a slight delay for better UX
      setTimeout(() => {
        setShowFirst30Notification(true);
      }, 1000);
      // Clear the flag so it only shows once
      localStorage.removeItem("show_first30_notification");
    }
  };

  const checkAuthState = async () => {
    try {
      console.log("🔍 Checking authentication state...");
      console.log("🔍 Current loading state:", isInitialLoading);

      // iOS-specific: Try to restore auth from iOS backups if main storage is empty
      if (isIOS) {
        console.log("🍎 iOS checkAuthState - current state:", {
          isInitialLoading,
          isLoggedIn,
          hasCurrentUser: !!currentUser
        });
      }

      // Check if this is a post-login check
      const postLoginNavigation = localStorage.getItem("ios_post_login_navigation");
      const authTimestamp = localStorage.getItem("ios_auth_timestamp");
      const isRecentLogin = authTimestamp && (Date.now() - parseInt(authTimestamp)) < 10000; // Within 10 seconds

      if (isIOS) {
        // Import iOS auth restoration utility
        const { restoreIosAuth, clearIosLogoutFlag } = await import("../utils/iosAuthFix");

        // Clear any logout flags to ensure restoration works
        clearIosLogoutFlag();

        // If this is a recent login, skip restoration to avoid conflicts
        if (!isRecentLogin) {
          const restored = await restoreIosAuth();
          if (restored) {
            console.log("🍎 iOS auth restored successfully during check");
          }
        } else {
          console.log("🍎 Skipping iOS auth restoration - recent login detected");
        }
      }

      // First, always check localStorage directly for auth data
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("cleancare_auth_token");
      const userStr =
        localStorage.getItem("current_user") ||
        localStorage.getItem("cleancare_user");

      // If we have both token and user data, restore session immediately
      if (token && userStr) {
        try {
          const storedUser = JSON.parse(userStr);
          if (
            storedUser &&
            (storedUser.phone || storedUser.id || storedUser._id)
          ) {
            setCurrentUser(storedUser);
            setIsLoggedIn(true);
            console.log("✅ User session restored from localStorage:", {
              phone: storedUser.phone,
              name: storedUser.name,
              id: storedUser.id || storedUser._id,
              isRecentLogin: isRecentLogin || postLoginNavigation
            });

            // For iOS: If we successfully restore auth, also clear loading states as safety net
            if (isIOS) {
              console.log("🍎 Auth restored on iOS - clearing loading states as safety net");
              setTimeout(() => {
                if (isInitialLoading) setIsInitialLoading(false);
                if (isPostLoginLoading) setIsPostLoginLoading(false);
              }, 300);
            }

            // Ensure auth service has the latest data
            authService.setCurrentUser(storedUser, token);

            // For iOS, also trigger an auth event to update other components
            if (isIOS) {
              window.dispatchEvent(new CustomEvent("auth-login", {
                detail: {
                  user: storedUser,
                  isPostLogin: !!postLoginNavigation,
                  timestamp: Date.now()
                }
              }));
            }

            // Clean up temporary flags after successful auth state restoration
            if (postLoginNavigation) {
              setTimeout(() => {
                localStorage.removeItem("ios_post_login_navigation");
                localStorage.removeItem("ios_auth_timestamp");
              }, 2000);
            }

            // Check location availability after successful login
            checkLocationAfterLogin(storedUser);

            return; // Exit early - user is authenticated
          }
        } catch (parseError) {
          console.warn("��️ Error parsing stored user data:", parseError);
        }
      }

      // Fallback: check auth service state
      const user = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated();

      if (isAuth && user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        console.log("✅ User authentication confirmed via auth service:", {
          phone: user.phone,
          name: user.name,
          isVerified: user.isVerified,
        });

        // For iOS: If we successfully restore auth via service, also clear loading states as safety net
        if (isIOS) {
          console.log("🍎 Auth service restored on iOS - clearing loading states as safety net");
          setTimeout(() => {
            if (isInitialLoading) setIsInitialLoading(false);
            if (isPostLoginLoading) setIsPostLoginLoading(false);
          }, 300);
        }

        // For iOS, also trigger an auth event
        if (isIOS) {
          window.dispatchEvent(new CustomEvent("auth-login", {
            detail: { user }
          }));
        }
      } else {
        // For iOS, be more aggressive about auth checking but don't auto-logout
        if (isIOS && !isLoggedIn) {
          console.log("🍎 iOS device - attempting comprehensive auth restoration");

          // Try one more time with a delay for iOS
          setTimeout(async () => {
            const { restoreIosAuth } = await import("../utils/iosAuthFix");
            const restored = await restoreIosAuth();
            if (restored) {
              console.log("🍎 iOS delayed auth restoration successful");
              // Recheck auth state after restoration
              checkAuthState();
            }
          }, 500);
        }

        // Only log state, never automatically clear login
        console.log("ℹ️ No valid authentication data found");
        console.log("🔒 Preserving current login state to prevent auto-logout");
        // Don't call setIsLoggedIn(false) or setCurrentUser(null) here
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      // Never auto-logout on errors - always preserve existing state
      console.warn("🔒 Preserving current auth state despite error");
    }
  };

  const getUserLocation = async () => {
    setCurrentLocation("Detecting location...");

    if (!navigator.geolocation) {
      setCurrentLocation("India");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Store coordinates for later use
          console.log(`📍 Location coordinates: ${latitude}, ${longitude}`);

          // Set coordinates immediately for a quick response
          setCurrentLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);

          // Try to get readable address with multiple fallbacks
          try {
            const displayLocation = await getReverseGeocodedLocation(
              latitude,
              longitude,
            );

            if (displayLocation && displayLocation.trim()) {
              setCurrentLocation(displayLocation);
              console.log("✅ Final location set:", displayLocation);
            } else {
              console.log("🔍 Using coordinate fallback");
              setCurrentLocation(
                `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
              );
            }
          } catch (geocodeError) {
            console.warn("Geocoding failed, using coordinates:", geocodeError);
            setCurrentLocation(
              `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
            );
          }
        } catch (error) {
          console.error("Location processing error:", error);
          setCurrentLocation("Location unavailable");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setCurrentLocation("Location access denied");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000,
      },
    );
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);

    // Return to the previous view instead of always going to home
    const targetView = previousView || "home";
    setCurrentView(targetView);

    console.log("✅ User logged in successfully:", user.name || user.phone);
    console.log("📍 Redirecting to:", targetView);

    // Sync addresses across devices
    syncAddressesAfterLogin();

    // Check if this is a first-time user for FIRST30 notification
    const isFirstTime = referralService.isFirstTimeUser(user);
    if (isFirstTime && targetView === "home") {
      // Show FIRST30 notification for new users after a short delay
      setTimeout(() => {
        setShowFirst30Notification(true);
      }, 2000);
    }

    // Add success notification
    addNotification(
      createSuccessNotification(
        "Welcome!",
        `Hello ${user.name || user.phone}, you're now logged in.`,
      ),
    );

    // Check location availability after login
    checkLocationAfterLogin(user);
  };

  // Sync addresses across devices after login
  const syncAddressesAfterLogin = async () => {
    try {
      // Show syncing notification
      setShowAddressSyncNotification(true);
      setAddressSyncStatus('syncing');

      const { AddressService } = await import("@/services/addressService");
      const addressService = AddressService.getInstance();

      // Get addresses before and after sync to compare
      const beforeSync = await addressService.getUserAddresses();
      const beforeCount = Array.isArray(beforeSync.data) ? beforeSync.data.length : 0;

      await addressService.syncAddressesAfterLogin();

      const afterSync = await addressService.getUserAddresses();
      const afterCount = Array.isArray(afterSync.data) ? afterSync.data.length : 0;

      const newAddressCount = Math.max(0, afterCount - beforeCount);

      setSyncedAddressCount(afterCount);
      setAddressSyncStatus('success');

      console.log(`✅ Address synchronization completed. ${afterCount} total addresses available.`);

      // If no addresses were synced, hide notification after short delay
      if (afterCount === 0) {
        setTimeout(() => {
          setShowAddressSyncNotification(false);
        }, 2000);
      }
    } catch (error) {
      console.warn("⚠️ Address synchronization failed after login:", error);
      setAddressSyncStatus('error');
    }
  };

  // Check location availability after user logs in
  const checkLocationAfterLogin = async (user: any) => {
    try {
      console.log('📍 Checking location availability after login for user:', user.phone || user.id);

      // Only check if user is authenticated and hasn't been checked this session
      if (!user || loginLocationChecker.hasCheckedLocation()) {
        return;
      }

      const locationResult = await loginLocationChecker.checkLocationAfterLogin();

      if (locationResult && !locationResult.isInServiceArea) {
        console.log('🚫 User location not in service area, showing popup');
        setDetectedLocationText(locationResult.detectedLocation);
        setShowLocationUnavailable(true);
      } else if (locationResult && locationResult.isInServiceArea) {
        console.log('✅ User location is in service area');
      }
    } catch (error) {
      console.error('❌ Error checking location after login:', error);
    }
  };

  const handleLogout = () => {
    // Import iOS fixes and clear state for iPhone compatibility
    import("../utils/iosAuthFix").then(({ clearIosAuthState }) => {
      clearIosAuthState();
    });

    authService.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView("home");
    console.log("✅ User logged out");

    // Add logout notification
    addNotification(
      createSuccessNotification(
        "Goodbye!",
        "You have been logged out successfully.",
      ),
    );
  };

  const handleViewCart = () => {
    setCurrentView("cart");
  };

  const handleViewBookings = () => {
    if (!currentUser) {
      // Show auth modal instead of redirecting to auth view
      console.log("User not authenticated, showing auth modal");
      setPreviousView("bookings");
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView("bookings");
  };

  const handleLoginRequired = (fromView: "cart" | "bookings" = "cart") => {
    setPreviousView(fromView);
    setIsAuthModalOpen(true);
  };

  const [isProcessingGlobalCheckout, setIsProcessingGlobalCheckout] =
    useState(false);

  const handleProceedToCheckout = async (cartData: any) => {
    // Prevent multiple submissions at the parent level too
    if (isProcessingGlobalCheckout) {
      console.log("⚠️ Global checkout already in progress, ignoring duplicate");
      return;
    }

    // Check if user is authenticated first
    if (!currentUser) {
      console.log("User not authenticated, showing auth modal");
      setIsAuthModalOpen(true);
      return;
    }

    setIsProcessingGlobalCheckout(true);
    console.log("Processing checkout for authenticated user:", cartData);

    // Add loading notification
    addNotification(
      createSuccessNotification(
        "Processing Order",
        "Creating your booking, please wait...",
      ),
    );

    try {
      // Import both booking helpers and service
      const { BookingService } = await import("../services/bookingService");
      const { bookingHelpers } = await import(
        "../integrations/mongodb/bookingHelpers"
      );

      const bookingService = BookingService.getInstance();

      // Prepare services array for MongoDB with quantities
      const servicesArray =
        cartData.services?.map((service: any) => {
          if (typeof service === "string") {
            return service;
          }
          return service.quantity > 1
            ? `${service.name} x${service.quantity}`
            : service.name;
        }) || [];

      // Prepare detailed services for confirmation
      const detailedServices =
        cartData.services?.map((service: any) => ({
          name: typeof service === "string" ? service : service.name,
          quantity: typeof service === "object" ? service.quantity || 1 : 1,
          price: typeof service === "object" ? service.price || 0 : 0,
        })) || [];

      // Prepare item prices for accurate booking history
      const itemPrices = detailedServices.map((service) => ({
        service_name: service.name,
        quantity: service.quantity,
        unit_price: service.price,
        total_price: service.price * service.quantity,
      }));

      // Create booking data for MongoDB backend
      const mongoBookingData = {
        customer_id: currentUser._id || currentUser.id,
        service: servicesArray[0] || "Laundry Service",
        service_type: "laundry",
        services: servicesArray,
        scheduled_date: cartData.pickupDate,
        scheduled_time: cartData.pickupTime,
        delivery_date: cartData.deliveryDate,
        delivery_time: cartData.deliveryTime,
        provider_name: "CleanCare Pro",
        address:
          typeof cartData.address === "string"
            ? cartData.address
            : cartData.address?.fullAddress || "",
        coordinates: cartData.address?.coordinates || { lat: 0, lng: 0 },
        additional_details: cartData.instructions || "",
        total_price: cartData.totalAmount + (cartData.charges_breakdown?.discount || 0),
        discount_amount: cartData.charges_breakdown?.discount || 0,
        final_amount: cartData.totalAmount,
        special_instructions: cartData.instructions || "",
        charges_breakdown: {
          base_price: cartData.charges_breakdown?.base_price || cartData.totalAmount,
          tax_amount: cartData.charges_breakdown?.tax_amount || 0,
          service_fee: cartData.charges_breakdown?.service_fee || 0,
          delivery_fee: cartData.charges_breakdown?.delivery_fee || 0,
          handling_fee: cartData.charges_breakdown?.handling_fee || 0,
          discount: cartData.charges_breakdown?.discount || 0,
        },
        // Save item prices for accurate booking history display
        item_prices: itemPrices,
      };

      // Save to MongoDB backend first
      console.log("💾 Saving to MongoDB backend...");
      console.log(
        "📤 MongoDB booking data:",
        JSON.stringify(mongoBookingData, null, 2),
      );
      const mongoResult = await bookingHelpers.createBooking(mongoBookingData);

      if (mongoResult.data) {
        console.log(
          "✅ Booking saved to MongoDB:",
          mongoResult.data.custom_order_id ||
            mongoResult.data._id ||
            "unknown_id",
        );

        // Google Sheets integration removed

        // Also save using booking service for local storage backup
        const localBookingData = {
          userId: currentUser._id || currentUser.id || currentUser.phone,
          services: servicesArray,
          totalAmount: cartData.totalAmount,
          status: "pending" as const,
          pickupDate: cartData.pickupDate,
          deliveryDate: cartData.deliveryDate ?? cartData.pickupDate,
          pickupTime: cartData.pickupTime,
          deliveryTime: cartData.deliveryTime ?? cartData.pickupTime,
          address:
            typeof cartData.address === "string"
              ? cartData.address
              : cartData.address?.fullAddress ||
                JSON.stringify(cartData.address),
          contactDetails: {
            phone: cartData.phone || currentUser.phone,
            name: currentUser.full_name || currentUser.name || "User",
            instructions: cartData.instructions,
          },
          paymentStatus: "pending" as const,
        };

        const localResult = await bookingService.createBooking(
          localBookingData,
          itemPrices,
        );
        console.log("��� Local booking result:", localResult);

        // Store booking data for confirmation screen
        const confirmationData = {
          bookingId:
            mongoResult.data.custom_order_id ||
            mongoResult.data._id ||
            `local_${Date.now()}`,
          custom_order_id: mongoResult.data.custom_order_id, // Add custom_order_id field
          services: detailedServices, // Use detailed services with quantities
          totalAmount: cartData.totalAmount,
          pickupDate: cartData.pickupDate,
          pickupTime: cartData.pickupTime,
          address: cartData.address,
          customerName: currentUser.full_name || currentUser.name || "Customer",
          customerPhone: currentUser.phone,
        };

        setLastBookingData(confirmationData);

        // Show success message
        addNotification(
          createSuccessNotification(
            "Order Confirmed!",
            `Your order has been placed successfully! Booking ID: ${confirmationData.bookingId ? confirmationData.bookingId.slice(-6) : "N/A"}`,
          ),
        );

        // Clear cart and form data
        localStorage.removeItem("laundry_cart");
        localStorage.removeItem("mobile_service_cart");
        localStorage.removeItem("service_cart");
        localStorage.removeItem("cleancare_cart");
        localStorage.removeItem("laundry_booking_form");
        localStorage.removeItem("cleancare_booking_form");
        localStorage.removeItem("user_bookings"); // Clear cached bookings

        // Clear any cached cart state
        const clearCartEvent = new CustomEvent("clearCart");
        window.dispatchEvent(clearCartEvent);

        // Trigger booking history refresh
        const refreshBookingsEvent = new CustomEvent("refreshBookings");
        window.dispatchEvent(refreshBookingsEvent);

        // Show booking confirmation screen
        setCurrentView("booking-confirmed");
      } else {
        // If MongoDB fails, still try to save locally
        console.warn(
          "❌ MongoDB booking failed, saving locally:",
          mongoResult.error,
        );

        const localBookingData = {
          userId: currentUser._id || currentUser.id || currentUser.phone,
          services: servicesArray,
          totalAmount: cartData.totalAmount,
          status: "pending" as const,
          pickupDate: cartData.pickupDate,
          deliveryDate: cartData.deliveryDate,
          pickupTime: cartData.pickupTime,
          deliveryTime: cartData.deliveryTime,
          address: cartData.address,
          contactDetails: {
            phone: cartData.phone || currentUser.phone,
            name: currentUser.full_name || currentUser.name || "User",
            instructions: cartData.instructions,
          },
          paymentStatus: "pending" as const,
          // Add item prices for accurate history display
          item_prices: itemPrices,
        };

        const localResult = await bookingService.createBooking(
          localBookingData,
          itemPrices,
        );
        console.log("📝 Fallback local booking result:", localResult);

        if (localResult.success) {
          // Google Sheets fallback removed

          // Store booking data for confirmation screen
          const confirmationData = {
            bookingId: `local_${Date.now()}`,
            custom_order_id:
              localResult.data?.custom_order_id ||
              `CC${Date.now().toString().slice(-6)}`, // Add custom_order_id for local bookings
            services: detailedServices, // Use detailed services with quantities
            totalAmount: cartData.totalAmount,
            pickupDate: cartData.pickupDate,
            pickupTime: cartData.pickupTime,
            address: cartData.address,
            customerName:
              currentUser.full_name || currentUser.name || "Customer",
            customerPhone: currentUser.phone,
          };

          setLastBookingData(confirmationData);

          // Show success but mention it will sync later
          addNotification(
            createSuccessNotification(
              "Order Saved!",
              "Your order has been saved successfully!",
            ),
          );

          // Clear cart
          localStorage.removeItem("laundry_cart");
          localStorage.removeItem("mobile_service_cart");
          localStorage.removeItem("service_cart");
          localStorage.removeItem("cleancare_cart");

          // Show booking confirmation screen
          setCurrentView("booking-confirmed");
        } else {
          console.error("❌ Local booking also failed:", localResult.error);

          // Google Sheets backup removed - continue with local-only booking

          throw new Error(
            localResult.error ||
              mongoResult.error?.message ||
              "Failed to create booking",
          );
        }
      }
    } catch (error) {
      console.error("Checkout failed:", error);

      let errorMessage = "Failed to place order. Please try again.";
      let errorTitle = "Order Failed";

      if (error instanceof Error) {
        if (error.message.includes("User ID not found")) {
          errorTitle = "Authentication Issue";
          errorMessage = "Please sign in again to place your order.";
        } else if (
          error.message.includes("Network error") ||
          error.message.includes("fetch")
        ) {
          errorTitle = "Connection Issue";
          errorMessage = "Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      addNotification(createErrorNotification(errorTitle, errorMessage));
    } finally {
      setIsProcessingGlobalCheckout(false);
    }
  };

  // Show splash loader on initial load or post-login navigation
  if (isInitialLoading || isPostLoginLoading) {
    const message = isPostLoginLoading ? "Completing sign in..." : "Initializing Laundrify...";

    return (
      <LaundrifySplashLoader
        isVisible={true}
        message={message}
        onDismiss={() => {
          console.log("🍎 User manually dismissed loading screen");
          if (isInitialLoading) setIsInitialLoading(false);
          if (isPostLoginLoading) setIsPostLoginLoading(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Referral Code Handler - handles URL-based referrals */}
      <ReferralCodeHandler
        currentUser={currentUser}
        onReferralApplied={(discountPercentage) => {
          console.log(`Referral applied with ${discountPercentage}% discount`);
          // Refresh user data to show new discount
          checkAuthState();
        }}
      />

      {currentView === "home" && (
        <>
          {/* FIRST30 Offer Notification for New Users */}
          <First30OfferNotification
            isVisible={showFirst30Notification}
            onDismiss={() => setShowFirst30Notification(false)}
            userName={currentUser?.name}
          />

          {/* Referral Discount Banner */}
          {currentUser && (
            <div className="px-4 pt-4 bg-gradient-to-r from-laundrify-purple to-laundrify-pink">
              <ReferralDiscountBanner user={currentUser} />
            </div>
          )}

          <ResponsiveLaundryHome
            currentUser={currentUser}
            userLocation={currentLocation}
            onLoginSuccess={handleLoginSuccess}
            onViewCart={handleViewCart}
            onViewBookings={handleViewBookings}
            onLogout={handleLogout}
            onLoginRequired={() => setIsAuthModalOpen(true)}
          />
        </>
      )}

      {/* Authentication Modal Overlay */}
      <PhoneOtpAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          // Reset previousView to prevent unintended navigation
          setPreviousView("home");
        }}
        onSuccess={(user) => {
          handleLoginSuccess(user);
          setIsAuthModalOpen(false);
          // Navigate to the view they were trying to access
          if (previousView === "cart" || previousView === "bookings") {
            setCurrentView(previousView);
          }
          setPreviousView("home");
        }}
      />

      {currentView === "bookings" && (
        <EnhancedBookingHistory
          currentUser={currentUser}
          onBack={() => setCurrentView("home")}
          onLoginRequired={() => handleLoginRequired("bookings")}
        />
      )}

      {currentView === "cart" && (
        <LaundryCart
          onBack={() => setCurrentView("home")}
          onProceedToCheckout={handleProceedToCheckout}
          onLoginRequired={() => handleLoginRequired("cart")}
          currentUser={currentUser}
        />
      )}

      {currentView === "booking-confirmed" && lastBookingData && (
        <BookingConfirmed
          bookingData={lastBookingData}
          onGoHome={() => setCurrentView("home")}
          onViewBookings={() => setCurrentView("bookings")}
        />
      )}

      {/* Service Area Unavailable Modal */}
      <LocationUnavailableModal
        isOpen={showLocationUnavailable}
        onClose={() => setShowLocationUnavailable(false)}
        detectedLocation={detectedLocationText}
        onExplore={() => {
          console.log('🔍 User chose to explore available services');
          setShowLocationUnavailable(false);
          // User can continue using the app normally
        }}
        onNavigateHome={() => {
          console.log('🏠 User navigating to home from location unavailable modal');
          setCurrentView('home');
        }}
      />

      {/* Address Sync Notification */}
      <AddressSyncNotification
        isVisible={showAddressSyncNotification}
        onClose={() => setShowAddressSyncNotification(false)}
        addressCount={syncedAddressCount}
        syncStatus={addressSyncStatus}
      />
    </div>
  );
};

export default LaundryIndex;
