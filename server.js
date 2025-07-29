const express = require('express');
const path = require('path');
const cors = require('cors');

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

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

app.listen(port, () => {
  console.log(`🚀 Laundrify server running on port ${port}`);
  console.log(`Frontend: http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
});
