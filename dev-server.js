const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple test routes for development
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Backend is running!', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Development server is working', 
    environment: 'development',
    note: 'MongoDB connection is disabled in development mode'
  });
});

// Mock API routes for development
app.get('/api/bookings', (req, res) => {
  res.json({ bookings: [], message: 'MongoDB connection required for real data' });
});

app.get('/api/addresses', (req, res) => {
  res.json({ addresses: [], message: 'MongoDB connection required for real data' });
});

app.get('/api/riders', (req, res) => {
  res.json({ riders: [], message: 'MongoDB connection required for real data' });
});

// Catch all API routes
app.use('/api/*', (req, res) => {
  res.status(501).json({ 
    error: 'API endpoint not implemented in dev mode',
    endpoint: req.originalUrl,
    method: req.method
  });
});

app.listen(port, () => {
  console.log(`🔧 Development backend server running on port ${port}`);
  console.log(`🌐 API available at: http://localhost:${port}/api`);
  console.log(`💡 This is a minimal dev server. Use production mode for full functionality.`);
});
