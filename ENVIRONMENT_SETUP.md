# Environment Configuration Guide

This document outlines the environment variables required for the Laundrify application to function properly.

## 🔒 Security Notice

All backend URLs, API endpoints, and external service URLs are now configured via environment variables for enhanced security and easier testing/deployment.

## Required Environment Variables

### Backend/API Configuration (Required)

```bash
# Primary backend API URL - REQUIRED
VITE_API_BASE_URL=https://your-backend-api.com/api

# Backend base URL (without /api) - REQUIRED  
VITE_BACKEND_URL=https://your-backend-api.com

# Frontend URL for CORS and redirects
VITE_FRONTEND_URL=https://your-frontend-domain.com
```

### Google Services

```bash
# Google Maps API Key - Required for maps functionality
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### External Service URLs (Optional - defaults provided)

```bash
# Nominatim API for geocoding
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# BigData Cloud API
VITE_BIGDATA_CLOUD_API_URL=https://api.bigdatacloud.net

# Gupshup WhatsApp API
VITE_GUPSHUP_API_URL=https://api.gupshup.io/wa/api/v1/msg
```

### Social Sharing URLs (Optional - defaults provided)

```bash
VITE_WHATSAPP_BASE_URL=https://wa.me/
VITE_TWITTER_SHARE_URL=https://twitter.com/intent/tweet
VITE_FACEBOOK_SHARE_URL=https://www.facebook.com/sharer/sharer.php
VITE_TELEGRAM_SHARE_URL=https://t.me/share/url
```

### CDN/Assets (Optional - defaults provided)

```bash
VITE_LAUNDRIFY_LOGO_URL=/placeholder.svg
VITE_CDN_BASE_URL=https://cdn.builder.io
```

### App Configuration (Optional - defaults provided)

```bash
VITE_APP_NAME=Laundrify
VITE_APP_URL=https://your-app-domain.com
VITE_NODE_ENV=production
```

## Environment Setup Instructions

### 1. Development Environment

Create a `.env.local` file in your project root:

```bash
# Development configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_BACKEND_URL=http://localhost:3001
VITE_FRONTEND_URL=http://localhost:8080
VITE_GOOGLE_MAPS_API_KEY=your_development_api_key
VITE_NODE_ENV=development
```

### 2. Production Environment

Set these environment variables in your hosting platform:

**For Vercel:**
```bash
vercel env add VITE_API_BASE_URL
vercel env add VITE_BACKEND_URL
vercel env add VITE_GOOGLE_MAPS_API_KEY
# ... add other required variables
```

**For Netlify:**
Add in Site Settings → Environment Variables

**For Railway:**
Add in Project Settings → Variables

### 3. Builder.io Environment

Configure in Builder.io project settings under Environment Variables.

## Validation

The application will automatically validate environment variables on startup:

- ❌ **Errors**: Missing required variables (will prevent app from working)
- ⚠️ **Warnings**: Missing optional variables (app will work with defaults)

Check the browser console for validation messages.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different API keys** for development and production
3. **Rotate API keys regularly** in production
4. **Use HTTPS URLs** for all production endpoints
5. **Validate all environment variables** before deployment

## Troubleshooting

### Common Issues

**Q: App shows "API_BASE_URL must be configured" error**
A: Set the `VITE_API_BASE_URL` environment variable with your backend API URL.

**Q: Maps functionality not working**
A: Ensure `VITE_GOOGLE_MAPS_API_KEY` is set with a valid Google Maps API key.

**Q: Backend requests failing**
A: Verify the `VITE_API_BASE_URL` is correct and the backend is running.

### Environment Variable Not Loading

1. Restart your development server after adding new variables
2. Ensure variable names start with `VITE_` prefix
3. Check for typos in variable names
4. Verify the hosting platform has the variables set

## Migration from Hardcoded URLs

If upgrading from a version with hardcoded URLs:

1. Copy `.env.example` to `.env.local`
2. Fill in your specific URLs and API keys
3. Test locally before deploying
4. Set environment variables in your hosting platform
5. Deploy and verify all functionality works

For support, check the console for detailed error messages and validation warnings.
