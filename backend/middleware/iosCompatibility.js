const iosCompatibilityMiddleware = (req, res, next) => {
  // Set specific headers for iOS Safari compatibility on mobile networks
  
  // Force HTTP/1.1 for iOS compatibility
  res.setHeader('Connection', 'keep-alive');
  
  // iOS Safari specific headers for mobile data networks
  res.setHeader('X-iOS-Compatible', 'true');
  
  // Prevent caching issues on iOS mobile data
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, user-id, X-Requested-With, Origin, Cache-Control, Pragma, Expires, X-iOS-Compatible');
  res.setHeader('Access-Control-Expose-Headers', 'Clear-Site-Data, X-iOS-Compatible');

  // Handle iOS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }
  
  // Set content type for iOS compatibility
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  
  next();
};

module.exports = iosCompatibilityMiddleware;
