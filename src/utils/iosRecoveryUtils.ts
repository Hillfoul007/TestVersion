/**
 * iOS Recovery Utilities
 * Helper functions for components to interact with the iOS blank page recovery system
 */

import { isIosDevice } from './iosAuthFix';

// Global recovery functions available to all components
export const IosRecoveryUtils = {
  
  /**
   * Check if the current page appears blank
   */
  isPageBlank(): boolean {
    if (!isIosDevice()) return false;
    
    try {
      // Check if React root has content
      const reactRoot = document.getElementById('root');
      if (!reactRoot || !reactRoot.innerHTML.trim()) {
        return true;
      }

      // Check for essential UI elements
      const essentialSelectors = [
        '.App',
        '[data-testid="laundry-index"]',
        'nav',
        'header',
        'main'
      ];

      const hasEssentialContent = essentialSelectors.some(selector => {
        const element = document.querySelector(selector);
        return element && element.innerHTML.trim() !== '';
      });

      return !hasEssentialContent;
    } catch (error) {
      console.error('🍎❌ Error checking blank page:', error);
      return false;
    }
  },

  /**
   * Manually trigger recovery process
   */
  triggerRecovery(): void {
    if (!isIosDevice()) return;
    
    console.log('🍎🔧 Manual recovery triggered by component');
    window.dispatchEvent(new CustomEvent('ios-force-recovery'));
  },

  /**
   * Force a component re-render to help with recovery
   */
  forceRerender(component?: React.Component | (() => void)): void {
    if (!isIosDevice()) return;
    
    try {
      // If component provided, call it
      if (component) {
        if (typeof component === 'function') {
          component();
        } else if (component.forceUpdate) {
          component.forceUpdate();
        }
      }

      // Trigger global re-render event
      window.dispatchEvent(new CustomEvent('app-force-refresh', {
        detail: { source: 'manual-component-trigger', timestamp: Date.now() }
      }));
    } catch (error) {
      console.error('🍎❌ Error triggering re-render:', error);
    }
  },

  /**
   * Preserve current component state before potential recovery
   */
  preserveState(componentName: string, state: any): void {
    if (!isIosDevice()) return;
    
    try {
      const stateKey = `ios_component_state_${componentName}`;
      const stateData = {
        state,
        timestamp: Date.now(),
        component: componentName
      };
      
      sessionStorage.setItem(stateKey, JSON.stringify(stateData));
      console.log(`🍎💾 State preserved for component: ${componentName}`);
    } catch (error) {
      console.warn(`🍎⚠️ Failed to preserve state for ${componentName}:`, error);
    }
  },

  /**
   * Restore component state after recovery
   */
  restoreState(componentName: string): any {
    if (!isIosDevice()) return null;
    
    try {
      const stateKey = `ios_component_state_${componentName}`;
      const stateDataStr = sessionStorage.getItem(stateKey);
      
      if (!stateDataStr) return null;
      
      const stateData = JSON.parse(stateDataStr);
      
      // Check if state is not too old (max 1 hour)
      const maxAge = 60 * 60 * 1000; // 1 hour
      if (Date.now() - stateData.timestamp > maxAge) {
        sessionStorage.removeItem(stateKey);
        return null;
      }
      
      console.log(`🍎📦 State restored for component: ${componentName}`);
      return stateData.state;
    } catch (error) {
      console.warn(`🍎⚠️ Failed to restore state for ${componentName}:`, error);
      return null;
    }
  },

  /**
   * Check if recovery is currently in progress
   */
  isRecovering(): boolean {
    if (!isIosDevice()) return false;
    
    try {
      // Check for recovery UI elements
      const emergencyUI = document.getElementById('ios-emergency-recovery');
      if (emergencyUI) return true;
      
      // Check for recovery classes on body
      const hasRecoveryClass = document.body.classList.contains('ios-recovery-mode') ||
                              document.body.classList.contains('ios-page-loading');
      
      return hasRecoveryClass;
    } catch (error) {
      return false;
    }
  },

  /**
   * Add CSS class to element to ensure it stays visible during recovery
   */
  makeElementCritical(element: HTMLElement): void {
    if (!isIosDevice()) return;
    
    try {
      element.classList.add('ios-critical-element');
      element.style.transform = 'translateZ(0)';
      element.style.willChange = 'contents';
    } catch (error) {
      console.warn('🍎⚠️ Failed to make element critical:', error);
    }
  },

  /**
   * Remove critical styling from element
   */
  removeCriticalStyling(element: HTMLElement): void {
    if (!isIosDevice()) return;
    
    try {
      element.classList.remove('ios-critical-element');
      element.style.transform = '';
      element.style.willChange = '';
    } catch (error) {
      console.warn('🍎⚠️ Failed to remove critical styling:', error);
    }
  },

  /**
   * Show a temporary loading indicator
   */
  showLoadingIndicator(message: string = 'Loading...', duration: number = 5000): void {
    if (!isIosDevice()) return;
    
    try {
      // Remove existing indicator
      const existing = document.getElementById('ios-temp-loading');
      if (existing) existing.remove();
      
      // Create new indicator
      const indicator = document.createElement('div');
      indicator.id = 'ios-temp-loading';
      indicator.className = 'ios-loading-indicator';
      indicator.textContent = message;
      
      // Apply styles
      indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 16px;
        color: #333;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      
      // Add loading spinner
      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: ios-loading-spin 1s linear infinite;
      `;
      
      indicator.insertBefore(spinner, indicator.firstChild);
      document.body.appendChild(indicator);
      
      // Auto-remove after duration
      setTimeout(() => {
        if (document.body.contains(indicator)) {
          document.body.removeChild(indicator);
        }
      }, duration);
      
      console.log(`🍎📱 Loading indicator shown: ${message}`);
    } catch (error) {
      console.warn('🍎⚠️ Failed to show loading indicator:', error);
    }
  },

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator(): void {
    if (!isIosDevice()) return;
    
    try {
      const indicator = document.getElementById('ios-temp-loading');
      if (indicator) {
        document.body.removeChild(indicator);
      }
    } catch (error) {
      console.warn('🍎⚠️ Failed to hide loading indicator:', error);
    }
  },

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): any {
    if (!isIosDevice()) return null;
    
    try {
      // Get stats from the global blank page manager
      if (window.getBlankPageStats) {
        return window.getBlankPageStats();
      }
      
      // Fallback: basic stats from localStorage
      const recoveryData = localStorage.getItem('ios_last_recovery');
      const attemptCount = localStorage.getItem('ios_recovery_attempt');
      
      return {
        lastRecovery: recoveryData ? JSON.parse(recoveryData) : null,
        totalAttempts: attemptCount ? parseInt(attemptCount) : 0,
        isIosDevice: true
      };
    } catch (error) {
      console.warn('🍎⚠️ Failed to get recovery stats:', error);
      return null;
    }
  }
};

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).IosRecoveryUtils = IosRecoveryUtils;
}

export default IosRecoveryUtils;

// React hook for components to use recovery utilities
export const useIosRecovery = () => {
  return {
    isPageBlank: IosRecoveryUtils.isPageBlank,
    triggerRecovery: IosRecoveryUtils.triggerRecovery,
    forceRerender: IosRecoveryUtils.forceRerender,
    preserveState: IosRecoveryUtils.preserveState,
    restoreState: IosRecoveryUtils.restoreState,
    isRecovering: IosRecoveryUtils.isRecovering,
    showLoading: IosRecoveryUtils.showLoadingIndicator,
    hideLoading: IosRecoveryUtils.hideLoadingIndicator,
    getStats: IosRecoveryUtils.getRecoveryStats
  };
};

// Type definitions for TypeScript
declare global {
  interface Window {
    getBlankPageStats?: () => any;
    IosRecoveryUtils: typeof IosRecoveryUtils;
  }
}
