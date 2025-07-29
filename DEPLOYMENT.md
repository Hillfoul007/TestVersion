# Deployment Guide

## Environment Variables Required

When deploying to production, ensure these environment variables are set:

### Required Variables
```bash
NODE_ENV=production
PORT=3001

# MongoDB (Required for production)
MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
MONGODB_CLUSTER=your_cluster.mongodb.net
MONGODB_DATABASE=homeservices

# JWT Authentication
JWT_SECRET=your_jwt_secret_key

# Google Maps (Required for address functionality)
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyC_YOUR_ACTUAL_API_KEY
REACT_APP_GOOGLE_MAPS_MAP_ID=your_map_id_optional
```

### Optional Variables
```bash
# SMS Services
REACT_APP_DVHOSTING_API_KEY=your_dvhosting_key
REACT_APP_EXOTEL_API_KEY=your_exotel_key
REACT_APP_EXOTEL_TOKEN=your_exotel_token

# WhatsApp
REACT_APP_GUPSHUP_API_KEY=your_gupshup_key
REACT_APP_GUPSHUP_SOURCE_NUMBER=your_whatsapp_number
```

## Deployment Platforms

### Fly.dev
1. Set environment variables in `fly.toml` or via CLI:
```bash
fly secrets set REACT_APP_GOOGLE_MAPS_API_KEY=your_key
fly secrets set MONGODB_USERNAME=your_username
# ... etc
```

### Render.com
1. Set environment variables in the Render dashboard
2. Use the `render.yaml` file (update with REACT_APP_ prefixes)

### Railway
1. Set environment variables in Railway dashboard
2. Deploy using: `npm run build:production`

## Important Notes

1. **Environment Variable Prefix**: All frontend environment variables must use `REACT_APP_` prefix
2. **Build Process**: Run `npm run build` to create production assets
3. **Server**: Use `npm run start:prod` for unified frontend+backend server
4. **Google Maps**: Without a valid API key, address search will be limited

## Troubleshooting

### "Cannot read properties of undefined (reading 'VITE_GOOGLE_MAPS_API_KEY')"
- **Cause**: Old cached build or missing environment variables
- **Solution**: 
  1. Clear build cache: `rm -rf dist node_modules/.cache`
  2. Set `REACT_APP_GOOGLE_MAPS_API_KEY` environment variable
  3. Rebuild: `npm run build`

### MongoDB Connection Failed
- **Development**: Ignore, app works without database
- **Production**: Check MongoDB credentials are correct

### API Endpoints Not Working
- **Check**: Environment variables are set correctly
- **Verify**: `process.env.REACT_APP_*` variables are available
