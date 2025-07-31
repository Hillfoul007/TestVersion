const iosCompatibilityMiddleware = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMobileData = req.headers['connection'] && req.headers['connection'].includes('cellular');

  // Enhanced iOS mobile data detection
  const isIOSMobileData = isIOS && (
    isMobileData ||
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress !== '127.0.0.1'
  );

  // Set specific headers for iOS Safari compatibility on mobile networks
  if (isIOS) {
    // More aggressive connection management for iOS mobile data
    if (isIOSMobileData) {
      res.setHeader('Connection', 'close'); // Don't keep connections open for mobile data
      res.setHeader('Keep-Alive', 'timeout=30, max=1'); // Shorter keep-alive for mobile
    } else {
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Keep-Alive', 'timeout=120, max=100');
    }

    // iOS Safari specific headers for mobile data networks
    res.setHeader('X-iOS-Compatible', 'true');
    res.setHeader('X-Mobile-Data-Optimized', isIOSMobileData ? 'true' : 'false');

    // Prevent iOS mobile data caching issues
    if (req.path.startsWith('/api/')) {
      if (isIOSMobileData) {
        // More aggressive no-cache for mobile data
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '-1');
        res.setHeader('Last-Modified', new Date().toUTCString());
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }

    // Special handling for service worker requests from iOS
    if (req.path === '/sw.js') {
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }

  // Add CORS headers specifically for iOS Safari
  const origin = req.headers.origin;

  // Allow specific origins for Railway deployment
  if (origin && (
    origin.includes('railway.app') ||
    origin.includes('laundrify-up.up.railway.app') ||
    origin.includes('localhost')
  )) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests without origin (mobile apps, direct access)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, user-id, X-Requested-With, Origin, Cache-Control, Pragma, Expires, X-iOS-Compatible, X-Mobile-Data-Optimized');
  res.setHeader('Access-Control-Expose-Headers', 'Clear-Site-Data, X-iOS-Compatible, X-Mobile-Data-Optimized');

  // Enhanced iOS preflight handling
  if (req.method === 'OPTIONS') {
    if (isIOSMobileData) {
      res.setHeader('Access-Control-Max-Age', '3600'); // Shorter cache for mobile data
    } else {
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours for WiFi
    }
    return res.status(200).end();
  }

  // Set content type for iOS compatibility
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }

  // Add timeout handling for iOS mobile data
  if (isIOSMobileData) {
    const originalSend = res.send;
    const originalJson = res.json;

    // Ensure responses are sent quickly for mobile data
    res.send = function(data) {
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', Date.now() - req.startTime);
      }
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', Date.now() - req.startTime);
      }
      return originalJson.call(this, data);
    };

    req.startTime = Date.now();
  }

  next();
};

module.exports = iosCompatibilityMiddleware;
