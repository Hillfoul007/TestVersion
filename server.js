const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const { connectDB } = require('./backend/config/database');

// Import backend routes
const bookingsRoutes = require('./backend/routes/bookings');
const addressesRoutes = require('./backend/routes/addresses');
const adminRoutes = require('./backend/routes/admin');
const dynamicServicesRoutes = require('./backend/routes/dynamic-services');
const googleMapsRoutes = require('./backend/routes/google-maps');
const locationRoutes = require('./backend/routes/location');
const otpAuthRoutes = require('./backend/routes/otp-auth');
const pingRoutes = require('./backend/routes/ping');
const ridersRoutes = require('./backend/routes/riders');
const servicesRoutes = require('./backend/routes/services');
const userRoutes = require('./backend/routes/user');
const webhooksRoutes = require('./backend/routes/webhooks');
const detectedLocationsRoutes = require('./backend/routes/detected-locations');

const app = express();
const port = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://laundrify-app.onrender.com', 'https://laundrify.onrender.com']
    : ['http://localhost:3000', 'http://localhost:10000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.use('/api/bookings', bookingsRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dynamic-services', dynamicServicesRoutes);
app.use('/api/google-maps', googleMapsRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/otp-auth', otpAuthRoutes);
app.use('/api/ping', pingRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/detected-locations', detectedLocationsRoutes);

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`🚀 Laundrify server running on port ${port}`);
      console.log(`Frontend: http://localhost:${port}`);
      console.log(`API: http://localhost:${port}/api`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
