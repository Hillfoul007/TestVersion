# Deployment Checklist

## Pre-Deployment Verification

### 1. Environment Variables ✅
- [ ] All `VITE_*` references changed to `REACT_APP_*`
- [ ] Deployment config files updated (`render.yaml`, `fly.toml`, etc.)
- [ ] Required environment variables set in deployment platform:
  - `REACT_APP_GOOGLE_MAPS_API_KEY`
  - `REACT_APP_API_BASE_URL`
  - `NODE_ENV=production`

### 2. Build Verification ✅
```bash
# Run these commands before deploying:
npm run verify-env          # Check environment variables
npm run build              # Ensure clean build
npm run start:prod         # Test production locally
```

### 3. Code Quality ✅
- [ ] No `import.meta.env.VITE_*` references in source code
- [ ] No console errors during build
- [ ] All critical features working locally

## Deployment Platform Configuration

### Fly.dev
```bash
# Set environment variables
fly secrets set REACT_APP_GOOGLE_MAPS_API_KEY=your_key
fly secrets set REACT_APP_API_BASE_URL=your_api_url
fly deploy
```

### Render.com
- Update `render.yaml` with `REACT_APP_*` variables
- Ensure build command: `npm run build`
- Static publish path: `dist`

### Railway
- Set environment variables in dashboard
- Use build command: `npm run build:production`

### Netlify
```bash
# Environment variables in UI or:
netlify env:set REACT_APP_GOOGLE_MAPS_API_KEY your_key
netlify deploy --prod
```

## Common Issues & Solutions

### Error: "Cannot read properties of undefined (reading 'VITE_*')"
**Cause**: Old build or missing environment variables
**Solution**:
1. Clear build cache: `rm -rf dist node_modules/.cache`
2. Update deployment environment variables to use `REACT_APP_*`
3. Rebuild and redeploy

### Error: "process.env is undefined"
**Cause**: Webpack not properly injecting environment variables
**Solution**: Verify `webpack.config.js` includes `DefinePlugin`

### API calls failing
**Cause**: Incorrect `REACT_APP_API_BASE_URL`
**Solution**: Check API URL in deployment environment variables

## Post-Deployment Verification

### 1. Check Console Logs
- [ ] No `VITE_*` error messages
- [ ] Environment variables loading correctly
- [ ] API calls succeeding

### 2. Test Core Features
- [ ] Address search working (Google Maps)
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Service booking flow

### 3. Monitor Performance
- [ ] Page load times acceptable
- [ ] No JavaScript errors
- [ ] Mobile responsiveness

## Emergency Rollback

If deployment fails:
1. Check deployment platform logs
2. Verify environment variables are set correctly
3. If needed, rollback to previous working deployment
4. Fix issues and redeploy

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Yes | Google Maps JavaScript API key |
| `REACT_APP_API_BASE_URL` | Yes | Backend API URL |
| `REACT_APP_GOOGLE_MAPS_MAP_ID` | No | Google Maps Map ID for advanced markers |
| `NODE_ENV` | Yes | Should be "production" for deployment |
| `PORT` | No | Server port (defaults to 3001) |
