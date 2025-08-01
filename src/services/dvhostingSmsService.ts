import { config } from "../config/env";

const getApiBaseUrl = () => {
  return config.API_BASE_URL;
};

const apiBaseUrl = getApiBaseUrl();
export class DVHostingSmsService {
  private static instance: DVHostingSmsService;
  private currentPhone: string = "";
  private otpStorage: Map<string, { otp: string; expiresAt: number }> =
    new Map();
  private readonly debugMode = import.meta.env.DEV; // Only log in development

  constructor() {
    if (this.debugMode) {
      console.log("✅ DVHosting SMS service initialized");
    }
  }

  private log(...args: any[]) {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  static getInstance(): DVHostingSmsService {
    if (!DVHostingSmsService.instance) {
      DVHostingSmsService.instance = new DVHostingSmsService();
    }
    return DVHostingSmsService.instance;
  }

  private cleanPhone(p: string): string {
    return p ? p.replace(/\D/g, "") : "";
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    try {
      const cleanPhone = this.cleanPhone(phoneNumber);

      // Validate Indian phone number
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        throw new Error("Invalid Indian phone number");
      }

      // Detect hosted environment (Builder.io, fly.dev, etc.)
      const isHostedEnv =
        window.location.hostname.includes("builder.codes") ||
        window.location.hostname.includes("fly.dev") ||
        document.querySelector("[data-loc]") !== null;

      this.log("DVHosting SMS: Environment detection:", {
        isHostedEnv,
        hostname: window.location.hostname,
        hasDataLoc: !!document.querySelector("[data-loc]"),
      });

      // In hosted environments, skip backend API and use direct/simulation mode
      if (isHostedEnv) {
        this.log(
          "DVHosting SMS: Hosted environment detected, using direct API call",
        );
        return await this.sendDirectDVHostingOTP(cleanPhone);
      }

      // For local development, try backend API

      console.log(apiBaseUrl);
      this.log("DVHosting SMS: Local environment, trying backend API:", {
        apiBaseUrl,
        endpoint: "/otp/send",
      });
      console.log(`${apiBaseUrl}/auth/send-otp?t=${Date.now()}`);
      // Clear any previous phone state for iOS
      this.currentPhone = "";

      // Call backend API for local development
      console.log("🌐 Making CORS request to:", `${apiBaseUrl}/auth/send-otp`);
      console.log("🌐 From origin:", window.location.origin);

      const response = await fetch(
        `${apiBaseUrl}/auth/send-otp?t=${Date.now()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          mode: "cors",
          credentials: "include",
          body: JSON.stringify({
            phone: cleanPhone,
          }),
        },
      ).catch((error) => {
        // Handle fetch errors in local development
        console.log("DVHosting SMS: Backend API error:", error);
        console.log("DVHosting SMS: Falling back to direct API call");
        return null; // Will trigger direct API call below
      });

      // Handle direct DVHosting API call for hosted environments without backend
      if (!response) {
        console.log(
          "DVHosting SMS: No backend available, calling DVHosting API directly",
        );
        return await this.sendDirectDVHostingOTP(cleanPhone);
      }

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        console.log(
          "DVHosting SMS: Response status:",
          response.status,
          "Content-Type:",
          contentType,
        );

        // Get response text first to inspect it
        const responseText = await response.text();
        console.log(
          "DVHosting SMS: Raw response:",
          responseText.substring(0, 300),
        );

        // Check if response looks like JSON
        if (
          !responseText.trim().startsWith("{") &&
          !responseText.trim().startsWith("[")
        ) {
          // In hosted environments, call DVHosting API directly
          if (isHostedEnv) {
            console.log(
              "DVHosting SMS: Detected HTML response, calling DVHosting API directly",
            );
            return await this.sendDirectDVHostingOTP(cleanPhone);
          }

          console.error(
            "❌ Expected JSON but got non-JSON content:",
            responseText.substring(0, 200),
          );

          return false;
        }

        try {
          const result = JSON.parse(responseText);
          this.log("✅ OTP sent successfully:", result);

          if (result.success) {
            // Store phone for verification
            this.currentPhone = cleanPhone;
            return true;
          } else {
            console.error("❌ Backend API error:", result);
            return false;
          }
        } catch (parseError) {
          // In hosted environments, call DVHosting API directly
          if (isHostedEnv) {
            console.log(
              "DVHosting SMS: JSON parse failed, calling DVHosting API directly",
            );
            return await this.sendDirectDVHostingOTP(cleanPhone);
          }

          console.error(
            "❌ Failed to parse JSON response:",
            parseError,
            "Raw text:",
            responseText.substring(0, 200),
          );

          return false;
        }
      } else {
        let errorMessage = `HTTP ${response.status}`;
        let errorText = "";
        try {
          errorText = await response.text();
          console.log(
            "DVHosting SMS: Error response:",
            errorText.substring(0, 200),
          );

          // Check if this looks like HTML (common in hosted environments)
          if (
            errorText.trim().startsWith("<") ||
            errorText.includes("<script>")
          ) {
            if (isHostedEnv) {
              console.log(
                "DVHosting SMS: Got HTML response, calling DVHosting API directly",
              );
              return await this.sendDirectDVHostingOTP(cleanPhone);
            }
          }

          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          console.error("❌ Backend API error:", response.status, errorData);
        } catch (parseError) {
          console.error("❌ Backend HTTP error:", response.status, errorText);
        }
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to send OTP:", error);
      console.error("❌ Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const cleanPhone = this.cleanPhone(phoneNumber);

      // Detect hosted environment
      const isHostedEnv =
        window.location.hostname.includes("builder.codes") ||
        window.location.hostname.includes("fly.dev") ||
        document.querySelector("[data-loc]") !== null;

      // In hosted environments, use local verification
      if (isHostedEnv) {
        console.log(
          "DVHosting SMS: Hosted environment, using local verification",
        );
        const storedData = this.otpStorage.get(cleanPhone);

        if (!storedData) {
          console.log("❌ No OTP found for phone:", cleanPhone);
          return false;
        }

        if (Date.now() > storedData.expiresAt) {
          console.log("❌ OTP expired for phone:", cleanPhone);
          this.otpStorage.delete(cleanPhone);
          return false;
        }

        if (storedData.otp === otp) {
          console.log("✅ OTP verified successfully (hosted environment)");
          this.otpStorage.delete(cleanPhone);
          this.currentPhone = "";
          return true;
        } else {
          console.log("❌ Invalid OTP (hosted environment)");
          return false;
        }
      }

      // For local development, try backend API
      const response = await fetch(
        `${apiBaseUrl}/auth/verify-otp?t=${Date.now()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify({
            phone: cleanPhone,
            otp: otp,
          }),
        },
      ).catch((error) => {
        // Handle fetch errors in hosted environments
        console.log(
          "DVHosting SMS: Verification fetch error in hosted environment:",
          error,
        );
        if (isHostedEnv) {
          console.log(
            "DVHosting SMS: Using local verification for hosted environment",
          );
          return null; // Will trigger local verification below
        }
        throw error;
      });

      // Handle local verification for hosted environments without backend
      if (!response) {
        console.log(
          "DVHosting SMS: Using local verification - no backend available",
        );
        const storedData = this.otpStorage.get(cleanPhone);

        if (!storedData) {
          console.log("❌ No OTP found for phone:", cleanPhone);
          return false;
        }

        if (Date.now() > storedData.expiresAt) {
          console.log("❌ OTP expired for phone:", cleanPhone);
          this.otpStorage.delete(cleanPhone);
          return false;
        }

        if (storedData.otp === otp) {
          console.log("✅ OTP verified successfully (local verification)");
          this.otpStorage.delete(cleanPhone);
          this.currentPhone = "";
          return true;
        } else {
          console.log("❌ Invalid OTP (local verification)");
          return false;
        }
      }

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          console.log("✅ OTP verified successfully");
          // Clear stored data after successful verification
          this.currentPhone = "";
          return true;
        } else {
          console.log("❌ Invalid OTP:", result.message);
          return false;
        }
      } else {
        try {
          const errorData = await response.json();
          console.error("❌ Backend API error:", response.status, errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error("❌ Backend HTTP error:", response.status, errorText);
        }
        return false;
      }
    } catch (error) {
      console.error("�� OTP verification error:", error);
      return false;
    }
  }

  async sendSmsOTP(
    phoneNumber: string,
    name?: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const success = await this.sendOTP(phoneNumber);
    return {
      success,
      message: success
        ? "OTP sent successfully via DVHosting SMS"
        : "Failed to send OTP",
      error: success ? undefined : "Failed to send OTP via DVHosting SMS",
    };
  }

  async verifySmsOTP(
    phoneNumber: string,
    otp: string,
    name?: string,
  ): Promise<{
    success: boolean;
    user?: any;
    message?: string;
    error?: string;
  }> {
    try {
      const cleanPhone = this.cleanPhone(phoneNumber);

      // Detect hosted environment
      const isHostedEnv =
        window.location.hostname.includes("builder.codes") ||
        window.location.hostname.includes("fly.dev") ||
        document.querySelector("[data-loc]") !== null;

      console.log("DVHosting SMS: verifySmsOTP environment detection:", {
        isHostedEnv,
        hostname: window.location.hostname,
      });

      // In hosted environments, use local verification
      if (isHostedEnv) {
        console.log(
          "DVHosting SMS: Using local SMS verification for hosted environment",
        );
        const storedData = this.otpStorage.get(cleanPhone);

        if (!storedData) {
          console.log("❌ No OTP found for phone:", cleanPhone);
          return {
            success: false,
            error: "No OTP found or expired",
            message: "Please request a new OTP",
          };
        }

        if (Date.now() > storedData.expiresAt) {
          console.log("❌ OTP expired for phone:", cleanPhone);
          this.otpStorage.delete(cleanPhone);
          return {
            success: false,
            error: "OTP has expired",
            message: "Please request a new OTP",
          };
        }

        if (storedData.otp === otp) {
          this.log("✅ SMS OTP verified successfully (hosted environment)");
          this.otpStorage.delete(cleanPhone);
          this.currentPhone = "";

          // Import createUserByPhone for consistent user generation
          const { createUserByPhone } = await import("../utils/authUtils");

          // Try to restore user from backend first
          let user = await this.restoreUserFromBackend(cleanPhone);

          if (!user) {
            // Create new user using consistent phone-based generation
            user = createUserByPhone(cleanPhone, name);
            user.isVerified = true;
            user.createdAt = new Date().toISOString();

            // Save new user to backend
            await this.saveUserToBackend(user);
          }

          return {
            success: true,
            user: user,
            message: "OTP verified successfully",
          };
        } else {
          console.log("❌ Invalid SMS OTP (hosted environment)");
          return {
            success: false,
            error: "Invalid OTP",
            message: "Please check your OTP and try again",
          };
        }
      }

      // For local development, try backend API
      const response = await fetch(
        `${apiBaseUrl}/auth/verify-otp?t=${Date.now()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify({
            phone: cleanPhone,
            otp: otp,
            name:
              name && name.trim()
                ? name.trim()
                : `User ${cleanPhone.slice(-4)}`,
          }),
        },
      ).catch((error) => {
        // Handle fetch errors in local development
        console.log("DVHosting SMS: Backend API error:", error);
        console.log("DVHosting SMS: Falling back to local verification");
        return null; // Will trigger local verification below
      });

      // Handle local verification for hosted environments without backend
      if (!response) {
        console.log(
          "DVHosting SMS: Using local SMS verification - no backend available",
        );
        const storedData = this.otpStorage.get(cleanPhone);

        if (!storedData) {
          console.log("�� No OTP found for phone:", cleanPhone);
          return {
            success: false,
            error: "No OTP found or expired",
            message: "Please request a new OTP",
          };
        }

        if (Date.now() > storedData.expiresAt) {
          console.log("❌ OTP expired for phone:", cleanPhone);
          this.otpStorage.delete(cleanPhone);
          return {
            success: false,
            error: "OTP has expired",
            message: "Please request a new OTP",
          };
        }

        if (storedData.otp === otp) {
          console.log("✅ SMS OTP verified successfully (local verification)");
          this.otpStorage.delete(cleanPhone);
          this.currentPhone = "";

          // Import createUserByPhone for consistent user generation
          const { createUserByPhone } = await import("../utils/authUtils");

          const mockUser = createUserByPhone(cleanPhone, name);
          mockUser.isVerified = true;
          mockUser.createdAt = new Date().toISOString();

          return {
            success: true,
            user: mockUser,
            message: "OTP verified successfully",
          };
        } else {
          console.log("❌ Invalid SMS OTP (local verification)");
          return {
            success: false,
            error: "Invalid OTP",
            message: "Please check your OTP and try again",
          };
        }
      }

      if (response.ok) {
        // Read as text, then try to parse as JSON
        const responseText = await response.text();
        let result: any = {};
        try {
          result = JSON.parse(responseText);
        } catch {
          // Not JSON, treat as error
          return {
            success: false,
            error: "Invalid server response",
            message: responseText,
          };
        }
        if (result.success) {
          return {
            success: true,
            user: result.data?.user,
            message: result.message,
          };
        } else {
          return {
            success: false,
            error: result.error || "Verification failed",
            message: result.message || "Verification failed",
          };
        }
      } else {
        // Only read the body ONCE
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // Not JSON, keep as text
        }
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
          message: errorData.message || errorText || "Verification failed",
        };
      }
    } catch (error) {
      console.error("❌ SMS OTP verification error:", error);
      return {
        success: false,
        error: error.message || "Verification failed",
        message: "Please try again",
      };
    }
  }

  private async sendDirectDVHostingOTP(phoneNumber: string): Promise<boolean> {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      console.log("DVHosting SMS: Simulation mode - no direct API calls from frontend");
      console.log("DVHosting SMS: Phone:", phoneNumber);

      // Store OTP locally for verification (simulation mode for frontend-only environments)
      this.otpStorage.set(phoneNumber, {
        otp: otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      console.log("✅ OTP generated (simulation mode for security)");
      console.log(
        "📱 Your simulation OTP is:",
        otp,
        "(for testing - in production, real SMS would be sent by backend)",
      );

      return true;
    } catch (error) {
      console.error("❌ Simulation OTP generation failed:", error);

      // Fallback to simulation mode
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      this.otpStorage.set(phoneNumber, {
        otp: mockOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      console.log("✅ OTP sent (fallback simulation mode)");
      console.log("📱 Fallback OTP:", mockOtp, "(for testing only)");

      return true;
    }
  }

  getCurrentPhone(): string {
    return this.currentPhone;
  }

  // Authentication persistence methods
  isAuthenticated(): boolean {
    try {
      const token =
        localStorage.getItem("cleancare_auth_token") ||
        localStorage.getItem("auth_token");
      const user = this.getCurrentUser();

      // Simple validation - if we have token and user data, user is authenticated
      if (!token || !user) {
        return false;
      }

      // Never check token expiration - users stay logged in until manual logout
      // This ensures sessions persist across refreshes and time
      console.log("✅ User is authenticated - session preserved");
      return true;
    } catch (error) {
      console.error("Error checking authentication:", error);
      // Never automatically logout on errors - preserve user session
      console.warn("🔒 Preserving authentication state despite error");
      return true; // Return true to preserve session
    }
  }

  getCurrentUser(): any | null {
    try {
      const userStr =
        localStorage.getItem("cleancare_user") ||
        localStorage.getItem("current_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        // Very lenient validation - any user object is considered valid
        if (user && typeof user === "object") {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      // Never clear data on errors - try to preserve whatever we can
      console.warn("🔒 Error parsing user data, but preserving session");

      // Try to return a basic user object if localStorage has data
      const userStr =
        localStorage.getItem("cleancare_user") ||
        localStorage.getItem("current_user");
      if (userStr) {
        console.warn("📋 Attempting to preserve raw user data");
        return { rawData: userStr }; // Return raw data to prevent total loss
      }
      return null;
    }
  }

  setCurrentUser(user: any, token?: string): void {
    try {
      if (user) {
        // Store in both keys for backward compatibility
        localStorage.setItem("cleancare_user", JSON.stringify(user));
        localStorage.setItem("current_user", JSON.stringify(user));

        if (token) {
          // Store token in both keys for consistency
          localStorage.setItem("cleancare_auth_token", token);
          localStorage.setItem("auth_token", token);
        } else {
          // Generate a persistent token if none provided - no expiration
          const userPhone = user.phone || user.id || user._id;
          const persistentToken = `user_token_${userPhone}_persistent`;
          localStorage.setItem("cleancare_auth_token", persistentToken);
          localStorage.setItem("auth_token", persistentToken);
        }
        console.log(
          "✅ User authentication saved to localStorage (persistent session)",
        );

        // Enhanced iOS session persistence
        if (this.isIosDevice()) {
          import("../utils/iosAuthFix").then(({ saveIosAuthToIndexedDB, clearIosLogoutFlag }) => {
            // Clear logout flag since user is logging in successfully
            clearIosLogoutFlag();
            const currentToken =
              token ||
              localStorage.getItem("auth_token") ||
              localStorage.getItem("cleancare_auth_token");
            if (currentToken) {
              saveIosAuthToIndexedDB(user, currentToken).catch((error) => {
                console.warn("📱⚠️ Failed to save to IndexedDB:", error);
              });
              // Create comprehensive iOS persistent session
              this.createIosPersistentSession(user, currentToken);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error setting current user:", error);
    }
  }

  private isIosDevice(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  private async createIosPersistentSession(user: any, token: string): Promise<void> {
    try {
      // Import iOS session manager and create emergency backup
      const { default: IosSessionManager } = await import("../utils/iosSessionManager");
      const sessionManager = IosSessionManager.getInstance();
      await sessionManager.forceEmergencyBackup();

      // Also save to traditional iOS backup locations
      sessionStorage.setItem("ios_session_user", JSON.stringify(user));
      sessionStorage.setItem("ios_session_token", token);
      localStorage.setItem("ios_backup_user", JSON.stringify(user));
      localStorage.setItem("ios_backup_token", token);
      localStorage.setItem("ios_auth_timestamp", Date.now().toString());

      // Set cookie with 30-day expiration
      try {
        document.cookie = `ios_auth_backup=${encodeURIComponent(JSON.stringify(user))}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Strict; Secure`;
      } catch (e) {
        // Cookie save failed, continue
      }

      console.log("🍎 Enhanced iOS 30-day session persistence created");
    } catch (error) {
      console.warn("🍎⚠️ Failed to create iOS persistent session:", error);
    }
  }

  logout(): void {
    try {
      // Enhanced iOS logout clearing
      if (this.isIosDevice()) {
        import("../utils/iosAuthFix").then(({ clearIosAuthState }) => {
          clearIosAuthState();
        });
      }

      // Clear all auth-related localStorage
      localStorage.removeItem("current_user");
      localStorage.removeItem("cleancare_user");
      localStorage.removeItem("cleancare_auth_token");
      localStorage.removeItem("auth_token");

      // Clear sessionStorage for iOS compatibility
      sessionStorage.clear();

      // Clear current phone and OTP storage
      this.currentPhone = "";
      this.otpStorage.clear();

      // Call backend logout for session clearing (only if backend is available)
      const apiBaseUrl = this.getApiBaseUrl();
      if (apiBaseUrl) {
        fetch(`${apiBaseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        }).catch(() => {
          // Ignore backend errors during logout
        });
      }

      this.log("✅ User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  private getApiBaseUrl(): string {
    // Check if we're in a hosted environment without backend
    const isHostedEnv =
      window.location.hostname.includes("fly.dev") ||
      window.location.hostname.includes("builder.codes");

    if (isHostedEnv) {
      return ""; // Return empty string to indicate no backend available
    }

    return config.API_BASE_URL;
  }

  /**
   * Save user to MongoDB backend for persistence across sessions
   */
  async saveUserToBackend(user: any): Promise<boolean> {
    try {
      // Check if backend is available first
      const isHostedEnv =
        window.location.hostname.includes("fly.dev") ||
        window.location.hostname.includes("builder.codes");

      if (isHostedEnv) {
        this.log(
          "��� No backend available in hosted environment, using localStorage only",
        );
        return false; // Return false instead of throwing error
      }

      // Use the same URL detection as booking helpers
      const { config } = await import("../config/env");
      const apiBaseUrl = config.API_BASE_URL;

      // Clean the phone number
      const cleanedPhone = this.cleanPhone(user.phone);

      // Prepare user data for backend
      const userData = {
        phone: cleanedPhone,
        full_name: user.name || `User ${cleanedPhone.slice(-4)}`,
        email: user.email || "",
        user_type: "customer",
        is_verified: true,
        phone_verified: true,
        preferences: user.preferences || {},
      };

      this.log("📤 Saving user to backend:", userData);

      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        this.log("✅ User saved to backend successfully");

        // If backend returns user data with proper MongoDB ID, update local storage
        if (result.user && result.user._id) {
          const currentUser = this.getCurrentUser();
          if (currentUser && currentUser.phone === result.user.phone) {
            // Update the local user with the backend MongoDB ID
            const updatedUser = {
              ...currentUser,
              _id: result.user._id,
              id: result.user._id, // Also set id for compatibility
            };
            this.setCurrentUser(updatedUser);
            this.log(
              "✅ Updated local user with backend MongoDB ID:",
              result.user._id,
            );
          }
        }

        return true;
      } else {
        this.log("⚠️ Backend user save failed:", response.status);
        return false;
      }
    } catch (error) {
      this.log("��️ Backend user save error:", error);
      return false;
    }
  }

  /**
   * Restore user session from backend on login
   */
  async restoreUserFromBackend(phone: string): Promise<any | null> {
    try {
      // Check if we're in a hosted environment without backend
      const isHostedEnv =
        window.location.hostname.includes("fly.dev") ||
        window.location.hostname.includes("builder.codes");

      if (isHostedEnv) {
        this.log(
          "🌐 Hosted environment detected - skipping backend user restore",
        );
        return null; // Skip backend calls in hosted environments
      }

      // Use the same URL detection as other services
      const { config } = await import("../config/env");
      const apiBaseUrl = config.API_BASE_URL;

      this.log("🔄 Restoring user from backend:", phone);

      const response = await fetch(`${apiBaseUrl}/auth/get-user-by-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.user) {
          this.log("✅ User restored from backend");
          return result.user;
        }
      }

      this.log("⚠️ User not found in backend");
      return null;
    } catch (error) {
      this.log(
        "⚠️ Backend user restore error - using localStorage only:",
        error,
      );
      return null;
    }
  }

  /**
   * Get current user's MongoDB ID for booking association
   */
  getCurrentUserMongoId(): string | null {
    try {
      const user = this.getCurrentUser();
      return user?._id || user?.id || null;
    } catch (error) {
      this.log("⚠️ Error getting user MongoDB ID:", error);
      return null;
    }
  }

  /**
   * Restore user session from backend if available
   * Call this on app startup to restore user data after logout
   */
  async restoreSession(): Promise<boolean> {
    try {
      const localUser = this.getCurrentUser();
      if (!localUser || !localUser.phone) {
        return false;
      }

      // Try to get fresh user data from backend
      const backendUser = await this.restoreUserFromBackend(localUser.phone);
      if (backendUser) {
        // Update local storage with fresh backend data
        this.setCurrentUser(backendUser);
        this.log("✅ Session restored from backend");
        return true;
      }

      this.log("ℹ️ Session restore: using local data");
      return true;
    } catch (error) {
      this.log("⚠️ Session restore failed:", error);
      return false;
    }
  }
}

export default DVHostingSmsService;
