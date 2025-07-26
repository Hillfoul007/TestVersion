/**
 * iOS Authentication Debugging Utility
 * Provides detailed logging and tracking for iOS auth state transitions
 */

export interface AuthStateSnapshot {
  timestamp: number;
  event: string;
  currentUser: any;
  localStorage: {
    current_user: string | null;
    cleancare_user: string | null;
    auth_token: string | null;
    cleancare_auth_token: string | null;
    force_login_active: string | null;
    ios_intentional_logout: string | null;
  };
  sessionStorage: {
    ios_session_user: string | null;
    ios_session_token: string | null;
  };
  location: {
    pathname: string;
    search: string;
    href: string;
  };
  userAgent: string;
  isIOS: boolean;
  isPWA: boolean;
}

const AUTH_DEBUG_KEY = 'ios_auth_debug_log';
const MAX_DEBUG_ENTRIES = 50;

export const isIosDevice = (): boolean => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export const isPWAMode = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://") ||
    window.location.search.includes("pwa=true")
  );
};

export const captureAuthStateSnapshot = (event: string, currentUser?: any): AuthStateSnapshot => {
  return {
    timestamp: Date.now(),
    event,
    currentUser: currentUser || null,
    localStorage: {
      current_user: localStorage.getItem('current_user'),
      cleancare_user: localStorage.getItem('cleancare_user'),
      auth_token: localStorage.getItem('auth_token'),
      cleancare_auth_token: localStorage.getItem('cleancare_auth_token'),
      force_login_active: localStorage.getItem('force_login_active'),
      ios_intentional_logout: localStorage.getItem('ios_intentional_logout'),
    },
    sessionStorage: {
      ios_session_user: sessionStorage.getItem('ios_session_user'),
      ios_session_token: sessionStorage.getItem('ios_session_token'),
    },
    location: {
      pathname: window.location.pathname,
      search: window.location.search,
      href: window.location.href,
    },
    userAgent: navigator.userAgent,
    isIOS: isIosDevice(),
    isPWA: isPWAMode(),
  };
};

export const logAuthEvent = (event: string, details?: any): void => {
  if (!isIosDevice()) return; // Only log for iOS devices
  
  const snapshot = captureAuthStateSnapshot(event, details?.user);
  
  // Console logging with iOS prefix
  console.log(`🍎📝 iOS Auth Debug [${event}]:`, {
    event,
    timestamp: new Date(snapshot.timestamp).toISOString(),
    location: snapshot.location.pathname,
    hasUser: !!snapshot.currentUser,
    hasAuthToken: !!(snapshot.localStorage.auth_token || snapshot.localStorage.cleancare_auth_token),
    forceLoginActive: snapshot.localStorage.force_login_active === 'true',
    intentionalLogout: snapshot.localStorage.ios_intentional_logout === 'true',
    mode: snapshot.isPWA ? 'PWA' : 'Safari',
    details,
  });
  
  // Store in localStorage for debugging (keep last 50 entries)
  try {
    const debugLog = JSON.parse(localStorage.getItem(AUTH_DEBUG_KEY) || '[]');
    debugLog.push(snapshot);
    
    // Keep only last MAX_DEBUG_ENTRIES
    if (debugLog.length > MAX_DEBUG_ENTRIES) {
      debugLog.splice(0, debugLog.length - MAX_DEBUG_ENTRIES);
    }
    
    localStorage.setItem(AUTH_DEBUG_KEY, JSON.stringify(debugLog));
  } catch (error) {
    console.warn('🍎⚠️ Failed to store debug log:', error);
  }
};

export const getAuthDebugLog = (): AuthStateSnapshot[] => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_DEBUG_KEY) || '[]');
  } catch (error) {
    console.warn('🍎⚠️ Failed to read debug log:', error);
    return [];
  }
};

export const clearAuthDebugLog = (): void => {
  localStorage.removeItem(AUTH_DEBUG_KEY);
  console.log('🍎🗑️ Cleared iOS auth debug log');
};

export const exportAuthDebugLog = (): string => {
  const log = getAuthDebugLog();
  const summary = {
    device: {
      userAgent: navigator.userAgent,
      isIOS: isIosDevice(),
      isPWA: isPWAMode(),
    },
    exportTime: new Date().toISOString(),
    totalEvents: log.length,
    events: log,
  };
  
  return JSON.stringify(summary, null, 2);
};

export const analyzeAuthIssues = (): string[] => {
  const log = getAuthDebugLog();
  const issues: string[] = [];
  
  if (log.length === 0) {
    return ['No debug data available'];
  }
  
  // Check for common patterns
  const loginAttempts = log.filter(entry => entry.event.includes('login'));
  const logoutEvents = log.filter(entry => entry.event.includes('logout'));
  const refreshEvents = log.filter(entry => entry.event.includes('refresh') || entry.event.includes('reload'));
  const authFailures = log.filter(entry => entry.event.includes('failure') || entry.event.includes('error'));
  
  if (loginAttempts.length > 3) {
    issues.push(`Multiple login attempts detected (${loginAttempts.length})`);
  }
  
  if (refreshEvents.length > 2) {
    issues.push(`Excessive page refreshes detected (${refreshEvents.length})`);
  }
  
  if (authFailures.length > 0) {
    issues.push(`Authentication failures detected (${authFailures.length})`);
  }
  
  // Check for auth state inconsistencies
  const inconsistentStates = log.filter(entry => {
    const hasUser = !!entry.currentUser;
    const hasToken = !!(entry.localStorage.auth_token || entry.localStorage.cleancare_auth_token);
    return hasUser !== hasToken; // User without token or token without user
  });
  
  if (inconsistentStates.length > 0) {
    issues.push(`Auth state inconsistencies detected (${inconsistentStates.length})`);
  }
  
  return issues.length > 0 ? issues : ['No obvious issues detected'];
};

// Initialize iOS auth debugging
if (isIosDevice()) {
  console.log('🍎📝 iOS Auth Debugging initialized');
  
  // Log initial state
  logAuthEvent('debug_init');
  
  // Listen for page events
  window.addEventListener('beforeunload', () => {
    logAuthEvent('page_beforeunload');
  });
  
  window.addEventListener('pagehide', () => {
    logAuthEvent('page_pagehide');
  });
  
  window.addEventListener('pageshow', (event) => {
    logAuthEvent('page_pageshow', { persisted: event.persisted });
  });
  
  // Listen for auth events
  window.addEventListener('auth-login', (event: any) => {
    logAuthEvent('auth_login_event', event.detail);
  });
  
  window.addEventListener('auth-logout', (event: any) => {
    logAuthEvent('auth_logout_event', event.detail);
  });
  
  window.addEventListener('ios-session-restored', (event: any) => {
    logAuthEvent('ios_session_restored', event.detail);
  });
}
