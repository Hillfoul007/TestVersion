/**
 * React component to handle iOS blank page recovery events
 * Listens for recovery events and triggers re-renders
 */

import { useEffect, useState } from 'react';
import { isIosDevice } from '@/utils/iosAuthFix';

interface RecoveryEvent {
  type: string;
  timestamp: number;
  attempt?: number;
}

const IosBlankPageRecovery: React.FC = () => {
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [lastRecovery, setLastRecovery] = useState<RecoveryEvent | null>(null);
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    if (!isIosDevice()) return;

    // Listen for blank page recovery events
    const handleBlankPageRecovery = (event: CustomEvent) => {
      console.log('🍎🔧 Blank page recovery event received:', event.detail);
      
      const recoveryData: RecoveryEvent = {
        type: event.detail.type || 'unknown',
        timestamp: event.detail.timestamp || Date.now(),
        attempt: recoveryAttempts + 1
      };

      setLastRecovery(recoveryData);
      setRecoveryAttempts(prev => prev + 1);
      
      // Force React re-render
      setForceRender(prev => prev + 1);

      // Dispatch a global app refresh event
      window.dispatchEvent(new CustomEvent('app-force-refresh', {
        detail: { source: 'blank-page-recovery', ...recoveryData }
      }));
    };

    // Listen for memory cleanup events
    const handleMemoryCleanup = (event: CustomEvent) => {
      console.log('🍎🧹 Memory cleanup event received:', event.detail);
      
      // Trigger a gentle re-render after cleanup
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 1000);
    };

    // Listen for session restoration events
    const handleSessionRestored = (event: CustomEvent) => {
      console.log('🍎✅ Session restored event received:', event.detail);
      
      // Trigger re-render to show restored state
      setForceRender(prev => prev + 1);
    };

    // Add event listeners
    window.addEventListener('ios-blank-page-recovery', handleBlankPageRecovery as EventListener);
    window.addEventListener('ios-memory-cleanup', handleMemoryCleanup as EventListener);
    window.addEventListener('ios-session-restored', handleSessionRestored as EventListener);

    // Check if we recovered from a blank page on mount
    const lastRecoveryData = localStorage.getItem('ios_last_recovery');
    if (lastRecoveryData) {
      try {
        const recovery = JSON.parse(lastRecoveryData);
        const timeSinceRecovery = Date.now() - recovery.timestamp;
        
        // If recovery was recent (within 5 minutes), show it
        if (timeSinceRecovery < 5 * 60 * 1000) {
          setLastRecovery(recovery);
          console.log('🍎📊 Previous recovery detected:', recovery);
        }
      } catch (error) {
        console.error('🍎❌ Error parsing recovery data:', error);
      }
    }

    // Cleanup function
    return () => {
      window.removeEventListener('ios-blank-page-recovery', handleBlankPageRecovery as EventListener);
      window.removeEventListener('ios-memory-cleanup', handleMemoryCleanup as EventListener);
      window.removeEventListener('ios-session-restored', handleSessionRestored as EventListener);
    };
  }, [recoveryAttempts]);

  // Enhanced visibility change handler for iOS
  useEffect(() => {
    if (!isIosDevice()) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🍎👁️ App became visible - checking for blank page recovery needed');
        
        // Check if the page appears blank after becoming visible
        setTimeout(() => {
          const reactRoot = document.getElementById('root');
          const hasContent = reactRoot && reactRoot.innerHTML.trim() !== '';
          
          if (!hasContent) {
            console.log('🍎⚠️ Page appears blank after visibility change - triggering recovery');
            window.dispatchEvent(new CustomEvent('ios-force-recovery'));
          } else {
            // Force a gentle re-render to ensure everything is working
            setForceRender(prev => prev + 1);
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Component doesn't render anything visible, but the state changes trigger parent re-renders
  return null;
};

export default IosBlankPageRecovery;

// Hook for other components to use recovery state
export const useIosBlankPageRecovery = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryCount, setRecoveryCount] = useState(0);

  useEffect(() => {
    if (!isIosDevice()) return;

    const handleRecoveryStart = () => {
      setIsRecovering(true);
      setRecoveryCount(prev => prev + 1);
    };

    const handleRecoveryEnd = () => {
      setIsRecovering(false);
    };

    window.addEventListener('ios-blank-page-recovery', handleRecoveryStart);
    window.addEventListener('ios-session-restored', handleRecoveryEnd);
    window.addEventListener('app-force-refresh', handleRecoveryEnd);

    return () => {
      window.removeEventListener('ios-blank-page-recovery', handleRecoveryStart);
      window.removeEventListener('ios-session-restored', handleRecoveryEnd);
      window.removeEventListener('app-force-refresh', handleRecoveryEnd);
    };
  }, []);

  return { isRecovering, recoveryCount };
};
