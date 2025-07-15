import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Crosshair,
} from "lucide-react";
import {
  modernGoogleMaps,
  createMarkerIcon,
  type MapConfig,
  type MarkerConfig,
} from "@/utils/modernGoogleMaps";
import { useLocation } from "@/hooks/useLocation";
import { apiClient } from "@/lib/apiClient";

interface ModernLocationPickerProps {
  onLocationSelected?: (location: {
    address: string;
    coordinates: { lat: number; lng: number };
    placeId?: string;
  }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
  showSearchBox?: boolean;
  allowCurrentLocation?: boolean;
  markersClickable?: boolean;
}

export const ModernLocationPicker: React.FC<ModernLocationPickerProps> = ({
  onLocationSelected,
  initialLocation,
  height = "400px",
  showSearchBox = true,
  allowCurrentLocation = true,
  markersClickable = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    coordinates: { lat: number; lng: number };
    placeId?: string;
  } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const {
    currentLocation,
    currentAddress,
    isDetecting,
    error: locationError,
    detectLocation,
    geocodeAddress,
    clearError,
  } = useLocation({
    enableHighAccuracy: true,
    timeout: 15000,
    autoGeocoding: true,
  });

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsMapLoading(true);
        setMapError(null);

        const defaultCenter = initialLocation ||
          currentLocation || { lat: 28.6139, lng: 77.209 }; // Delhi, India

        const mapConfig: MapConfig = {
          center: defaultCenter,
          zoom: 15,
          gestureHandling: "auto",
          disableDefaultUI: false,
        };

        console.log("🗺️ Initializing modern Google Map...");
        const mapInstance = await modernGoogleMaps.createMap(
          mapRef.current,
          mapConfig,
        );
        setMap(mapInstance);

        // Add click listener to map
        modernGoogleMaps.addClickListener(async (event) => {
          if (event.latLng) {
            const coordinates = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            };

            await handleLocationSelection(coordinates);
          }
        });

        // Add initial marker if location is provided
        if (defaultCenter) {
          await addLocationMarker(defaultCenter);
        }

        console.log("✅ Modern Google Map initialized successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load map";
        console.error("❌ Failed to initialize map:", errorMessage);
        setMapError(errorMessage);
      } finally {
        setIsMapLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      modernGoogleMaps.destroy();
    };
  }, [initialLocation, currentLocation]);

  // Add marker to map
  const addLocationMarker = useCallback(
    async (coordinates: { lat: number; lng: number }) => {
      try {
        // Clear existing markers
        modernGoogleMaps.clearMarkers();

        // Create custom marker with modern styling
        const customContent = createMarkerIcon({
          icon: "📍",
          color: "#EA4335",
          size: 48,
          text: "Selected Location",
        });

        const markerConfig: MarkerConfig = {
          position: coordinates,
          title: "Selected Location",
          content: customContent,
          gmpClickable: markersClickable,
        };

        const marker = await modernGoogleMaps.addAdvancedMarker(markerConfig);

        // Add marker click listener if enabled
        if (markersClickable) {
          modernGoogleMaps.addMarkerClickListener(marker, () => {
            console.log("📍 Marker clicked:", coordinates);
          });
        }

        // Center map on marker
        modernGoogleMaps.setCenter(coordinates, 16);

        console.log("📍 Location marker added successfully");
      } catch (error) {
        console.error("❌ Failed to add marker:", error);
      }
    },
    [markersClickable],
  );

  // Handle location selection
  const handleLocationSelection = useCallback(
    async (coordinates: { lat: number; lng: number }) => {
      try {
        console.log("📍 Location selected:", coordinates);

        // Reverse geocode to get address
        const geocodeResult = await apiClient.geocodeLocation(
          coordinates.lat,
          coordinates.lng,
        );

        let address = "";
        if (geocodeResult.data && geocodeResult.data.address) {
          address = geocodeResult.data.address;
        } else {
          // Fallback to coordinate-based address
          address = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
        }

        const locationData = {
          address,
          coordinates,
          placeId: geocodeResult.data?.placeId,
        };

        setSelectedLocation(locationData);
        onLocationSelected?.(locationData);

        // Add marker to map
        await addLocationMarker(coordinates);
      } catch (error) {
        console.error("❌ Failed to handle location selection:", error);

        // Fallback: still allow selection with coordinate-based address
        const fallbackLocation = {
          address: `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
          coordinates,
        };

        setSelectedLocation(fallbackLocation);
        onLocationSelected?.(fallbackLocation);
        await addLocationMarker(coordinates);
      }
    },
    [onLocationSelected, addLocationMarker],
  );

  // Handle current location detection
  const handleCurrentLocation = useCallback(async () => {
    try {
      clearError();
      await detectLocation();
    } catch (error) {
      console.error("❌ Failed to detect current location:", error);
    }
  }, [detectLocation, clearError]);

  // Update map when current location changes
  useEffect(() => {
    if (currentLocation && map) {
      handleLocationSelection(currentLocation);
    }
  }, [currentLocation, map, handleLocationSelection]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const result = await apiClient.getAutocomplete(query);

      if (result.data && result.data.predictions) {
        setSearchSuggestions(result.data.predictions.slice(0, 5));
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error("❌ Search failed:", error);
      setSearchSuggestions([]);
    }
  }, []);

  // Handle search input
  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchQuery(value);

      // Debounce search
      const timeoutId = setTimeout(() => {
        handleSearch(value);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [handleSearch],
  );

  // Handle search suggestion selection
  const handleSuggestionSelect = useCallback(
    async (suggestion: any) => {
      try {
        setSearchQuery(suggestion.description);
        setSearchSuggestions([]);

        // Get coordinates for the selected place
        const placeDetails = await apiClient.getPlaceDetails(
          suggestion.place_id,
        );

        if (placeDetails.data && placeDetails.data.geometry) {
          const coordinates = {
            lat: placeDetails.data.geometry.location.lat,
            lng: placeDetails.data.geometry.location.lng,
          };

          await handleLocationSelection({
            ...coordinates,
          });
        }
      } catch (error) {
        console.error("❌ Failed to select suggestion:", error);
      }
    },
    [handleLocationSelection],
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Location
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Box */}
        {showSearchBox && (
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>

              {allowCurrentLocation && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCurrentLocation}
                  disabled={isDetecting}
                  title="Use current location"
                >
                  {isDetecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Crosshair className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="font-medium text-sm">
                      {suggestion.structured_formatting?.main_text ||
                        suggestion.description}
                    </div>
                    {suggestion.structured_formatting?.secondary_text && (
                      <div className="text-xs text-gray-500">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {locationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {mapError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Map failed to load: {mapError}
              <br />
              <small>
                This might be due to Google Maps API configuration issues.
              </small>
            </AlertDescription>
          </Alert>
        )}

        {selectedLocation && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Selected:</strong> {selectedLocation.address}
            </AlertDescription>
          </Alert>
        )}

        {/* Map Container */}
        <div className="relative">
          <div
            ref={mapRef}
            style={{ height }}
            className="w-full rounded-lg border bg-gray-100"
          />

          {/* Loading Overlay */}
          {isMapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading modern map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Click on the map to select a location</p>
          <p>• Use the search box to find specific addresses</p>
          {allowCurrentLocation && (
            <p>• Click the crosshair icon to use your current location</p>
          )}
        </div>

        {/* Current Location Info */}
        {currentLocation && currentAddress && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Current Location
              </span>
            </div>
            <p className="text-sm text-blue-700">{currentAddress}</p>
            <div className="flex gap-4 mt-2 text-xs text-blue-600">
              <span>Lat: {currentLocation.lat.toFixed(6)}</span>
              <span>Lng: {currentLocation.lng.toFixed(6)}</span>
              {currentLocation.accuracy && (
                <Badge variant="secondary" className="text-xs">
                  ±{Math.round(currentLocation.accuracy)}m
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* API Status */}
        {!modernGoogleMaps.isApiAvailable() && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Google Maps API is not available. Please check your API key
              configuration.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernLocationPicker;
