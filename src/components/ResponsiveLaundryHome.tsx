import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  ShoppingBag,
  Clock,
  Star,
  Mic,
  User,
  Package,
  Plus,
  Minus,
  Menu,
  X,
  ArrowRight,
  Smartphone,
  Monitor,
  Bell,
} from "lucide-react";
import {
  laundryServices,
  serviceCategories,
  getPopularServices,
  getSortedServices,
  searchServices,
  getServicesByCategory,
  getCategoryDisplay,
  LaundryService,
} from "@/data/laundryServices";
import DynamicServicesService from "@/services/dynamicServicesService";
import type {
  DynamicLaundryService,
  DynamicServiceCategory,
} from "@/services/dynamicServicesService";
import PhoneOtpAuthModal from "./PhoneOtpAuthModal";
import EnhancedBookingHistoryModal from "./EnhancedBookingHistoryModal";
import UserMenuDropdown from "./UserMenuDropdown";
import OptimizedImage from "./OptimizedImage";
import DebugPanel from "./DebugPanel";
import BookingDebugPanel from "./BookingDebugPanel";
import ConnectionStatus from "./ConnectionStatus";
import NotificationPanel from "./NotificationPanel";
import VoiceSearch from "./VoiceSearch";
import AdminServicesManager from "./AdminServicesManager";
import LocationUnavailableModal from "./LocationUnavailableModal";
import { DVHostingSmsService } from "@/services/dvhostingSmsService";
import { LocationDetectionService } from "@/services/locationDetectionService";
import { saveCartData, getCartData } from "@/utils/formPersistence";
import "@/styles/mobile-sticky-search.css";
import { preloadCriticalImages } from "@/utils/imagePreloader";

interface ResponsiveLaundryHomeProps {
  currentUser?: any;
  userLocation?: string;
  onLoginSuccess: (user: any) => void;
  onViewCart: () => void;
  onViewBookings: () => void;
  onLogout?: () => void;
  onLoginRequired?: () => void;
}

const ResponsiveLaundryHome: React.FC<ResponsiveLaundryHomeProps> = ({
  currentUser,
  userLocation,
  onLoginSuccess,
  onViewCart,
  onViewBookings,
  onLogout,
  onLoginRequired,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  // Remove internal auth modal state - now handled by parent
  // const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showBookingDebugPanel, setShowBookingDebugPanel] = useState(false);
  const [showAdminServices, setShowAdminServices] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showLocationUnavailable, setShowLocationUnavailable] = useState(false);
  const [detectedLocationText, setDetectedLocationText] = useState("");
  const dvhostingSmsService = DVHostingSmsService.getInstance();
  const locationDetectionService = LocationDetectionService.getInstance();

  // Function to request location permission and check availability
  const requestLocationPermission = async () => {
    if (!currentUser) {
      console.log("User not authenticated, showing auth modal for location request");
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }
    setIsRequestingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );

      console.log("📍 Location detected:", position.coords);

      // Detect location details using our service
      const detectedLocation =
        await locationDetectionService.detectLocationGPS();

      if (detectedLocation) {
        console.log("📍 Location details:", detectedLocation);
        setDetectedLocationText(detectedLocation.full_address);

        // Save detected location to database
        await locationDetectionService.saveDetectedLocation(detectedLocation);

        // Check if location is available for service
        const availability =
          await locationDetectionService.checkLocationAvailability(
            detectedLocation.city,
            detectedLocation.pincode,
            detectedLocation.full_address,
          );

        console.log("🏠 Location availability:", availability);

        if (!availability.is_available) {
          // Show unavailable popup instead of reloading
          console.log("🚨 Manual location check - service not available, showing popup");
          setShowLocationUnavailable(true);
          setIsRequestingLocation(false);
          return;
        } else {
          console.log("✅ Manual location check - service is available");
        }
      }

      // If location is available or detection failed, reload as before
      window.location.reload();
    } catch (error) {
      console.error("Location request failed:", error);
      // Show a more helpful message to the user
      alert(
        "Please enable location access in your browser settings, then refresh the page.",
      );
    } finally {
      setIsRequestingLocation(false);
    }
  };

  // Automatic location detection for new users/devices
  useEffect(() => {
    const handleAutoLocationDetection = async () => {
      // Only auto-detect if no location is set and user hasn't explicitly denied
      if (
        !userLocation ||
        (!userLocation.includes("denied") &&
          !userLocation.includes("access denied"))
      ) {
        // Check if we've already detected location for this device recently
        const lastDetection = localStorage.getItem("lastLocationDetection");
        const now = Date.now();

        // Only auto-detect once per day per device
        if (
          !lastDetection ||
          now - parseInt(lastDetection) > 24 * 60 * 60 * 1000
        ) {
          try {
            console.log("🔍 Auto-detecting location for new user/device...");

            // Try to get location without triggering permission popup
            const detectedLocation =
              await locationDetectionService.detectLocationGPS();

            if (detectedLocation) {
              console.log("📍 Auto-detected location:", detectedLocation);
              setDetectedLocationText(detectedLocation.full_address);

              // Save detected location to database
              await locationDetectionService.saveDetectedLocation(
                detectedLocation,
              );

              // Check availability
              const availability =
                await locationDetectionService.checkLocationAvailability(
                  detectedLocation.city,
                  detectedLocation.pincode,
                  detectedLocation.full_address,
                );

              console.log(
                "🏠 Auto-detected location availability:",
                availability,
              );

              if (!availability.is_available) {
                // Show unavailable popup for auto-detected location
                console.log("🚨 Service not available - showing popup");
                setShowLocationUnavailable(true);
              } else {
                console.log("✅ Service is available - no popup needed");
              }

              // Mark that we've detected location for this device
              localStorage.setItem("lastLocationDetection", now.toString());
            }
          } catch (error) {
            console.log(
              "🔍 Auto location detection failed (expected for permission restrictions):",
              error,
            );
            // This is expected if user hasn't granted permission - don't show error
          }
        }
      }
    };

    // Run auto-detection after a short delay to not block initial render
    const timer = setTimeout(handleAutoLocationDetection, 2000);
    return () => clearTimeout(timer);
  }, [userLocation, locationDetectionService]);

  // Test function to simulate location outside service area
  const testLocationUnavailable = async () => {
    console.log("🧪 Testing location unavailable popup");
    setDetectedLocationText("Test Location: Outside Service Area");
    setShowLocationUnavailable(true);
  };

  // Add debugging function to window for console testing
  useEffect(() => {
    (window as any).testLocationPopup = testLocationUnavailable;
    (window as any).checkLocationAvailability = async (city: string, pincode?: string, fullAddress?: string) => {
      const result = await locationDetectionService.checkLocationAvailability(city, pincode, fullAddress);
      console.log('Manual availability check result:', result);
      if (!result.is_available) {
        setDetectedLocationText(fullAddress || `${city}${pincode ? `, ${pincode}` : ''}`);
        setShowLocationUnavailable(true);
      }
      return result;
    };
    return () => {
      delete (window as any).testLocationPopup;
      delete (window as any).checkLocationAvailability;
    };
  }, [locationDetectionService]);

  // Add keyboard shortcut for booking debug panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+B to open booking debug panel
      if (event.ctrlKey && event.shiftKey && event.key === "B") {
        event.preventDefault();
        setShowBookingDebugPanel(true);
      }
      // Ctrl+Shift+D to open debug panel
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        setShowDebugPanel(true);
      }
      // Ctrl+Shift+A to open admin services manager
      if (event.ctrlKey && event.shiftKey && event.key === "A") {
        event.preventDefault();
        setShowAdminServices(true);
      }
      // Ctrl+Shift+L to test location popup
      if (event.ctrlKey && event.shiftKey && event.key === "L") {
        event.preventDefault();
        testLocationUnavailable();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{ [key: string]: number }>(() => {
    // Load cart from localStorage on initialization
    return getCartData();
  });
  const [deliveryTime, setDeliveryTime] = useState("45 min");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Dynamic services state
  const [dynamicServices, setDynamicServices] = useState<
    DynamicServiceCategory[]
  >([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [useStaticFallback, setUseStaticFallback] = useState(false);
  const dynamicServicesService = DynamicServicesService.getInstance();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      saveCartData(cart);
    }
  }, [cart]);

  // Simplified mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;

      // Simplified and more reliable mobile detection
      const isMobileUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
          userAgent,
        );
      const isMobileViewport = width <= 768;
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // Use OR logic - any one of these conditions makes it mobile
      const isMobileDevice =
        isMobileUserAgent ||
        isMobileViewport ||
        (isTouchDevice && width <= 1024);

      setIsMobile(isMobileDevice);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    window.addEventListener("orientationchange", checkScreenSize);
    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener("orientationchange", checkScreenSize);
    };
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("laundry_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Listen for cart clearing events
  useEffect(() => {
    const handleClearCart = () => {
      console.log("🧹 ResponsiveLaundryHome: Received cart clear event");
      setCart({});
      localStorage.removeItem("laundry_cart");
      localStorage.removeItem("mobile_service_cart");
      localStorage.removeItem("service_cart");
      localStorage.removeItem("cleancare_cart");
    };

    window.addEventListener("clearCart", handleClearCart);
    return () => {
      window.removeEventListener("clearCart", handleClearCart);
    };
  }, []);

  // Load dynamic services
  useEffect(() => {
    const loadDynamicServices = async () => {
      try {
        setIsLoadingServices(true);
        const services = await dynamicServicesService.getServices();
        setDynamicServices(services);
        setUseStaticFallback(false);
        console.log(
          "✅ Loaded dynamic services:",
          services.length,
          "categories",
        );

        // Preload critical images for faster loading
        preloadCriticalImages(services).catch(console.warn);
      } catch (error) {
        console.warn(
          "⚠️ Failed to load dynamic services, using static fallback:",
          error,
        );
        setDynamicServices(laundryServices);
        setUseStaticFallback(true);

        // Preload critical images for fallback services
        preloadCriticalImages(laundryServices).catch(console.warn);
      } finally {
        setIsLoadingServices(false);
      }
    };

    loadDynamicServices();
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("laundry_cart", JSON.stringify(cart));
  }, [cart]);

  // Helper function to check authentication before any action
  const requireAuthOrExecute = (action: () => void) => {
    if (!currentUser) {
      console.log("User not authenticated, showing auth modal");
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }
    action();
  };

  const handleSearch = (query: string) => {
    requireAuthOrExecute(() => {
      setSearchQuery(query);
    });
  };

  const addToCart = (serviceId: string) => {
    requireAuthOrExecute(() => {
      setCart((prev) => ({
        ...prev,
        [serviceId]: (prev[serviceId] || 0) + 1,
      }));
    });
  };

  const removeFromCart = (serviceId: string) => {
    requireAuthOrExecute(() => {
      setCart((prev) => {
        const newCart = { ...prev };
        if (newCart[serviceId] > 1) {
          newCart[serviceId] -= 1;
        } else {
          delete newCart[serviceId];
        }
        return newCart;
      });
    });
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [serviceId, count]) => {
      let service;
      if (useStaticFallback) {
        // Services are now flat, no need to flatMap
        service = laundryServices.find((s) => s.id === serviceId);
      } else {
        service = dynamicServices
          ?.flatMap((cat) => cat.services || [])
          ?.find((s) => s.id === serviceId);
      }
      return total + (service ? service.price * count : 0);
    }, 0);
  };

  const getFilteredServices = (): (
    | LaundryService
    | DynamicLaundryService
  )[] => {
    if (isLoadingServices) return [];

    let services: (LaundryService | DynamicLaundryService)[] = [];

    if (searchQuery) {
      if (useStaticFallback) {
        services = searchServices(searchQuery) || [];
      } else {
        // Search in dynamic services
        const searchTerm = searchQuery.toLowerCase();
        services =
          dynamicServices?.flatMap(
            (category) =>
              category.services?.filter(
                (service) =>
                  service.enabled !== false &&
                  (service.name?.toLowerCase().includes(searchTerm) ||
                    service.category?.toLowerCase().includes(searchTerm) ||
                    service.description?.toLowerCase().includes(searchTerm)),
              ) || [],
          ) || [];
      }
    } else if (selectedCategory === "all") {
      if (useStaticFallback) {
        services = getSortedServices() || [];
      } else {
        // Get all services from dynamic categories
        services =
          dynamicServices?.flatMap(
            (category) =>
              category.services?.filter(
                (service) => service.enabled !== false,
              ) || [],
          ) || [];
        // Sort: popular first, then alphabetically
        services.sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return a.name.localeCompare(b.name);
        });
      }
    } else {
      if (useStaticFallback) {
        // Use the new getServicesByCategory function
        services = getServicesByCategory(selectedCategory) || [];
        // Sort by popular first, then alphabetically
        services.sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return a.name.localeCompare(b.name);
        });
      } else {
        const category = dynamicServices?.find(
          (c) => c.id === selectedCategory,
        );
        services = (category?.services || [])
          .filter((service) => service.enabled !== false)
          .sort((a, b) => {
            // Sort by popular first, then alphabetically
            if (a.popular && !b.popular) return -1;
            if (!a.popular && b.popular) return 1;
            return a.name.localeCompare(b.name);
          });
      }
    }

    return services;
  };

  const handleLogin = () => {
    console.log("handleLogin clicked, calling parent onLoginRequired");
    if (onLoginRequired) {
      onLoginRequired();
    }
  };

  // Remove handleAuthSuccess - auth success now handled by parent
  // const handleAuthSuccess = (user: any) => {
  //   setShowAuthModal(false);
  //   onLoginSuccess(user);
  // };

  const handleLogout = () => {
    // Use iOS fixes for logout
    import("../utils/iosAuthFix").then(({ clearIosAuthState }) => {
      clearIosAuthState();
    });

    // DVHosting SMS service doesn't have logout method - user logout handled at app level
    if (onLogout) {
      onLogout();
    }
  };

  const handleViewBookings = () => {
    if (currentUser) {
      // Use parent navigation to go to bookings view
      onViewBookings();
    } else {
      if (onLoginRequired) {
        onLoginRequired();
      }
    }
  };

  const handleUpdateProfile = (updatedUser: any) => {
    // Update user data in the parent component or storage
    onLoginSuccess(updatedUser);
  };

  const handleBookService = () => {
    requireAuthOrExecute(() => {
      // Scroll to services section
      const servicesSection = document.getElementById("services-section");
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  };

  const EmptyStateCard = () => (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden mx-auto max-w-md">
      <CardContent className="text-center py-12 px-6">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-laundrify-mint/20 to-laundrify-mint/40 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-laundrify-blue" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          No Services Selected
        </h3>

        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          Browse our professional laundry services and add them to your cart to
          get started.
        </p>

        <Button
          onClick={handleBookService}
          className="bg-laundrify-mint hover:bg-laundrify-mint/90 w-full py-3 rounded-xl text-laundrify-blue font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <ShoppingBag className="mr-2 h-5 w-5" />
          Browse Services
        </Button>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    // Mobile Interface
    return (
      <div className="min-h-screen bg-gradient-to-br from-laundrify-purple via-purple-400 to-laundrify-pink">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-laundrify-purple to-laundrify-pink text-white relative z-40">
          <div className="flex items-center justify-between mobile-header-safe">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-14 sm:h-10 rounded-lg overflow-hidden bg-white p-1">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2Fb0ac7c2f6e7c46a4a84ce74a0fb98c57%2F4c8fe4f8010c411a9eb989e3b42ef6f3?format=webp&width=800"
                      alt="Laundrify Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">Laundrify</h1>
                    <div className="text-xs text-white/80">
                      <span>Quick Clean & Convenient</span>
                    </div>
                  </div>
                </div>
                {currentUser && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 active:bg-white/30 p-3 h-10 w-10 mobile-button mobile-touch transition-all duration-200"
                      onClick={handleViewBookings}
                      title="View Bookings"
                    >
                      <Package className="h-5 w-5" />
                    </Button>
                    <div className="text-white">
                      <NotificationPanel />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification button removed as per user requirements */}

              {currentUser ? (
                <UserMenuDropdown
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onViewBookings={handleViewBookings}
                  onUpdateProfile={handleUpdateProfile}
                />
              ) : (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Mobile signin button clicked");
                    handleLogin();
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 active:bg-white/30 px-4 py-3 h-12 mobile-button mobile-touch rounded-lg transition-all duration-200 font-medium min-w-[100px]"
                  type="button"
                >
                  <User className="h-5 w-5 mr-2" />
                  <span className="text-sm font-semibold">Sign In</span>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {showMobileMenu && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-40">
              <div className="p-4 space-y-3">
                <Button
                  onClick={() => {
                    setShowMobileMenu(false);
                    if (currentUser) {
                      onViewBookings();
                    } else {
                      handleLogin();
                    }
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-700"
                >
                  <User className="mr-3 h-4 w-4" />
                  {currentUser ? "My Bookings" : "Sign In"}
                </Button>
                <Button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleBookService();
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-700"
                >
                  <ShoppingBag className="mr-3 h-4 w-4" />
                  Browse Services
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Non-sticky delivery/location section */}
        <div className="p-4">
          {/* Delivery Time & Location */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                🕐 Pick up in {deliveryTime}
              </span>
              <Badge className="bg-white/20 text-white">Available</Badge>
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${
                userLocation?.includes("denied") ||
                userLocation?.includes("access denied")
                  ? "cursor-pointer hover:text-white/80 transition-colors"
                  : ""
              }`}
              onClick={
                userLocation?.includes("denied") ||
                userLocation?.includes("access denied")
                  ? requestLocationPermission
                  : undefined
              }
              title={
                userLocation?.includes("denied") ||
                userLocation?.includes("access denied")
                  ? "Click to request location permission again"
                  : undefined
              }
            >
              <MapPin
                className={`h-4 w-4 ${
                  userLocation?.includes("denied") ||
                  userLocation?.includes("access denied")
                    ? "animate-pulse"
                    : ""
                }`}
              />
              <span>
                {isRequestingLocation
                  ? "Requesting location..."
                  : userLocation || "Detect Location"}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Search and Categories Only */}
        <div className="sticky top-0 bg-gradient-to-b from-laundrify-purple to-laundrify-pink z-50 shadow-lg mobile-sticky-container">
          <div className="px-4 pt-4 pb-2 space-y-3">
            {/* Search Bar */}
            <div className="bg-gray-800 rounded-xl flex items-center px-4 py-3 mobile-sticky-search">
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 p-0 text-sm"
              />
              <VoiceSearch
                onResult={(transcript) => {
                  handleSearch(transcript);
                }}
                onError={(error) => {
                  console.error("Voice search error:", error);
                }}
                className="ml-3 text-gray-400 hover:text-white"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mobile-sticky-categories">
              <Button
                variant={selectedCategory === "all" ? "default" : "ghost"}
                onClick={() => requireAuthOrExecute(() => setSelectedCategory("all"))}
                className={`flex-shrink-0 rounded-xl text-xs px-3 py-2 font-medium border ${
                  selectedCategory === "all"
                    ? "bg-white text-laundrify-blue border-white shadow-lg"
                    : "bg-laundrify-blue/80 text-white border-white/30 hover:bg-laundrify-blue hover:border-white/50 shadow-md"
                }`}
              >
                All
              </Button>

              {(useStaticFallback
                ? (serviceCategories || []).slice(1)
                : dynamicServices || []
              )
                .filter((category) => category.enabled !== false)
                .map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? "default" : "ghost"
                    }
                    onClick={() => requireAuthOrExecute(() => setSelectedCategory(category.id))}
                    className={`flex-shrink-0 rounded-xl text-xs px-3 py-2 font-medium border ${
                      selectedCategory === category.id
                        ? "bg-white text-laundrify-blue border-white shadow-lg"
                        : "bg-laundrify-blue/80 text-white border-white/30 hover:bg-laundrify-blue hover:border-white/50 shadow-md"
                    }`}
                  >
                    <span className="mr-1">{category.icon}</span>
                    <span className="whitespace-nowrap">{category.name}</span>
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div
          id="services-section"
          className="bg-white rounded-t-3xl min-h-screen p-4 relative"
        >
          {getFilteredServices().length === 0 ? (
            <EmptyStateCard />
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-20 service-grid">
              {getFilteredServices().map((service) => {
                const quantity = cart[service.id] || 0;

                return (
                  <Card
                    key={service.id}
                    className="border-0 shadow-lg rounded-2xl overflow-hidden service-card"
                  >
                    <CardContent className="p-3 card-content">
                      <div className="aspect-square bg-gradient-to-br from-laundrify-mint/20 to-laundrify-mint/40 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                        {service.image ? (
                          <>
                            <OptimizedImage
                              src={service.image}
                              alt={service.name}
                              className="w-full h-full rounded-xl"
                              priority={service.popular}
                              fallback={
                                <span className="text-3xl">
                                  {
                                    getCategoryDisplay(service.category).split(
                                      " ",
                                    )[0]
                                  }
                                </span>
                              }
                            />
                            {service.popular && (
                              <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                                Popular
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-3xl">
                              {
                                getCategoryDisplay(service.category).split(
                                  " ",
                                )[0]
                              }
                            </span>
                            {service.popular && (
                              <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                Popular
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="card-details">
                        <div className="service-info">
                          <h4 className="font-semibold text-xs text-gray-900 leading-tight line-clamp-2 mb-2">
                            {service.name}
                          </h4>

                          <div className="text-xs text-gray-600 mb-2">
                            {getCategoryDisplay(service.category)}
                          </div>
                        </div>

                        <div className="price-badge-container">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-bold text-gray-900">
                                ₹{service.price}
                              </span>
                              <span className="text-xs text-gray-600 ml-1">
                                {service.unit}
                              </span>
                            </div>

                            {service.popular && !service.image && (
                              <Badge className="bg-laundrify-yellow/20 text-laundrify-blue text-xs">
                                Popular
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="card-actions">
                          {quantity > 0 ? (
                            <div className="flex items-center justify-between bg-laundrify-mint/20 rounded-lg p-2 quantity-controls">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(service.id)}
                                className="h-6 w-6 p-0 text-laundrify-blue hover:bg-laundrify-mint/40"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <span className="font-semibold text-laundrify-blue text-sm">
                                {quantity}
                              </span>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addToCart(service.id)}
                                className="h-6 w-6 p-0 text-laundrify-blue hover:bg-laundrify-mint/40"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => addToCart(service.id)}
                              className="w-full bg-laundrify-mint hover:bg-laundrify-mint/90 text-laundrify-blue rounded-lg text-xs py-2 service-add-button mobile-button"
                            >
                              ADD
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Button - Mobile */}
        {getCartItemCount() > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <Button
              onClick={onViewCart}
              className="w-full bg-laundrify-mint hover:bg-laundrify-mint/90 text-laundrify-blue rounded-xl py-3 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  {getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                View Cart
              </span>
            </Button>
          </div>
        )}
        {/* Empty State */}
        {!getPopularServices().length && (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-laundrify-blue mb-4">
              Welcome to Laundrify
            </h2>
            <p className="text-laundrify-blue/80 mb-6">
              Quick Clean & Convenient thats laundrify
            </p>
            <Button
              onClick={handleBookService}
              className="bg-laundrify-mint hover:bg-laundrify-mint/90 px-8 py-3 rounded-xl text-lg font-medium text-laundrify-blue"
            >
              Get Started
            </Button>
          </div>
        )}

        {/* Auth Modal now handled by parent component */}
      </div>
    );
  }

  // Desktop Interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fb0ac7c2f6e7c46a4a84ce74a0fb98c57%2F4c8fe4f8010c411a9eb989e3b42ef6f3?format=webp&width=800"
                    alt="Laundrify Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Laundrify
                  </h1>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Monitor className="h-3 w-3" />
                    <span>Desktop</span>
                  </div>
                </div>
              </div>

              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search laundry services..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {currentUser && (
                    <VoiceSearch
                      onResult={(transcript) => {
                        console.log("Voice search result:", transcript);
                        setSearchQuery(transcript);
                        if (transcript.toLowerCase().includes("cart")) {
                          handleViewCart();
                        } else if (
                          transcript.toLowerCase().includes("booking")
                        ) {
                          handleViewBookings();
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 bg-laundrify-mint/20 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-laundrify-blue" />
                <span className="text-sm font-medium text-laundrify-blue">
                  Delivery in {deliveryTime}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`hidden md:flex items-center gap-2 text-sm text-gray-600 ${
                  userLocation?.includes("denied") ||
                  userLocation?.includes("access denied")
                    ? "cursor-pointer hover:text-gray-800 transition-colors"
                    : ""
                }`}
                onClick={
                  userLocation?.includes("denied") ||
                  userLocation?.includes("access denied")
                    ? requestLocationPermission
                    : undefined
                }
                title={
                  userLocation?.includes("denied") ||
                  userLocation?.includes("access denied")
                    ? "Click to request location permission again"
                    : undefined
                }
              >
                <MapPin
                  className={`h-4 w-4 ${
                    userLocation?.includes("denied") ||
                    userLocation?.includes("access denied")
                      ? "animate-pulse text-orange-500"
                      : ""
                  }`}
                />
                <span>
                  {isRequestingLocation
                    ? "Requesting location..."
                    : userLocation || "Set Location"}
                </span>
              </div>

              {currentUser && (
                <Button variant="ghost" size="sm" onClick={handleViewBookings}>
                  <Package className="h-4 w-4 mr-2" />
                  Bookings
                </Button>
              )}

              {currentUser && <NotificationPanel />}

              {currentUser ? (
                <UserMenuDropdown
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onViewBookings={handleViewBookings}
                  onUpdateProfile={handleUpdateProfile}
                />
              ) : (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Desktop signin button clicked");
                    handleLogin();
                  }}
                  className="bg-laundrify-mint hover:bg-laundrify-mint/90 cursor-pointer text-laundrify-blue"
                  type="button"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-laundrify-purple to-laundrify-pink rounded-2xl text-white p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                Laundrify - Quick Clean & Convenient
              </h2>
              <p className="text-white/90 mb-6 text-lg">
                Quick Clean & Convenient thats laundrify - delivered to your doorstep in {deliveryTime}
              </p>
              <Button
                onClick={handleBookService}
                className="bg-laundrify-mint text-laundrify-blue hover:bg-laundrify-mint/90 font-semibold px-8 py-3 rounded-xl"
              >
                Browse Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {(useStaticFallback
                  ? (serviceCategories || []).slice(1)
                  : dynamicServices || []
                )
                  .filter((category) => category.enabled !== false)
                  .slice(0, 4)
                  .map((category) => (
                    <div
                      key={category.id}
                      onClick={() => requireAuthOrExecute(() => setSelectedCategory(category.id))}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center cursor-pointer hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <span className="text-3xl block mb-2">
                        {category.icon}
                      </span>
                      <span className="text-sm font-medium">
                        {category.name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 pr-12 py-3 rounded-xl border-gray-200 focus:border-laundrify-purple"
              />
              <Mic className="absolute right-4 top-3 h-5 w-5 text-gray-400 cursor-pointer hover:text-laundrify-purple" />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => requireAuthOrExecute(() => setSelectedCategory("all"))}
              className={`flex-shrink-0 rounded-xl font-medium shadow-md border ${
                selectedCategory === "all"
                  ? "bg-laundrify-purple text-white border-laundrify-purple shadow-lg"
                  : "bg-laundrify-mint/80 text-laundrify-blue border-laundrify-mint hover:bg-laundrify-mint hover:shadow-lg"
              }`}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              All Services
            </Button>

            {(useStaticFallback
              ? (serviceCategories || []).slice(1)
              : dynamicServices || []
            )
              .filter((category) => category.enabled !== false)
              .map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  onClick={() => requireAuthOrExecute(() => setSelectedCategory(category.id))}
                  className={`flex-shrink-0 rounded-xl font-medium shadow-md border ${
                    selectedCategory === category.id
                      ? "bg-laundrify-purple text-white border-laundrify-purple shadow-lg"
                      : "bg-laundrify-mint/80 text-laundrify-blue border-laundrify-mint hover:bg-laundrify-mint hover:shadow-lg"
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
          </div>
        </div>

        {/* Services Grid */}
        <div id="services-section">
          {getFilteredServices().length === 0 ? (
            <div className="flex justify-center py-12">
              <EmptyStateCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {getFilteredServices().map((service) => {
                const quantity = cart[service.id] || 0;

                return (
                  <Card
                    key={service.id}
                    className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="aspect-square bg-gradient-to-br from-laundrify-mint/20 to-laundrify-mint/40 rounded-xl mb-4 flex items-center justify-center">
                        <span className="text-5xl">
                          {getCategoryDisplay(service.category).split(" ")[0]}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-gray-900 leading-tight">
                          {service.name}
                        </h4>

                        <div className="text-sm text-gray-600">
                          {getCategoryDisplay(service.category)}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{service.price}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">
                              {service.unit}
                            </span>
                          </div>

                          {service.popular && (
                            <Badge className="bg-laundrify-yellow/20 text-laundrify-blue">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Popular
                            </Badge>
                          )}
                        </div>

                        {service.minQuantity && service.minQuantity > 1 && (
                          <div className="text-sm text-orange-600">
                            Min {service.minQuantity}
                            {service.unit.includes("kg") ? "kg" : " pcs"}
                          </div>
                        )}

                        {quantity > 0 ? (
                          <div className="flex items-center justify-between bg-laundrify-mint/20 rounded-lg p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(service.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <span className="font-semibold text-laundrify-blue text-lg">
                              {quantity}
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addToCart(service.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(service.id)}
                            className="w-full bg-laundrify-mint hover:bg-laundrify-mint/90 text-laundrify-blue rounded-xl py-3 font-semibold"
                          >
                            ADD TO CART
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Button - Desktop */}
        {getCartItemCount() > 0 && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button
              onClick={onViewCart}
              className="bg-laundrify-mint hover:bg-laundrify-mint/90 text-laundrify-blue rounded-2xl py-4 px-6 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
            >
              <ShoppingBag className="h-5 w-5" />
              <div>
                <div className="font-semibold">
                  {getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}
                </div>
                <div className="text-sm opacity-90">���{getCartTotal()}</div>
              </div>
            </Button>
          </div>
        )}

        {/* Authentication Modal now handled by parent component */}

        {/* Removed local booking history modal - using main navigation */}

        {/* Debug Panel */}
        <DebugPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />

        {/* Booking Debug Panel */}
        <BookingDebugPanel
          currentUser={currentUser}
          isOpen={showBookingDebugPanel}
          onClose={() => setShowBookingDebugPanel(false)}
        />

        {/* Admin Services Manager */}
        {showAdminServices && (
          <AdminServicesManager onClose={() => setShowAdminServices(false)} />
        )}

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Location Unavailable Modal */}
        <LocationUnavailableModal
          isOpen={showLocationUnavailable}
          onClose={() => setShowLocationUnavailable(false)}
          detectedLocation={detectedLocationText}
          onExplore={() => {
            console.log("🔍 User chose to explore available services");
            // You can add navigation logic here if needed
          }}
        />

        {/* Google Sheets integration removed */}
      </div>
    </div>
  );
};
export default ResponsiveLaundryHome;
