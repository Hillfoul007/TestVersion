/**
 * iOS Blank Page Prevention and Recovery System
 * Handles the specific iOS Safari issue where pages become blank after some time
 */

import { isIosDevice, isPWAMode } from './iosAuthFix';

interface BlankPageConfig {
  checkInterval: number;
  forceReloadTimeout: number;
  maxConsecutiveBlankChecks: number;
  memoryThreshold: number;
}

class IosBlankPageManager {
  private static instance: IosBlankPageManager;
  private config: BlankPageConfig;
  private blankCheckInterval: NodeJS.Timeout | null = null;
  private consecutiveBlankChecks = 0;
  private lastVisibilityCheck = Date.now();
  private isRecovering = false;

  private constructor() {
    this.config = {
      checkInterval: isPWAMode() ? 5000 : 10000, // PWA: 5s, Safari: 10s
      forceReloadTimeout: 60000, // 1 minute of blank before force reload
      maxConsecutiveBlankChecks: isPWAMode() ? 6 : 3, // PWA: 30s, Safari: 30s
      memoryThreshold: 100 * 1024 * 1024, // 100MB threshold
    };
    
    this.initialize();
  }

  public static getInstance(): IosBlankPageManager {
    if (!IosBlankPageManager.instance) {
      IosBlankPageManager.instance = new IosBlankPageManager();
    }
    return IosBlankPageManager.instance;
  }

  private initialize() {
    if (!isIosDevice()) return;

    console.log(`🍎🛡️ iOS Blank Page Protection enabled (${isPWAMode() ? 'PWA' : 'Safari'} mode)`);

    // Start monitoring for blank page conditions
    this.startBlankPageMonitoring();

    // Handle visibility changes
    this.setupVisibilityHandlers();

    // Handle memory pressure
    this.setupMemoryHandlers();

    // Handle page lifecycle
    this.setupPageLifecycleHandlers();

    // Emergency reload listener
    this.setupEmergencyReload();
  }

  private startBlankPageMonitoring() {
    this.blankCheckInterval = setInterval(() => {
      this.checkForBlankPage();
    }, this.config.checkInterval);
  }

  private checkForBlankPage() {
    try {
      // Multiple ways to detect blank page
      const isBlank = this.detectBlankPage();
      
      if (isBlank) {
        this.consecutiveBlankChecks++;
        console.warn(`🍎⚠️ Blank page detected (${this.consecutiveBlankChecks}/${this.config.maxConsecutiveBlankChecks})`);
        
        if (this.consecutiveBlankChecks >= this.config.maxConsecutiveBlankChecks) {
          this.handleBlankPageRecovery();
        }
      } else {
        // Reset counter if page is not blank
        if (this.consecutiveBlankChecks > 0) {
          console.log('🍎✅ Page content restored, resetting blank page counter');
          this.consecutiveBlankChecks = 0;
        }
      }
    } catch (error) {
      console.error('🍎❌ Error during blank page check:', error);
    }
  }

  private detectBlankPage(): boolean {
    // Method 1: Check if document body has any meaningful content
    const bodyContent = document.body?.innerHTML?.trim() || '';
    if (bodyContent === '' || bodyContent === '<div></div>') {
      return true;
    }

    // Method 2: Check if React root has content
    const reactRoot = document.getElementById('root');
    if (!reactRoot || !reactRoot.innerHTML.trim()) {
      return true;
    }

    // Method 3: Check for essential UI elements
    const essentialSelectors = [
      '.App',
      '[data-testid="laundry-index"]',
      'nav',
      'header',
      'main',
      '.mobile-container'
    ];

    const hasEssentialContent = essentialSelectors.some(selector => {
      const element = document.querySelector(selector);
      return element && element.innerHTML.trim() !== '';
    });

    if (!hasEssentialContent) {
      return true;
    }

    // Method 4: Check if page is responsive to user interaction
    const interactiveElements = document.querySelectorAll('button, input, a, [role="button"]');
    if (interactiveElements.length === 0) {
      return true;
    }

    // Method 5: Check for critical JavaScript errors
    if (this.hasCriticalErrors()) {
      return true;
    }

    return false;
  }

  private hasCriticalErrors(): boolean {
    // Check for common React/JavaScript errors that cause blank pages
    const errorIndicators = [
      () => !window.React,
      () => !window.ReactDOM,
      () => typeof document.createElement !== 'function',
      () => !document.querySelector,
    ];

    return errorIndicators.some(check => {
      try {
        return check();
      } catch {
        return true;
      }
    });
  }

  private async handleBlankPageRecovery() {
    if (this.isRecovering) {
      console.log('🍎🔄 Recovery already in progress, skipping');
      return;
    }

    this.isRecovering = true;
    console.log('🍎🚨 Blank page detected - starting recovery process');

    try {
      // Step 1: Try soft recovery (restore state without reload)
      if (await this.attemptSoftRecovery()) {
        console.log('🍎✅ Soft recovery successful');
        this.isRecovering = false;
        this.consecutiveBlankChecks = 0;
        return;
      }

      // Step 2: Try memory cleanup
      if (await this.attemptMemoryCleanup()) {
        console.log('🍎✅ Memory cleanup successful');
        this.isRecovering = false;
        this.consecutiveBlankChecks = 0;
        return;
      }

      // Step 3: Force page reload as last resort
      await this.forcePageReload();

    } catch (error) {
      console.error('🍎❌ Recovery process failed:', error);
      this.isRecovering = false;
    }
  }

  private async attemptSoftRecovery(): Promise<boolean> {
    try {
      console.log('🍎🔧 Attempting soft recovery...');

      // Try to restore React root
      const reactRoot = document.getElementById('root');
      if (reactRoot && !reactRoot.innerHTML.trim()) {
        // Trigger React re-render by dispatching a custom event
        window.dispatchEvent(new CustomEvent('ios-blank-page-recovery', {
          detail: { type: 'soft-recovery', timestamp: Date.now() }
        }));

        // Wait for potential re-render
        await this.sleep(2000);

        // Check if recovery worked
        return !this.detectBlankPage();
      }

      return false;
    } catch (error) {
      console.error('🍎❌ Soft recovery failed:', error);
      return false;
    }
  }

  private async attemptMemoryCleanup(): Promise<boolean> {
    try {
      console.log('🍎🧹 Attempting memory cleanup...');

      // Clear various caches
      this.clearMemoryCaches();

      // Trigger garbage collection if available
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }

      // Clear large objects from memory
      this.clearLargeObjects();

      // Wait for cleanup to take effect
      await this.sleep(3000);

      // Force a re-render attempt
      window.dispatchEvent(new CustomEvent('ios-memory-cleanup', {
        detail: { timestamp: Date.now() }
      }));

      await this.sleep(2000);

      return !this.detectBlankPage();
    } catch (error) {
      console.error('🍎❌ Memory cleanup failed:', error);
      return false;
    }
  }

  private clearMemoryCaches() {
    try {
      // Clear image caches
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && !img.src.startsWith('data:')) {
          img.src = img.src + '?t=' + Date.now();
        }
      });

      // Clear CSS caches by reloading stylesheets
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      stylesheets.forEach(link => {
        const href = (link as HTMLLinkElement).href;
        if (href && !href.includes('?t=')) {
          (link as HTMLLinkElement).href = href + '?t=' + Date.now();
        }
      });

      // Clear localStorage cache entries (but preserve auth)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_') || 
            key.startsWith('temp_') ||
            key.includes('api_cache')) {
          localStorage.removeItem(key);
        }
      });

      console.log('🍎🧹 Memory caches cleared');
    } catch (error) {
      console.error('🍎❌ Cache clearing failed:', error);
    }
  }

  private clearLargeObjects() {
    try {
      // Clear large arrays/objects from window
      const windowObj = window as any;
      const largeObjectKeys = ['webpackChunkName', 'webpackJsonp', '__INITIAL_STATE__'];
      
      largeObjectKeys.forEach(key => {
        if (windowObj[key]) {
          delete windowObj[key];
        }
      });

      // Clear React DevTools if present
      if (windowObj.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        windowObj.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.clear();
      }

      console.log('🍎🧹 Large objects cleared');
    } catch (error) {
      console.error('🍎❌ Large object clearing failed:', error);
    }
  }

  private async forcePageReload() {
    try {
      console.log('🍎🔄 Force reloading page due to blank page condition');
      
      // Save current state before reload
      this.saveStateBeforeReload();

      // Add reload reason to URL params
      const url = new URL(window.location.href);
      url.searchParams.set('ios_recovery', 'blank_page');
      url.searchParams.set('recovery_time', Date.now().toString());

      // Show user notification if possible
      this.showRecoveryNotification();

      // Delay reload slightly to allow notification to show
      await this.sleep(1000);

      // Perform the reload
      window.location.href = url.toString();
    } catch (error) {
      console.error('🍎❌ Force reload failed:', error);
      // Fallback to simple reload
      window.location.reload();
    }
  }

  private saveStateBeforeReload() {
    try {
      const currentState = {
        timestamp: Date.now(),
        reason: 'blank_page_recovery',
        url: window.location.href,
        userAgent: navigator.userAgent,
        recovery_attempt: (localStorage.getItem('ios_recovery_attempt') || '0')
      };

      localStorage.setItem('ios_last_recovery', JSON.stringify(currentState));
      localStorage.setItem('ios_recovery_attempt', (parseInt(currentState.recovery_attempt) + 1).toString());
      
      console.log('🍎💾 State saved before reload');
    } catch (error) {
      console.error('🍎❌ State save failed:', error);
    }
  }

  private showRecoveryNotification() {
    try {
      // Create a simple notification div that doesn't depend on React
      const notification = document.createElement('div');
      notification.id = 'ios-recovery-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      notification.textContent = '🔄 Refreshing page to fix display issue...';
      
      document.body.appendChild(notification);
    } catch (error) {
      console.error('🍎❌ Notification creation failed:', error);
    }
  }

  private setupVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Page became visible - check for blank page after a delay
        setTimeout(() => {
          this.checkForBlankPage();
        }, 1000);
      }
    });
  }

  private setupMemoryHandlers() {
    // Handle memory warnings if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory && memory.usedJSHeapSize > this.config.memoryThreshold) {
          console.warn('🍎⚠️ High memory usage detected:', memory.usedJSHeapSize / 1024 / 1024, 'MB');
          this.clearMemoryCaches();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private setupPageLifecycleHandlers() {
    // Handle page freeze/unfreeze events
    document.addEventListener('freeze', () => {
      console.log('🍎❄️ Page frozen - preparing for potential blank page');
      this.saveStateBeforeReload();
    });

    document.addEventListener('resume', () => {
      console.log('🍎🔥 Page resumed - checking for blank page');
      setTimeout(() => {
        this.checkForBlankPage();
      }, 500);
    });

    // Handle page cache restoration
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('🍎📄 Page restored from cache - checking for blank page');
        setTimeout(() => {
          this.checkForBlankPage();
        }, 1000);
      }
    });
  }

  private setupEmergencyReload() {
    // Listen for manual recovery trigger
    window.addEventListener('ios-force-recovery', () => {
      console.log('🍎🚨 Manual recovery triggered');
      this.consecutiveBlankChecks = this.config.maxConsecutiveBlankChecks;
      this.handleBlankPageRecovery();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public destroy() {
    if (this.blankCheckInterval) {
      clearInterval(this.blankCheckInterval);
      this.blankCheckInterval = null;
    }
  }

  // Public method to manually trigger blank page check
  public checkForBlankPageManual(): boolean {
    return this.detectBlankPage();
  }

  // Public method to get recovery stats
  public getRecoveryStats() {
    return {
      consecutiveBlankChecks: this.consecutiveBlankChecks,
      isRecovering: this.isRecovering,
      lastCheck: this.lastVisibilityCheck,
      config: this.config
    };
  }
}

// Auto-initialize for iOS devices
let blankPageManager: IosBlankPageManager | null = null;

if (isIosDevice()) {
  blankPageManager = IosBlankPageManager.getInstance();
}

// Export for manual usage
export { IosBlankPageManager, blankPageManager };
export default blankPageManager;

// Utility functions
export const checkForBlankPage = (): boolean => {
  return blankPageManager?.checkForBlankPageManual() || false;
};

export const forceRecovery = (): void => {
  window.dispatchEvent(new CustomEvent('ios-force-recovery'));
};

export const getBlankPageStats = () => {
  return blankPageManager?.getRecoveryStats() || null;
};
