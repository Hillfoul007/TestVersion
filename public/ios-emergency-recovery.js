/**
 * iOS Emergency Recovery Script
 * This script runs immediately and doesn't depend on React
 * Handles extreme blank page scenarios where React fails to load
 */

(function() {
  'use strict';
  
  // Only run on iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  
  if (!isIOS) return;
  
  console.log('🍎🚨 iOS Emergency Recovery Script loaded');
  
  let blankPageDetectionCount = 0;
  let emergencyRecoveryActive = false;
  
  // Emergency blank page detection (independent of React)
  function detectEmergencyBlankPage() {
    const root = document.getElementById('root');
    const body = document.body;
    
    // Check if page is completely empty
    const rootEmpty = !root || !root.innerHTML.trim();
    const bodyEmpty = !body || body.innerHTML.trim() === '' || body.innerHTML === '<div id="root"></div>';
    const noInteractiveElements = document.querySelectorAll('button, input, a').length === 0;
    
    return rootEmpty || bodyEmpty || noInteractiveElements;
  }
  
  // Emergency recovery UI
  function showEmergencyRecoveryUI() {
    if (emergencyRecoveryActive) return;
    emergencyRecoveryActive = true;
    
    console.log('🍎🚨 Showing emergency recovery UI');
    
    // Create emergency recovery div
    const emergencyDiv = document.createElement('div');
    emergencyDiv.id = 'ios-emergency-recovery';
    emergencyDiv.className = 'ios-emergency-content active';
    
    emergencyDiv.innerHTML = `
      <h1>🔄 Restoring App</h1>
      <p>The app is being restored. This usually happens when iOS runs low on memory.</p>
      <button onclick="window.location.reload()" style="
        margin-top: 20px;
        padding: 12px 24px;
        background: #007AFF;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      ">Refresh App</button>
      <p style="font-size: 14px; margin-top: 16px; color: #999;">
        Tap "Refresh App" if the app doesn't load automatically
      </p>
    `;
    
    // Apply emergency styles
    emergencyDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      text-align: center;
      padding: 20px;
    `;
    
    document.body.appendChild(emergencyDiv);
    
    // Auto-reload after 10 seconds if user doesn't interact
    setTimeout(() => {
      if (detectEmergencyBlankPage()) {
        console.log('🍎🔄 Auto-reloading after 10 seconds');
        window.location.reload();
      }
    }, 10000);
  }
  
  // Emergency memory cleanup
  function emergencyMemoryCleanup() {
    try {
      console.log('🍎🧹 Emergency memory cleanup');
      
      // Clear large objects from window
      const windowObj = window;
      const largeKeys = ['webpackChunkName', 'webpackJsonp', '__INITIAL_STATE__', '__REACT_DEVTOOLS_GLOBAL_HOOK__'];
      largeKeys.forEach(key => {
        if (windowObj[key]) {
          try {
            delete windowObj[key];
          } catch (e) {
            // Can't delete, continue
          }
        }
      });
      
      // Clear non-essential localStorage items
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('cache_') || 
              key.startsWith('temp_') ||
              key.includes('api_cache') ||
              key.includes('redux_persist')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Emergency localStorage cleanup failed:', e);
      }
      
      // Force garbage collection if available
      if (windowObj.gc && typeof windowObj.gc === 'function') {
        windowObj.gc();
      }
      
    } catch (error) {
      console.error('🍎❌ Emergency cleanup failed:', error);
    }
  }
  
  // Main emergency check function
  function emergencyCheck() {
    if (emergencyRecoveryActive) return;
    
    if (detectEmergencyBlankPage()) {
      blankPageDetectionCount++;
      console.log(`🍎⚠️ Emergency blank page detected (${blankPageDetectionCount}/3)`);
      
      if (blankPageDetectionCount === 1) {
        // First detection - try memory cleanup
        emergencyMemoryCleanup();
      } else if (blankPageDetectionCount === 2) {
        // Second detection - add emergency styles to force visibility
        document.body.className += ' ios-recovery-mode';
        
        // Try to force React re-render
        const reactRoot = document.getElementById('root');
        if (reactRoot) {
          reactRoot.style.display = 'none';
          setTimeout(() => {
            reactRoot.style.display = 'block';
          }, 100);
        }
      } else if (blankPageDetectionCount >= 3) {
        // Third detection - show emergency UI
        showEmergencyRecoveryUI();
      }
    } else {
      // Page has content, reset counter
      if (blankPageDetectionCount > 0) {
        console.log('🍎✅ Page content restored, resetting emergency counter');
        blankPageDetectionCount = 0;
      }
    }
  }
  
  // Start emergency monitoring
  function startEmergencyMonitoring() {
    // Check immediately
    setTimeout(emergencyCheck, 1000);
    
    // Check every 5 seconds
    setInterval(emergencyCheck, 5000);
    
    // Check on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(emergencyCheck, 1000);
      }
    });
    
    // Check on page show (cache restoration)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        setTimeout(emergencyCheck, 1000);
      }
    });
    
    console.log('🍎🛡️ Emergency monitoring started');
  }
  
  // Handle recovery from previous emergency reload
  function handleRecoveryCheck() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('ios_emergency') === 'true') {
      console.log('🍎✅ Recovered from emergency reload');
      
      // Remove emergency parameters
      const cleanUrl = window.location.pathname;
      history.replaceState({}, document.title, cleanUrl);
      
      // Show brief success message
      const successDiv = document.createElement('div');
      successDiv.innerHTML = '✅ App restored successfully';
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
      `;
      
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    }
  }
  
  // Emergency reload function
  window.iosEmergencyReload = function() {
    console.log('🍎🚨 Emergency reload triggered');
    
    // Add emergency reload marker
    const url = new URL(window.location.href);
    url.searchParams.set('ios_emergency', 'true');
    url.searchParams.set('emergency_time', Date.now().toString());
    
    // Store emergency state
    try {
      localStorage.setItem('ios_emergency_reload', JSON.stringify({
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }));
    } catch (e) {
      // Storage failed, continue
    }
    
    window.location.href = url.toString();
  };
  
  // Initialize emergency system
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      handleRecoveryCheck();
      startEmergencyMonitoring();
    });
  } else {
    handleRecoveryCheck();
    startEmergencyMonitoring();
  }
  
  console.log('🍎🛡️ iOS Emergency Recovery System initialized');
  
})();
