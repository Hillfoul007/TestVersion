# iOS Mobile Data Connectivity Fix

This document outlines the comprehensive fixes implemented to resolve the "Safari can't open the page because the server can't be found" error on iOS when using mobile data networks.

## Problem Description

The app works fine on:
- ✅ Android (WiFi and mobile data)
- ✅ iOS over WiFi
- ❌ iOS over mobile data (shows server not found error)

## Root Causes

1. **IPv6/IPv4 DNS Resolution**: iOS prefers IPv6 but Railway/server might not handle it properly
2. **Mobile Network Routing**: Carrier networks have different routing policies
3. **iOS Safari Network Stack**: Has specific requirements for mobile data connections
4. **Connection Timeouts**: Mobile networks have different timeout characteristics

## Implemented Fixes

### 1. Backend Server Fixes (`backend/server-laundry.js`)

```javascript
// IPv4 preference and iOS compatibility
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout
server.requestTimeout = 30000; // 30 seconds for individual requests
server.timeout = 30000; // Overall socket timeout
```

### 2. iOS Compatibility Middleware (`backend/middleware/iosCompatibility.js`)

- Forces HTTP/1.1 for iOS compatibility
- Sets iOS-specific headers
- Handles preflight requests
- Prevents caching issues on mobile data

### 3. Enhanced CORS Configuration

```javascript
// Special handling for iOS Safari on mobile data
origin: function (origin, callback) {
  // Allow requests with no origin (mobile apps)
  if (!origin) return callback(null, true);
  
  // Railway subdomain variations
  if (origin && (
    origin.includes('railway.app') || 
    origin.includes('laundrify-up.up.railway.app')
  )) {
    return callback(null, true);
  }
}
```

### 4. Frontend iOS Network Utils (`src/utils/iosNetworkUtils.ts`)

- **iOS Detection**: Detects iOS Safari specifically
- **Mobile Data Detection**: Identifies when on mobile data
- **Enhanced Fetch**: iOS-optimized fetch with retries
- **Connectivity Checker**: Validates server connection
- **Resource Preloading**: Warms up connections

### 5. Railway Configuration

#### `railway.json`
```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### `nixpacks.toml`
```toml
[env]
NODE_OPTIONS = '--max-old-space-size=300 --dns-result-order=ipv4first'
HOST = '0.0.0.0'
HTTP_TIMEOUT = '30000'
KEEP_ALIVE_TIMEOUT = '65000'
```

### 6. Updated API Client (`src/lib/apiClient.ts`)

- Uses iOS-specific fetch for mobile data
- Adds iOS compatibility headers
- Implements enhanced retry logic
- Handles mobile network timeouts

## Deployment Instructions

### Option 1: Automatic Deployment (Recommended)

```bash
# Make the script executable and run
./deploy-ios-fix.sh
```

### Option 2: Manual Railway Deployment

1. **Set Environment Variables:**
```bash
railway variables set NODE_OPTIONS="--max-old-space-size=300 --dns-result-order=ipv4first"
railway variables set HOST="0.0.0.0"
railway variables set HTTP_TIMEOUT="30000"
railway variables set KEEP_ALIVE_TIMEOUT="65000"
railway variables set IOS_COMPATIBILITY_MODE="true"
```

2. **Deploy:**
```bash
npm run render:build
railway up
```

### Option 3: One-Command Fix

```bash
# Build with iOS optimizations and deploy
NODE_OPTIONS="--max-old-space-size=300 --dns-result-order=ipv4first" npm run render:build && railway up
```

## Testing Instructions

### 1. iOS Safari Mobile Data Test

1. **Device Setup:**
   - Use iPhone/iPad with Safari
   - Disable WiFi, use mobile data only
   - Clear Safari cache and cookies

2. **Test Procedure:**
   - Navigate to `https://laundrify-up.up.railway.app/`
   - Try to log in with OTP
   - Monitor for "server can't be found" errors
   - Check browser console for connection issues

3. **Expected Results:**
   - ✅ App loads without "server not found" error
   - ✅ OTP requests work properly
   - ✅ API calls complete successfully
   - ✅ No connection timeouts

### 2. Connectivity Verification

```bash
# Check Railway logs for iOS requests
railway logs --tail

# Look for these log entries:
# "🍎 iOS Safari on mobile data detected"
# "iOS Fetch attempt X/Y"
# "iOS mobile data compatibility: Enhanced timeouts enabled"
```

### 3. Browser Console Checks

In iOS Safari Web Inspector, look for:
- ✅ `🍎 iOS Safari on mobile data detected`
- ✅ `✅ iOS connectivity check passed`
- ❌ Avoid: `⚠️ iOS connectivity issue detected`

## Monitoring & Troubleshooting

### 1. Railway Health Checks

The app now includes enhanced health checks at `/api/health`:
- Database connectivity
- Memory usage
- iOS compatibility status

### 2. iOS-Specific Logging

Look for these log patterns:
```
🍎 iOS Safari on mobile data detected
🌐 API Request [Attempt X/Y]
✅ iOS Fetch successful
⚠️ iOS connectivity issue detected
```

### 3. Common Issues & Solutions

#### Issue: Still getting "server not found"
**Solution:** 
- Check DNS settings: `NODE_OPTIONS=--dns-result-order=ipv4first`
- Verify Railway environment variables are set
- Check carrier DNS/proxy settings

#### Issue: OTP not received
**Solution:**
- Verify SMS service endpoint works: `/api/health`
- Check backend logs for SMS API errors
- Test with different mobile carriers

#### Issue: App loads but API calls fail
**Solution:**
- Check CORS headers in network tab
- Verify iOS compatibility headers are present
- Test `/api/health` endpoint directly

## Technical Details

### Why These Fixes Work

1. **IPv4 Preference**: Many mobile carriers have better IPv4 routing
2. **Enhanced Timeouts**: Mobile networks need longer connection times
3. **iOS Headers**: Safari has specific requirements for mobile data
4. **Connection Keep-Alive**: Reduces connection overhead on mobile
5. **Retry Logic**: Handles intermittent mobile network issues

### Performance Impact

- **Minimal**: Only affects iOS mobile data users
- **Backwards Compatible**: Works on all other platforms
- **Smart Detection**: Only applies optimizations when needed

## Files Modified

```
backend/
├── server-laundry.js (server timeouts, CORS)
├── middleware/iosCompatibility.js (new)
└── config/production.js (timeout settings)

src/
├── utils/iosNetworkUtils.ts (new)
├── lib/apiClient.ts (iOS fetch integration)
├── config/production.ts (iOS settings)
└── App.tsx (connectivity checks)

Railway Configuration:
├── railway.json (new)
├── nixpacks.toml (new)
└── deploy-ios-fix.sh (new)
```

## Verification Checklist

After deployment, verify:

- [ ] App loads on iOS Safari with mobile data
- [ ] OTP requests complete successfully  
- [ ] No "server can't be found" errors
- [ ] API endpoints respond correctly
- [ ] Health check endpoint returns 200
- [ ] Railway logs show iOS compatibility messages
- [ ] Browser console shows successful iOS detection

## Support

If issues persist after implementing these fixes:

1. **Check Railway logs**: `railway logs --tail`
2. **Test health endpoint**: `curl https://laundrify-up.up.railway.app/api/health`
3. **Verify environment variables**: `railway variables`
4. **Check DNS resolution**: Use online DNS lookup tools
5. **Test different carriers**: Try multiple mobile networks

This comprehensive fix addresses the iOS mobile data connectivity issue at multiple levels: DNS resolution, server configuration, middleware, client-side detection, and deployment optimization.
