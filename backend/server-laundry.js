const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// Load environment variables
dotenv.config();

// Load production configuration
const productionConfig = require("./config/production");

// Validate configuration
try {
  productionConfig.validateConfig();
} catch (error) {
  console.error("❌ Configuration Error:", error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || productionConfig.PORT || 3001;

// iOS compatibility middleware - MUST be first for mobile data networks
const iosCompatibilityMiddleware = require('./middleware/iosCompatibility');
app.use(iosCompatibilityMiddleware);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false,
    frameguard: false, // Allow iframe display for development
  }),
);

// Compression middleware
app.use(compression());

// Enhanced logging middleware
const detailedLogger = require('./middleware/detailedLogger');

// Use detailed custom logger
app.use(detailedLogger);

// Debug middleware to track request processing
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  req.requestId = requestId;

  console.log(`🎯 REQUEST_START [${requestId}] ${req.method} ${req.originalUrl}`);

  // Track when response finishes
  res.on('finish', () => {
    console.log(`🏁 REQUEST_END [${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
  });

  next();
});

// Morgan middleware with custom format
if (productionConfig.isProduction()) {
  // Custom production format with more details
  const productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';
  app.use(morgan(productionFormat));
} else {
  // Enhanced development format
  const devFormat = ':method :url :status :response-time ms - :res[content-length]';
  app.use(morgan(devFormat));
}

// Trust proxy for rate limiting
if (productionConfig.isProduction()) {
  app.set('trust proxy', 1); // Trust first proxy for production
}

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: productionConfig.RATE_LIMIT.WINDOW_MS,
  max: productionConfig.RATE_LIMIT.MAX_REQUESTS,
  message: { error: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: productionConfig.RATE_LIMIT.AUTH_WINDOW_MS,
  max: productionConfig.RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: {
    error: "Too many authentication attempts, please try again later",
  },
});

// Apply rate limiting only to API endpoints
if (productionConfig.isProduction()) {
  app.use(generalLimiter);
} else {
  // In development, only rate limit API endpoints
  app.use("/api", generalLimiter);
}
app.use("/api/auth", authLimiter);

// Middleware to add cache control headers for iOS and explicit CORS headers
app.use("/api", (req, res, next) => {
  // Add explicit CORS headers for API routes
  const origin = req.headers.origin;
  console.log(`🔍 API CORS middleware - Origin: ${origin}`);

  if (origin && (
    origin.includes('railway.app') ||
    origin.includes('laundrify-up.up.railway.app') ||
    origin.includes('cleancare-pro-frontend-testversion-pr-81.up.railway.app') ||
    origin.includes('cleancare-pro-api-testversion-pr-81.up.railway.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    productionConfig.ALLOWED_ORIGINS.includes(origin)
  )) {
    console.log(`✅ API CORS: Allowing origin ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    console.log('✅ API CORS: Allowing request with no origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    console.log(`⚠️ API CORS: Origin ${origin} not explicitly allowed but setting anyway`);
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, user-id, Cache-Control, Pragma, Expires, X-Requested-With, Origin, X-iOS-Compatible');
  res.setHeader('Access-Control-Expose-Headers', 'Clear-Site-Data, X-iOS-Compatible');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    console.log(`✅ API CORS: Handling OPTIONS preflight for ${origin}`);
    return res.status(200).end();
  }

  next();
});

app.use("/api/auth", (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// CORS configuration - Enhanced for iOS Safari compatibility on mobile data
app.use(
  cors({
    origin: function (origin, callback) {
      console.log(`🔍 CORS origin check: ${origin}`);
      console.log(`🔍 CORS allowed origins:`, productionConfig.ALLOWED_ORIGINS);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ CORS: Allowing request with no origin');
        return callback(null, true);
      }

      // Check against allowed origins from config
      if (productionConfig.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
        console.log('✅ CORS: Origin found in allowed origins list');
        return callback(null, true);
      }

      // Special handling for Railway domains - more permissive for deployment
      if (origin && (
        origin.includes('railway.app') ||
        origin.includes('railway.com') ||
        origin.includes('laundrify-up.up.railway.app') ||
        origin.includes('cleancare-pro-frontend-testversion-pr-81.up.railway.app') ||
        origin.includes('cleancare-pro-api-production-129e.up.railway.app') ||
        origin.includes('cleancare-pro-api-testversion-pr-81.up.railway.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      )) {
        console.log('✅ CORS: Allowing Railway/localhost domain');
        return callback(null, true);
      }

      // More permissive approach - allow all origins in production for now
      console.log(`⚠️ CORS: Origin ${origin} not in whitelist, but allowing anyway to fix CORS issues`);
      return callback(null, true);
    },
    credentials: true, // Enable credentials for iOS
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "user-id",
      "Cache-Control",
      "Pragma",
      "Expires",
      "X-Requested-With",
      "Origin",
      "X-iOS-Compatible",
      "Access-Control-Allow-Origin"
    ],
    exposedHeaders: ["Clear-Site-Data", "X-iOS-Compatible"],
    optionsSuccessStatus: 200, // Support legacy browsers and iOS
    preflightContinue: false,
    maxAge: 86400 // 24 hours cache for preflight requests
  }),
);


// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB connection with production configuration
const connectDB = async () => {
  try {
    // Use production MongoDB URI
    const mongoURI = productionConfig.MONGODB_URI;
    ("mongodb+srv://sunflower110001:fV4LhLpWlKj5Vx87@cluster0.ic8p792.mongodb.net/cleancare_pro?retryWrites=true&w=majority");

    await mongoose.connect(mongoURI);

    console.log(
      "✅ MongoDB connected successfully to:",
      mongoURI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"),
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("⚠️ Running in mock mode without database");
  }
};

// Connect to database
connectDB();

// Google Sheets services removed

// Import routes with error handling
let otpAuthRoutes, bookingRoutes, locationRoutes;

try {
  otpAuthRoutes = require("./routes/otp-auth");
  console.log("✅ OTP Auth routes loaded");
} catch (error) {
  console.error("❌ Failed to load OTP Auth routes:", error.message);
}

try {
  bookingRoutes = require("./routes/bookings");
  console.log("✅ Booking routes loaded");
} catch (error) {
  console.error("❌ Failed to load Booking routes:", error.message);
}

try {
  locationRoutes = require("./routes/location");
  console.log("✅ Location routes loaded");
} catch (error) {
  console.error("❌ Failed to load Location routes:", error.message);
}

// Serve static frontend files in production
if (productionConfig.isProduction()) {
  const frontendPath = path.join(__dirname, "../dist");
  app.use(express.static(frontendPath));
  console.log("📁 Serving frontend static files from:", frontendPath);
}

// API Routes with error handling
if (otpAuthRoutes) {
  app.use("/api/auth", otpAuthRoutes);
  console.log("��� Auth routes registered at /api/auth");
}

if (bookingRoutes) {
  app.use("/api/bookings", bookingRoutes);
  console.log("🔗 Booking routes registered at /api/bookings");
}

if (locationRoutes) {
  app.use("/api/location", locationRoutes);
  console.log("🔗 Location routes registered at /api/location");
}

// WhatsApp Auth routes
try {
  const whatsappAuthRoutes = require("./routes/whatsapp-auth");
  app.use("/api/whatsapp", whatsappAuthRoutes);
  console.log("🔗 WhatsApp Auth routes registered at /api/whatsapp");
} catch (error) {
  console.error("❌ Failed to load WhatsApp Auth routes:", error.message);
}

// Addresses routes
try {
  const addressRoutes = require("./routes/addresses");
  app.use("/api/addresses", addressRoutes);
  console.log("🔗 Address routes registered at /api/addresses");
} catch (error) {
  console.error("❌ Failed to load Address routes:", error.message);
}

// Google Maps proxy routes
try {
  const googleMapsRoutes = require("./routes/google-maps");
  app.use("/api/google-maps", googleMapsRoutes);
  console.log("🔗 Google Maps proxy routes registered at /api/google-maps");
} catch (error) {
  console.error("❌ Failed to load Google Maps proxy routes:", error.message);
}

// Google Sheets routes removed

// Dynamic Services routes
try {
  const dynamicServicesRoutes = require("./routes/dynamic-services");
  app.use("/api/services", dynamicServicesRoutes);
  console.log("🔗 Dynamic Services routes registered at /api/services");
} catch (error) {
  console.error("❌ Failed to load Dynamic Services routes:", error.message);
}

// Referral routes
try {
  const referralRoutes = require("./routes/referrals");
  app.use("/api/referrals", referralRoutes);
  console.log("🔗 Referral routes registered at /api/referrals");
} catch (error) {
  console.error("❌ Failed to load Referral routes:", error.message);
}

// Detected Locations routes
try {
  const detectedLocationRoutes = require("./routes/detected-locations");
  app.use("/api/detected-locations", detectedLocationRoutes);
  console.log(
    "🔗 Detected Locations routes registered at /api/detected-locations",
  );
} catch (error) {
  console.error("❌ Failed to load Detected Locations routes:", error.message);
}

// Admin routes for database maintenance
try {
  const adminRoutes = require("./routes/admin");
  app.use("/api/admin", adminRoutes);
  console.log("🔗 Admin routes registered at /api/admin");
} catch (error) {
  console.error("❌ Failed to load Admin routes:", error.message);
}

// Google Sheets integration removed

// Push notification endpoints
app.post("/api/push/subscribe", (req, res) => {
  // Store push subscription in database
  // In production, save this to your user's profile
  console.log("Push subscription received:", req.body);
  res.json({ success: true });
});

app.post("/api/push/unsubscribe", (req, res) => {
  // Remove push subscription from database
  console.log("Push unsubscribe request");
  res.json({ success: true });
});

// Health check endpoint with comprehensive monitoring
app.get("/api/health", async (req, res) => {
  const healthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "CleanCare Pro API",
    version: "1.0.0",
    environment: productionConfig.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: "unknown",
    features: productionConfig.FEATURES,
  };

  // Check database connection
  try {
    if (mongoose.connection.readyState === 1) {
      healthCheck.database = "connected";
    } else {
      healthCheck.database = "disconnected";
      healthCheck.status = "degraded";
    }
  } catch (error) {
    healthCheck.database = "error";
    healthCheck.status = "unhealthy";
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  if (memoryUsage.heapUsed > productionConfig.MEMORY_THRESHOLD) {
    healthCheck.status = "degraded";
    healthCheck.warning = "High memory usage";
  }

  const statusCode =
    healthCheck.status === "ok"
      ? 200
      : healthCheck.status === "degraded"
        ? 200
        : 503;

  res.status(statusCode).json(healthCheck);
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "CleanCare Pro API is working!",
    timestamp: new Date().toISOString(),
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Global Error Handler:", err);

  // Log error details in production
  if (productionConfig.isProduction()) {
    console.error("Error Stack:", err.stack);
    console.error("Request Details:", {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    });
  }

  // Return appropriate error response
  const statusCode = err.statusCode || 500;
  const message = productionConfig.isProduction()
    ? "Internal server error"
    : err.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
    error: productionConfig.isDevelopment() ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });
});

// Development root route to prevent 404s
if (productionConfig.isDevelopment()) {
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "CleanCare Pro API Server",
      environment: "development",
      frontend: "http://localhost:10000",
      api: "http://localhost:3001/api",
      availableRoutes: [
        "/api/health",
        "/api/test",
        "/api/auth",
        "/api/bookings",
        "/api/addresses",
        "/api/location",
        "/api/whatsapp",
      ],
    });
  });
}

// Catch-all handler: send back React's index.html file for frontend routing
if (productionConfig.isProduction()) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
  console.log(
    "🔗 Frontend routing configured - all non-API routes serve index.html",
  );
} else {
  // Handle 404 routes only in development (production uses catch-all for SPA)
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
      availableRoutes: [
        "/api/health",
        "/api/test",
        "/api/auth",
        "/api/bookings",
        "/api/addresses",
        "/api/location",
        "/api/whatsapp",
      ],
    });
  });
}

// Keep-alive mechanism for Render deployment
const setupKeepAlive = () => {
  if (productionConfig.isProduction()) {
    const keepAliveInterval = 5 * 60 * 1000; // 5 minutes in milliseconds

    setInterval(async () => {
      try {
        const url =
          process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        const response = await fetch(`${url}/api/health`);

        if (response.ok) {
          console.log("🔄 Keep-alive ping successful");
        } else {
          console.log(
            "⚠️ Keep-alive ping failed with status:",
            response.status,
          );
        }
      } catch (error) {
        console.log("⚠️ Keep-alive ping error:", error.message);
      }
    }, keepAliveInterval);

    console.log("🔄 Keep-alive mechanism started (5 min intervals)");
  }
};

// Start server with error handling - explicit IPv4 binding for iOS mobile data compatibility
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CleanCare Pro server running on port ${PORT}`);
  console.log(`📱 Environment: ${productionConfig.NODE_ENV}`);
  if (productionConfig.isProduction()) {
    console.log(`🌐 Frontend and API available at: http://localhost:${PORT}`);
  } else {
    console.log(`📱 API available at: http://localhost:${PORT}/api`);
  }
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Security: Helmet enabled`);
  console.log(`⚡ Compression: Enabled`);
  console.log(`🛡️  Rate limiting: Enabled`);

  if (productionConfig.FEATURES.SMS_VERIFICATION) {
    console.log(`📱 SMS Service: DVHosting`);
  }

  // Start keep-alive mechanism
  setupKeepAlive();

  // Google Sheets integration removed
});

// Configure server timeouts for iOS mobile data networks
server.keepAliveTimeout = 65000; // 65 seconds (AWS ALB timeout is 60s)
server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout
server.requestTimeout = 30000; // 30 seconds for individual requests
server.timeout = 30000; // Overall socket timeout

console.log('🍎 iOS mobile data compatibility: Enhanced timeouts and IPv4 preference enabled');

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n�� Received ${signal}. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      console.error("❌ Error during server shutdown:", err);
      process.exit(1);
    }

    console.log("✅ HTTP server closed");

    // Google Sheets cleanup removed

    // Close database connection
    mongoose.connection.close(false, (err) => {
      if (err) {
        console.error("❌ Error closing MongoDB connection:", err);
        process.exit(1);
      }

      console.log("✅ MongoDB connection closed");
      console.log("👋 Graceful shutdown completed");
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after 30 seconds");
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("��� Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
