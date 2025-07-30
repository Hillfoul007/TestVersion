import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AddressSyncNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  addressCount?: number;
  syncStatus?: 'syncing' | 'success' | 'error';
}

const AddressSyncNotification: React.FC<AddressSyncNotificationProps> = ({
  isVisible,
  onClose,
  addressCount = 0,
  syncStatus = 'syncing'
}) => {
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-hide after 5 seconds for success, 10 seconds for error
    if (isVisible && syncStatus !== 'syncing') {
      const timeout = setTimeout(() => {
        onClose();
      }, syncStatus === 'success' ? 5000 : 10000);
      
      setAutoHideTimer(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
    
    return () => {
      if (autoHideTimer) clearTimeout(autoHideTimer);
    };
  }, [isVisible, syncStatus, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Smartphone className="h-4 w-4 text-blue-600" />;
    }
  };

  const getMessage = () => {
    switch (syncStatus) {
      case 'syncing':
        return "Syncing your saved addresses across devices...";
      case 'success':
        return addressCount > 0 
          ? `Successfully synced ${addressCount} saved address${addressCount > 1 ? 'es' : ''} from your other devices!`
          : "Your addresses are now synced across all your devices!";
      case 'error':
        return "Unable to sync addresses from other devices. Your local addresses are still available.";
      default:
        return "Syncing addresses...";
    }
  };

  const getAlertVariant = () => {
    switch (syncStatus) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="fixed top-20 left-4 right-4 z-50 md:left-auto md:right-8 md:max-w-md">
      <Alert variant={getAlertVariant()} className="shadow-lg border-l-4 border-l-blue-500">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <AlertDescription className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="h-3 w-3" />
                <Monitor className="h-3 w-3" />
                <span className="font-medium">Cross-Device Sync</span>
              </div>
              <p>{getMessage()}</p>
            </AlertDescription>
          </div>
          {syncStatus !== 'syncing' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
};

export default AddressSyncNotification;
