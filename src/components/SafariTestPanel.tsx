import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SafariCacheManager from '@/utils/safariCacheManager';

export default function SafariTestPanel() {
  const [corsStatus, setCorsStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [cacheStatus, setCacheStatus] = useState<'unknown' | 'active' | 'inactive'>('unknown');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const safariDetected = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsSafari(safariDetected);
    
    // Test CORS on component mount
    testCORS();
    
    // Check cache status
    checkCacheStatus();
  }, []);

  const testCORS = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setCorsStatus('success');
        addTestResult('✅ CORS test passed - API accessible');
      } else {
        setCorsStatus('error');
        addTestResult('❌ CORS test failed - Response not OK');
      }
    } catch (error) {
      setCorsStatus('error');
      addTestResult(`❌ CORS test failed - ${error}`);
    }
  };

  const checkCacheStatus = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          setCacheStatus('active');
          addTestResult('✅ Service Worker active');
        } else {
          setCacheStatus('inactive');
          addTestResult('⚠️ Service Worker not found');
        }
      });
    } else {
      setCacheStatus('inactive');
      addTestResult('⚠️ Service Worker not supported');
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearCache = async () => {
    if (isSafari) {
      await SafariCacheManager.getInstance().clearAllCaches();
      addTestResult('🧹 Safari cache cleared');
    } else {
      addTestResult('ℹ️ Not Safari - cache clear skipped');
    }
  };

  const forceRefresh = () => {
    if (isSafari) {
      SafariCacheManager.getInstance().forceRefresh();
    } else {
      window.location.reload();
    }
  };

  const testAPI = async () => {
    try {
      addTestResult('🔄 Testing API endpoint...');
      const response = await fetch('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        addTestResult('✅ API test successful');
        addTestResult(`📝 Response: ${data.message}`);
      } else {
        addTestResult(`❌ API test failed - Status: ${response.status}`);
      }
    } catch (error) {
      addTestResult(`❌ API test error: ${error}`);
    }
  };

  if (!isSafari) {
    return (
      <Card className="w-full max-w-md mx-auto mt-4">
        <CardHeader>
          <CardTitle>Safari Test Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This panel is designed for Safari testing. Current browser: {navigator.userAgent.split(' ')[0]}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🍎 Safari Test Panel
          <Badge variant={isSafari ? 'default' : 'secondary'}>
            {isSafari ? 'Safari Detected' : 'Not Safari'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">CORS Status</h4>
            <Badge variant={corsStatus === 'success' ? 'default' : corsStatus === 'error' ? 'destructive' : 'secondary'}>
              {corsStatus === 'success' ? '✅ Working' : corsStatus === 'error' ? '❌ Failed' : '🔄 Testing'}
            </Badge>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Cache Status</h4>
            <Badge variant={cacheStatus === 'active' ? 'default' : 'secondary'}>
              {cacheStatus === 'active' ? '✅ Active' : cacheStatus === 'inactive' ? '❌ Inactive' : '❓ Unknown'}
            </Badge>
          </div>
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={testCORS} variant="outline" size="sm">
            Test CORS
          </Button>
          <Button onClick={testAPI} variant="outline" size="sm">
            Test API
          </Button>
          <Button onClick={clearCache} variant="outline" size="sm">
            Clear Cache
          </Button>
          <Button onClick={forceRefresh} variant="outline" size="sm">
            Force Refresh
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          <h4 className="font-medium">Test Results</h4>
          <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No test results yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-xs font-mono mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p><strong>Testing Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Test CORS to verify API connectivity</li>
            <li>Use browser back/forward buttons</li>
            <li>Refresh page multiple times</li>
            <li>Switch to other tabs and back</li>
            <li>Clear cache if experiencing issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
