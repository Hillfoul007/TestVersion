/**
 * Safari Cache Manager
 * Handles Safari-specific caching issues that can cause blank screens
 */

export class SafariCacheManager {
  private static instance: SafariCacheManager;
  private isInitialized = false;

  static getInstance(): SafariCacheManager {
    if (!SafariCacheManager.instance) {
      SafariCacheManager.instance = new SafariCacheManager();
    }
    return SafariCacheManager.instance;
  }

  /**
   * Detect if running on Safari
   */
  private isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  /**
   * Initialize Safari cache management
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.isSafari()) {
      return;
    }

    console.log('🍎 Initializing Safari cache management...');

    // Handle page visibility changes
    this.setupVisibilityHandler();
    
    // Handle page show/hide events
    this.setupPageShowHandler();
    
    // Handle browser back/forward navigation
    this.setupNavigationHandler();
    
    // Set up periodic cache cleanup
    this.setupPeriodicCleanup();

    this.isInitialized = true;
    console.log('✅ Safari cache management initialized');
  }

  /**
   * Handle page visibility changes
   */
  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('🍎 Page became visible - checking cache state');
        this.checkAndRefreshIfNeeded();
      }
    });
  }

  /**
   * Handle page show events (back/forward cache)
   */
  private setupPageShowHandler(): void {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('🍎 Page restored from back/forward cache');
        // Force refresh if restored from cache to prevent stale state
        setTimeout(() => {
          this.forceRefreshIfStale();
        }, 100);
      }
    });
  }

  /**
   * Handle browser navigation
   */
  private setupNavigationHandler(): void {
    window.addEventListener('popstate', () => {
      console.log('🍎 Browser navigation detected');
      setTimeout(() => {
        this.checkAndRefreshIfNeeded();
      }, 100);
    });
  }

  /**
   * Set up periodic cache cleanup
   */
  private setupPeriodicCleanup(): void {
    // Clean up every 30 minutes
    setInterval(() => {
      this.cleanupOldCaches();
    }, 30 * 60 * 1000);
  }

  /**
   * Check if page needs refresh and do it if necessary
   */
  private checkAndRefreshIfNeeded(): void {
    // Check if the main React app is mounted
    const rootElement = document.getElementById('root');
    if (!rootElement || rootElement.children.length === 0) {
      console.log('🍎⚠️ Root element empty - forcing refresh');
      this.forceRefresh();
      return;
    }

    // Check if main app components are rendered
    const appElement = rootElement.querySelector('.App');
    if (!appElement) {
      console.log('🍎⚠️ App component not found - forcing refresh');
      setTimeout(() => {
        this.forceRefresh();
      }, 1000);
      return;
    }

    // Check for blank screens
    if (document.body.innerHTML.trim() === '') {
      console.log('🍎⚠️ Blank page detected - forcing refresh');
      this.forceRefresh();
    }
  }

  /**
   * Force refresh if page is stale
   */
  private forceRefreshIfStale(): void {
    const lastRefresh = localStorage.getItem('safari-last-refresh');
    const now = Date.now();
    const refreshThreshold = 10 * 60 * 1000; // 10 minutes

    if (!lastRefresh || (now - parseInt(lastRefresh)) > refreshThreshold) {
      console.log('🍎 Page is stale - forcing refresh');
      this.forceRefresh();
    }
  }

  /**
   * Force page refresh with cache clearing
   */
  public forceRefresh(): void {
    console.log('🍎🔄 Forcing Safari refresh with cache clear');
    localStorage.setItem('safari-last-refresh', Date.now().toString());
    
    // Clear service worker caches if available
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes('laundrify')) {
            caches.delete(cacheName);
          }
        });
      });
    }

    // Force reload with no cache
    window.location.reload();
  }

  /**
   * Clean up old caches
   */
  private async cleanupOldCaches(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('laundrify') && !name.includes('v5-safari-fix')
      );

      await Promise.all(
        oldCaches.map(cacheName => {
          console.log('🍎🧹 Cleaning up old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    } catch (error) {
      console.warn('🍎⚠️ Cache cleanup failed:', error);
    }
  }

  /**
   * Handle app errors by forcing refresh
   */
  public handleError(error: Error): void {
    console.error('🍎💥 Safari error handler:', error);
    
    // If it's a chunk loading error or network error, force refresh
    if (
      error.message.includes('Loading chunk') ||
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch')
    ) {
      console.log('🍎 Detected chunk/network error - forcing refresh');
      setTimeout(() => {
        this.forceRefresh();
      }, 1000);
    }
  }

  /**
   * Clear all app caches
   */
  public async clearAllCaches(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.includes('laundrify')) {
            console.log('🍎🧹 Clearing cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      console.log('✅ All caches cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear caches:', error);
    }
  }
}

// Global error handling for Safari
export const setupSafariErrorHandling = () => {
  const manager = SafariCacheManager.getInstance();
  
  window.addEventListener('error', (event) => {
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      manager.handleError(event.error);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      manager.handleError(new Error(event.reason));
    }
  });
};

export default SafariCacheManager;
