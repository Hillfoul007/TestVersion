/**
 * iOS Session Manager for 30-day persistent authentication
 * Handles iOS-specific session persistence and restoration issues
 */

import { isIosDevice, saveIosAuthToIndexedDB, restoreIosAuthFromIndexedDB } from "./iosAuthFix";
import { DVHostingSmsService } from "@/services/dvhostingSmsService";

export class IosSessionManager {
  private static instance: IosSessionManager;
  private authService: DVHostingSmsService;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private emergencyBackupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.authService = DVHostingSmsService.getInstance();
    this.initialize();
  }

  public static getInstance(): IosSessionManager {
    if (!IosSessionManager.instance) {
      IosSessionManager.instance = new IosSessionManager();
    }
    return IosSessionManager.instance;
  }

  private initialize() {
    if (!isIosDevice()) return;

    console.log("🍎 iOS Session Manager initialized for 30-day persistent authentication");

    // Immediate session check on initialization
    this.checkAndRestoreSession();

    // More aggressive session monitoring for iOS
    this.sessionCheckInterval = setInterval(() => {
      this.checkAndRestoreSession();
    }, 30000); // Check every 30 seconds

    // Emergency backup every 2 minutes
    this.emergencyBackupInterval = setInterval(() => {
      this.createEmergencyBackup();
    }, 120000); // Every 2 minutes

    // Handle iOS app lifecycle events
    this.setupAppLifecycleHandlers();
  }

  private setupAppLifecycleHandlers() {
    // Handle app going to background
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.createEmergencyBackup();
        console.log("🍎 App backgrounded - emergency backup created");
      } else if (document.visibilityState === "visible") {
        // App became visible - check session
        setTimeout(() => {
          this.checkAndRestoreSession();
        }, 1000);
        console.log("🍎 App foregrounded - checking session");
      }
    });

    // Handle page unload/refresh
    window.addEventListener("beforeunload", () => {
      this.createEmergencyBackup();
    });

    // Handle memory pressure events
    window.addEventListener("pagehide", () => {
      this.createEmergencyBackup();
    });

    // PWA-specific events
    if (window.matchMedia("(display-mode: standalone)").matches) {
      window.addEventListener("focus", () => {
        setTimeout(() => {
          this.checkAndRestoreSession();
        }, 500);
      });

      window.addEventListener("blur", () => {
        this.createEmergencyBackup();
      });
    }
  }

  private async checkAndRestoreSession(): Promise<boolean> {
    try {
      // Check if user is already authenticated
      const currentUser = this.authService.getCurrentUser();
      const currentToken = localStorage.getItem("auth_token") || 
                          localStorage.getItem("cleancare_auth_token");

      if (currentUser && currentToken) {
        // Session exists, refresh backup
        await this.createEmergencyBackup();
        return true;
      }

      // No session found, attempt restoration
      console.log("🍎 No active session found, attempting restoration...");
      return await this.restoreSessionFromAllSources();

    } catch (error) {
      console.error("🍎❌ Session check failed:", error);
      return false;
    }
  }

  private async restoreSessionFromAllSources(): Promise<boolean> {
    // Try multiple restoration sources in order of reliability

    // 1. Try IndexedDB (most persistent)
    if (await this.restoreFromIndexedDB()) {
      console.log("🍎✅ Session restored from IndexedDB");
      return true;
    }

    // 2. Try emergency backups from sessionStorage
    if (this.restoreFromEmergencyBackup()) {
      console.log("🍎✅ Session restored from emergency backup");
      return true;
    }

    // 3. Try standard iOS backups
    if (this.restoreFromStandardBackup()) {
      console.log("🍎✅ Session restored from standard backup");
      return true;
    }

    // 4. Try cookie backup
    if (this.restoreFromCookieBackup()) {
      console.log("🍎✅ Session restored from cookie backup");
      return true;
    }

    // 5. Try heartbeat backups
    if (this.restoreFromHeartbeatBackup()) {
      console.log("🍎✅ Session restored from heartbeat backup");
      return true;
    }

    console.log("🍎❌ All session restoration attempts failed");
    return false;
  }

  private async restoreFromIndexedDB(): Promise<boolean> {
    try {
      return await restoreIosAuthFromIndexedDB();
    } catch (error) {
      console.warn("🍎⚠️ IndexedDB restoration failed:", error);
      return false;
    }
  }

  private restoreFromEmergencyBackup(): boolean {
    try {
      const emergencyUser = sessionStorage.getItem("ios_emergency_user");
      const emergencyToken = sessionStorage.getItem("ios_emergency_token");
      const emergencyTimestamp = sessionStorage.getItem("ios_emergency_timestamp");

      if (emergencyUser && emergencyToken && emergencyTimestamp) {
        const age = Date.now() - parseInt(emergencyTimestamp);
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

        if (age < maxAge) {
          this.restoreAuthData(emergencyUser, emergencyToken);
          return true;
        } else {
          // Clean up old emergency data
          sessionStorage.removeItem("ios_emergency_user");
          sessionStorage.removeItem("ios_emergency_token");
          sessionStorage.removeItem("ios_emergency_timestamp");
        }
      }
      return false;
    } catch (error) {
      console.warn("🍎⚠️ Emergency backup restoration failed:", error);
      return false;
    }
  }

  private restoreFromStandardBackup(): boolean {
    try {
      const backupUser = localStorage.getItem("ios_backup_user") ||
                        sessionStorage.getItem("ios_session_user");
      const backupToken = localStorage.getItem("ios_backup_token") ||
                         sessionStorage.getItem("ios_session_token");

      if (backupUser && backupToken) {
        this.restoreAuthData(backupUser, backupToken);
        return true;
      }
      return false;
    } catch (error) {
      console.warn("🍎⚠️ Standard backup restoration failed:", error);
      return false;
    }
  }

  private restoreFromCookieBackup(): boolean {
    try {
      const cookies = document.cookie.split(";");
      const authCookie = cookies.find(c => c.trim().startsWith("ios_auth_backup="));

      if (authCookie) {
        const cookieUser = decodeURIComponent(authCookie.split("=")[1]);
        const user = JSON.parse(cookieUser);
        const phone = user.phone || user.mobile || user.id;
        const persistentToken = `user_token_${phone}_persistent_30d`;

        this.restoreAuthData(cookieUser, persistentToken);
        return true;
      }
      return false;
    } catch (error) {
      console.warn("🍎⚠️ Cookie backup restoration failed:", error);
      return false;
    }
  }

  private restoreFromHeartbeatBackup(): boolean {
    try {
      const heartbeatUser = sessionStorage.getItem("ios_heartbeat_user");
      const heartbeatToken = sessionStorage.getItem("ios_heartbeat_token");
      const heartbeatTimestamp = sessionStorage.getItem("ios_heartbeat_timestamp");

      if (heartbeatUser && heartbeatToken && heartbeatTimestamp) {
        const age = Date.now() - parseInt(heartbeatTimestamp);
        const maxAge = 6 * 60 * 60 * 1000; // 6 hours for heartbeat data

        if (age < maxAge) {
          this.restoreAuthData(heartbeatUser, heartbeatToken);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.warn("🍎⚠️ Heartbeat backup restoration failed:", error);
      return false;
    }
  }

  private restoreAuthData(userStr: string, token: string) {
    localStorage.setItem("current_user", userStr);
    localStorage.setItem("cleancare_user", userStr);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("cleancare_auth_token", token);
    localStorage.setItem("auth_last_active", Date.now().toString());

    // Trigger auth restoration event
    window.dispatchEvent(new CustomEvent("ios-session-restored", {
      detail: {
        user: JSON.parse(userStr),
        restored: true,
        timestamp: Date.now()
      }
    }));
  }

  private async createEmergencyBackup() {
    try {
      const user = this.authService.getCurrentUser();
      const token = localStorage.getItem("auth_token") || 
                   localStorage.getItem("cleancare_auth_token");

      if (!user || !token) return;

      const userStr = JSON.stringify(user);
      const timestamp = Date.now().toString();

      // Multiple backup locations
      sessionStorage.setItem("ios_emergency_user", userStr);
      sessionStorage.setItem("ios_emergency_token", token);
      sessionStorage.setItem("ios_emergency_timestamp", timestamp);

      localStorage.setItem("ios_backup_user", userStr);
      localStorage.setItem("ios_backup_token", token);
      localStorage.setItem("ios_auth_timestamp", timestamp);

      // Save to IndexedDB
      await saveIosAuthToIndexedDB(user, token);

      // Update cookie with 30-day expiration
      try {
        document.cookie = `ios_auth_backup=${encodeURIComponent(userStr)}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Strict; Secure`;
      } catch (e) {
        // Cookie save failed, continue
      }

    } catch (error) {
      console.warn("🍎⚠️ Emergency backup creation failed:", error);
    }
  }

  public destroy() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    if (this.emergencyBackupInterval) {
      clearInterval(this.emergencyBackupInterval);
      this.emergencyBackupInterval = null;
    }
  }

  // Public method to manually trigger session restoration
  public async forceSessionRestore(): Promise<boolean> {
    console.log("🍎 Force session restore triggered");
    return await this.restoreSessionFromAllSources();
  }

  // Public method to create emergency backup
  public async forceEmergencyBackup(): Promise<void> {
    console.log("🍎 Force emergency backup triggered");
    await this.createEmergencyBackup();
  }
}

// Initialize iOS Session Manager on import for iOS devices
if (isIosDevice()) {
  IosSessionManager.getInstance();
}

export default IosSessionManager;
