// iOS Safari mobile data network compatibility utilities

interface IOSNetworkConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
}

const defaultConfig: IOSNetworkConfig = {
  timeout: 60000, // 60 seconds for iOS mobile networks (increased from 30s)
  retries: 2, // Reduced retries to avoid long waits
  retryDelay: 3000, // 3 seconds between retries (increased)
};

// Detect iOS Safari
export const isIOSSafari = (): boolean => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
  return isIOS && isSafari;
};

// Detect if on mobile data (heuristic approach)
export const isProbablyMobileData = (): boolean => {
  // Check connection type if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    // If connection type indicates cellular
    return connection.type === 'cellular' || 
           connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' || 
           connection.effectiveType === '3g';
  }
  
  // Fallback heuristic: slow connection speed
  return connection?.downlink && connection.downlink < 1; // Less than 1 Mbps
};

// Enhanced fetch for iOS mobile data networks
export const iosFetch = async (
  url: string, 
  options: RequestInit = {}, 
  config: Partial<IOSNetworkConfig> = {}
): Promise<Response> => {
  const finalConfig = { ...defaultConfig, ...config };
  
  // Add iOS-specific headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'X-iOS-Compatible': 'true',
    ...options.headers,
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    // Force credentials for iOS
    credentials: 'include',
    // Set timeout
    signal: AbortSignal.timeout(finalConfig.timeout),
  };

  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.retries; attempt++) {
    try {
      console.log(`🍎 iOS Fetch attempt ${attempt}/${finalConfig.retries} to ${url}`);
      
      const response = await fetch(url, fetchOptions);
      
      if (response.ok) {
        console.log(`✅ iOS Fetch successful on attempt ${attempt}`);
        return response;
      }
      
      // If response is not ok, treat as error for retry logic
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ iOS Fetch attempt ${attempt} failed:`, error);
      
      // Don't retry on last attempt
      if (attempt === finalConfig.retries) {
        break;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
    }
  }

  console.error(`❌ iOS Fetch failed after ${finalConfig.retries} attempts:`, lastError);
  throw lastError;
};

// Network connectivity checker for iOS
export const checkIOSConnectivity = async (): Promise<boolean> => {
  try {
    const response = await iosFetch('/api/health', {
      method: 'GET',
    }, {
      timeout: 10000, // 10 second timeout for connectivity check
      retries: 1, // Single retry for quick check
    });
    
    return response.ok;
  } catch (error) {
    console.error('🍎 iOS connectivity check failed:', error);
    return false;
  }
};

// Preload critical resources for iOS
export const preloadForIOS = async (): Promise<void> => {
  if (!isIOSSafari()) return;
  
  try {
    // Preload health check endpoint to warm up connection
    await iosFetch('/api/health', { method: 'GET' }, { retries: 1 });
    console.log('🍎 iOS preload completed successfully');
  } catch (error) {
    console.warn('⚠️ iOS preload failed:', error);
  }
};

export default {
  isIOSSafari,
  isProbablyMobileData,
  iosFetch,
  checkIOSConnectivity,
  preloadForIOS,
};
