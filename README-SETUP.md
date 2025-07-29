# Laundrify - React Application Setup

## 🎯 Quick Start

### Development Mode (No Database Required)
```bash
npm install
npm run dev:full
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Uses mock data, no MongoDB required

### Production Mode (Database Required)
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your actual MongoDB credentials

# 2. Build and deploy
npm run deploy
```
- Single URL: http://localhost:3001
- Serves both frontend and API

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend only (development) |
| `npm run dev:backend` | Backend only (development) |
| `npm run dev:full` | Both frontend + backend (development) |
| `npm run build` | Build frontend for production |
| `npm run start:prod` | Start production server |
| `npm run deploy` | Build + start production |

## 🔧 Environment Setup

### Development
No setup needed! The dev server runs without MongoDB.

### Production
1. Copy `.env.example` to `.env`
2. Update these variables:
   - `MONGODB_USERNAME` - Your MongoDB username
   - `MONGODB_PASSWORD` - Your MongoDB password  
   - `MONGODB_CLUSTER` - Your MongoDB cluster URL
   - `JWT_SECRET` - Secret key for authentication
   - `REACT_APP_GOOGLE_MAPS_API_KEY` - Google Maps API key

## 📁 Project Structure

```
├── src/                    # React frontend source
├── backend/               # Original backend code
├── dist/                  # Built frontend (after npm run build)
├── server.js             # Unified production server
├── dev-server.js         # Development backend server
├── webpack.config.js     # Frontend build configuration
└── package.json          # Dependencies and scripts
```

## 🚀 Deployment

### Single Server Deployment
```bash
npm run deploy
```
This builds the frontend and starts a unified server serving both frontend and API on port 3001.

### Separate Deployment
- Frontend: Build with `npm run build`, serve `dist/` folder
- Backend: Use existing `backend/` folder with Node.js

## 🔍 Troubleshooting

### "MongoDB connection failed"
- **Development**: Ignore this, app works without database
- **Production**: Check your MongoDB credentials in `.env`

### "Cannot find module"
```bash
npm install
cd backend && npm install
```

### Port conflicts
- Development frontend: Port 3000
- Development backend: Port 3001  
- Production unified: Port 3001 (configurable via PORT env var)
