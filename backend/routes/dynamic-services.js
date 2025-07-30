const express = require("express");
const router = express.Router();

// Service cache
let servicesCache = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default services structure - removed Google Sheets integration
const DEFAULT_SERVICES = [
  {
    id: "wash-fold",
    name: "Wash & Fold",
    icon: "👕",
    color: "from-blue-500 to-blue-600",
    description: "Professional washing and folding service",
    enabled: true,
    services: [
      {
        id: "wf-regular",
        name: "Laundry and Fold",
        category: "Wash & Fold",
        price: 70,
        unit: "per kg",
        description: "Regular wash and fold service",
        minQuantity: 1,
        popular: true,
        enabled: true,
        image: "",
      },
      {
        id: "wf-bulk",
        name: "Laundry and Fold (Bulk)",
        category: "Wash & Fold",
        price: 60,
        unit: "per kg",
        description: "Bulk pricing for 3kg and above",
        minQuantity: 3,
        enabled: true,
        image: "",
      },
    ],
  },
  {
    id: "wash-iron",
    name: "Wash & Iron",
    icon: "🏷️",
    color: "from-green-500 to-green-600",
    description: "Washing with professional ironing",
    enabled: true,
    services: [
      {
        id: "wi-shirt",
        name: "Shirt",
        category: "Wash & Iron",
        price: 25,
        unit: "per piece",
        description: "Professional shirt washing and ironing",
        minQuantity: 1,
        popular: true,
        enabled: true,
        image: "/images/Shirt.png",
      },
      {
        id: "wi-trouser",
        name: "Trouser & Jeans",
        category: "Wash & Iron",
        price: 35,
        unit: "per piece",
        description: "Trouser and jeans washing with ironing",
        minQuantity: 1,
        enabled: true,
        image: "/images/Trouser&Jeans.png",
      },
      {
        id: "wi-kurta",
        name: "Kurta Pyjama",
        category: "Wash & Iron",
        price: 45,
        unit: "per piece",
        description: "Traditional kurta pyjama set cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Kurta Pyjama.png",
      },
      {
        id: "wi-dress",
        name: "Dress",
        category: "Wash & Iron",
        price: 40,
        unit: "per piece",
        description: "Professional dress cleaning and pressing",
        minQuantity: 1,
        enabled: true,
        image: "/images/Dress.png",
      },
    ],
  },
  {
    id: "dry-cleaning",
    name: "Dry Cleaning",
    icon: "🧥",
    color: "from-purple-500 to-purple-600",
    description: "Professional dry cleaning for delicate items",
    enabled: true,
    services: [
      {
        id: "dc-suit",
        name: "Men Suit 3 PC",
        category: "Dry Cleaning",
        price: 250,
        unit: "per piece",
        description: "Complete 3-piece suit dry cleaning",
        minQuantity: 1,
        popular: true,
        enabled: true,
        image: "/images/Men suit 3 PC.png",
      },
      {
        id: "dc-suit-2pc",
        name: "Suit 2 PC",
        category: "Dry Cleaning",
        price: 180,
        unit: "per piece",
        description: "2-piece suit dry cleaning service",
        minQuantity: 1,
        enabled: true,
        image: "/images/Suit 2 PC.png",
      },
      {
        id: "dc-saree-heavy",
        name: "Saree Heavy Work",
        category: "Dry Cleaning",
        price: 150,
        unit: "per piece",
        description: "Heavy work saree dry cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Saree Heavy work.png",
      },
      {
        id: "dc-saree-silk",
        name: "Saree Silk",
        category: "Dry Cleaning",
        price: 120,
        unit: "per piece",
        description: "Silk saree specialized cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Saree Silk.png",
      },
      {
        id: "dc-sherwani",
        name: "Sherwani",
        category: "Dry Cleaning",
        price: 200,
        unit: "per piece",
        description: "Traditional sherwani dry cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Sherwani.png",
      },
      {
        id: "dc-jacket",
        name: "Jacket",
        category: "Dry Cleaning",
        price: 120,
        unit: "per piece",
        description: "Professional jacket cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Jacket.png",
      },
      {
        id: "dc-coat",
        name: "Coat",
        category: "Dry Cleaning",
        price: 140,
        unit: "per piece",
        description: "Long coat dry cleaning service",
        minQuantity: 1,
        enabled: true,
        image: "/images/Coat.png",
      },
      {
        id: "dc-sweater",
        name: "Sweater",
        category: "Dry Cleaning",
        price: 80,
        unit: "per piece",
        description: "Woolen sweater dry cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Sweater.png",
      },
      {
        id: "dc-leather",
        name: "Leather Jacket",
        category: "Dry Cleaning",
        price: 300,
        unit: "per piece",
        description: "Specialized leather jacket cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Leather jacket.png",
      },
      {
        id: "dc-shawl",
        name: "Shawl",
        category: "Dry Cleaning",
        price: 90,
        unit: "per piece",
        description: "Delicate shawl cleaning service",
        minQuantity: 1,
        enabled: true,
        image: "/images/Shawl.png",
      },
      {
        id: "dc-pashmina",
        name: "Pashmina",
        category: "Dry Cleaning",
        price: 110,
        unit: "per piece",
        description: "Premium pashmina cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Pashmina.png",
      },
      {
        id: "dc-plazo",
        name: "Plazo",
        category: "Dry Cleaning",
        price: 70,
        unit: "per piece",
        description: "Plazo dry cleaning service",
        minQuantity: 1,
        enabled: true,
        image: "/images/Plazo.png",
      },
      {
        id: "dc-skirt-heavy",
        name: "Skirt Heavy Work",
        category: "Dry Cleaning",
        price: 95,
        unit: "per piece",
        description: "Heavy work skirt cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Skirt Heavy Work.png",
      },
      {
        id: "dc-long-coat",
        name: "Long Coat",
        category: "Dry Cleaning",
        price: 180,
        unit: "per piece",
        description: "Extended length coat cleaning",
        minQuantity: 1,
        enabled: true,
        image: "/images/Long Coat.png",
      },
    ],
  },
];

// Function to get services (simplified without Google Sheets)
async function getServices() {
  // Check cache first
  const now = Date.now();
  if (servicesCache.length > 0 && now - lastFetch < CACHE_DURATION) {
    console.log("📊 Returning cached services");
    return servicesCache;
  }

  console.log("📊 Loading default services (Google Sheets integration removed)");
  
  // Use default services
  servicesCache = DEFAULT_SERVICES;
  lastFetch = now;
  
  return servicesCache;
}

// Routes

// GET /api/services - Get all service categories
router.get("/", async (req, res) => {
  try {
    const services = await getServices();
    
    res.json({
      success: true,
      data: services,
      source: "static_config",
      lastUpdated: new Date(lastFetch).toISOString(),
      cache: {
        duration: CACHE_DURATION,
        nextRefresh: new Date(lastFetch + CACHE_DURATION).toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching services:", error);
    
    res.status(500).json({
      success: false,
      error: "Failed to fetch services",
      message: error.message,
    });
  }
});

// GET /api/services/refresh - Force refresh services (now just clears cache)
router.get("/refresh", async (req, res) => {
  try {
    console.log("🔄 Force refreshing services cache...");
    
    // Clear cache to force reload
    servicesCache = [];
    lastFetch = 0;
    
    const services = await getServices();
    
    res.json({
      success: true,
      message: "Services cache refreshed successfully",
      data: services,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error refreshing services:", error);
    
    res.status(500).json({
      success: false,
      error: "Failed to refresh services",
      message: error.message,
    });
  }
});

// POST /api/services/update - Update service (mock endpoint)
router.post("/update", async (req, res) => {
  try {
    const { serviceId, categoryId, updates } = req.body;
    
    if (!serviceId || !categoryId) {
      return res.status(400).json({
        success: false,
        error: "Service ID and Category ID are required",
      });
    }
    
    console.log("📝 Service update requested:", { serviceId, categoryId, updates });
    
    // For now, just return success as this would need write permissions to Google Sheets
    // In a full implementation, you'd update the service in the data source here
    
    res.json({
      success: true,
      message: "Service update request received (would need database implementation)",
      serviceId,
      categoryId,
      updates,
    });
  } catch (error) {
    console.error("❌ Error updating service:", error);
    
    res.status(500).json({
      success: false,
      error: "Failed to update service",
      message: error.message,
    });
  }
});

// GET /api/services/status - Get service integration status
router.get("/status", (req, res) => {
  res.json({
    success: true,
    status: "active",
    source: "static_config",
    integration: {
      googleSheets: false,
      database: false,
    },
    cache: {
      enabled: true,
      duration: CACHE_DURATION,
      lastFetch: lastFetch ? new Date(lastFetch).toISOString() : null,
      itemsInCache: servicesCache.length,
    },
    services: {
      categories: servicesCache.length,
      totalServices: servicesCache.reduce((total, cat) => total + cat.services.length, 0),
    },
  });
});

module.exports = router;
