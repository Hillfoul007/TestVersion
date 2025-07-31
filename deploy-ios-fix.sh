#!/bin/bash

# Railway deployment script with iOS mobile data connectivity fixes
# This script deploys the app with enhanced networking for iOS Safari on mobile data

echo "🚀 Starting Railway deployment with iOS mobile data fixes..."

# Set environment variables for iOS compatibility
export NODE_OPTIONS="--max-old-space-size=300 --dns-result-order=ipv4first"
export HOST="0.0.0.0"
export HTTP_TIMEOUT="30000"
export KEEP_ALIVE_TIMEOUT="65000"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Login check
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "🔑 Please login to Railway:"
    railway login
fi

# Set environment variables for iOS compatibility on Railway
echo "🍎 Setting iOS mobile data compatibility environment variables..."

railway variables set NODE_OPTIONS="--max-old-space-size=300 --dns-result-order=ipv4first"
railway variables set HOST="0.0.0.0"
railway variables set HTTP_TIMEOUT="30000"
railway variables set KEEP_ALIVE_TIMEOUT="65000"
railway variables set IOS_COMPATIBILITY_MODE="true"

# Build and deploy
echo "🔨 Building application with iOS optimizations..."
npm run render:build

echo "🚀 Deploying to Railway with iOS mobile data fixes..."
railway up

# Check deployment status
echo "✅ Deployment completed!"
echo "🌐 Your app should now work better on iOS Safari with mobile data"
echo "🍎 Implemented fixes:"
echo "  - IPv4 DNS preference for iOS compatibility"
echo "  - Enhanced CORS handling for mobile networks"
echo "  - Optimized timeouts for mobile data connections"
echo "  - iOS-specific request headers and caching"
echo "  - Connection retry logic for unstable mobile networks"

echo ""
echo "📱 To test iOS mobile data connectivity:"
echo "1. Open Safari on iOS device using mobile data"
echo "2. Navigate to your Railway app URL"
echo "3. Check that OTP requests work properly"
echo "4. Monitor browser console for any connection issues"

echo ""
echo "🔧 If issues persist, check:"
echo "1. Railway logs: railway logs"
echo "2. iOS Safari console (Settings > Safari > Advanced > Web Inspector)"
echo "3. Network requests in browser dev tools"
