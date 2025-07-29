// Enhanced location service with OpenCage as primary geocoding provider
// Replaces Google Maps dependency with OpenCage Data API

import { apiClient } from "@/lib/api";
import { openCageService, type OpenCageCoordinates } from "./openCageService";

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface LocationData {
  id: string;
  address: string;
  coordinates: Coordinates;
  name?: string;
  isFavorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaceAutocomplete {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GeocodeResult {
  coordinates: Coordinates;
  formatted_address: string;
  place_id?: string;
}

class LocationService {
  private readonly OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || 'bb9e8b5e99a24e1c811e89a6c1099fd1';

  /**
   * Get user's current position using browser geolocation with enhanced accuracy
   */
  async getCurrentPosition(options?: PositionOptions): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      let bestPosition: GeolocationPosition | null = null;
      let attempts = 0;
      const maxAttempts = 3;
      const timeout = 15000;

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout for better accuracy
        maximumAge: 0, // Always get fresh position for accuracy
        ...options,
      };

      console.log("�� Requesting geolocation with options:", defaultOptions);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          console.log("✅ Geolocation success:", {
            ...coords,
            timestamp: new Date(position.timestamp).toISOString(),
            heading: position.coords.heading,
            speed: position.coords.speed,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
          });

          resolve(coords);
        },
        (error) => {
          let errorMessage = "Unknown geolocation error";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }

          console.error("❌ Geolocation error:", errorMessage, error);
          reject(new Error(errorMessage));
        },
        defaultOptions,
      );
    });
  }

  /**
   * Reverse geocode coordinates to human-readable address using OpenCage as primary provider
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    console.log("🔍 Starting enhanced reverse geocoding for:", coordinates);

    // Method 1: OpenCage API (Primary)
    try {
      const openCageCoords: OpenCageCoordinates = {
        lat: coordinates.lat,
        lng: coordinates.lng,
        accuracy: coordinates.accuracy
      };

      const address = await openCageService.reverseGeocode(openCageCoords);
      if (address && address.length > 10) {
        console.log("✅ OpenCage reverse geocoding successful:", address);
        return address;
      }
    } catch (error) {
      console.warn("OpenCage reverse geocoding failed, trying fallback:", error);
    }

    // Method 2: Backend proxy (fallback to converted OpenCage)
    try {
      // Import the API base URL
      const { getApiBaseUrl } = await import('../config/env');
      const apiBaseUrl = getApiBaseUrl();

      if (apiBaseUrl) {
        const response = await fetch(
          `${apiBaseUrl}/google-maps/geocode?latlng=${coordinates.lat},${coordinates.lng}&language=en&region=IN`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && data.results.length > 0) {
            console.log("✅ Backend proxy geocoding successful:", data.results[0].formatted_address);
            return data.results[0].formatted_address;
          }
        }
      }
    } catch (error) {
      console.warn("Backend proxy geocoding failed:", error);
    }

    // Method 2: Enhanced Nominatim with maximum zoom for street-level detail
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=19&addressdetails=1&extratags=1&namedetails=1&accept-language=en&countrycodes=in`,
        {
          headers: {
            "User-Agent": "CleanCarePro-LocationService/1.0",
            Accept: "application/json",
          },
          mode: "cors",
        },
      );

      if (!response.ok) {
        console.warn(
          `Nominatim API returned ${response.status}: ${response.statusText}`,
        );
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.address) {
        console.log("✅ Nominatim enhanced result:", data);

        // Extract detailed Indian address components
        const enhancedAddress = this.formatDetailedNominatimAddress(
          data.address,
        );
        return enhancedAddress || data.display_name;
      }
    } catch (error) {
      console.warn("Nominatim enhanced reverse geocoding failed:", error);
    }

    // Method 3: Direct OpenCage API fallback with demo key
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${coordinates.lat}+${coordinates.lng}&key=bb9e8b5e99a24e1c811e89a6c1099fd1&language=en&countrycode=in&limit=1`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Laundrify-App/1.0"
          },
          mode: "cors",
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.results && data.results.length > 0) {
          console.log("✅ Direct OpenCage result:", data.results[0]);
          return data.results[0].formatted;
        }
      }
    } catch (error) {
      console.warn("Direct OpenCage reverse geocoding failed:", error);
    }

    // Method 4: Fallback with coordinate-based address
    const formattedCoords = await this.formatCoordinatesAsAddress(coordinates);
    return formattedCoords;
  }

  /**
   * Extract detailed components from Google Maps address components with enhanced Indian address support
   */
  private extractDetailedComponents(components: any[]): any {
    const extracted: any = {};

    components.forEach((component) => {
      const types = component.types;
      const longName = component.long_name;
      const shortName = component.short_name;

      // Enhanced extraction for Indian address components with street-level priority
      if (types.includes("street_number")) {
        extracted.street_number = longName;
        extracted.has_street_number = true; // Flag for street-level detection
      } else if (types.includes("route")) {
        extracted.route = longName;
        extracted.has_route = true; // Flag for street detection
      } else if (types.includes("intersection")) {
        extracted.intersection = longName;
      } else if (
        types.includes("political") &&
        types.includes("sublocality_level_3")
      ) {
        extracted.sublocality_level_3 = longName;
      } else if (types.includes("sublocality_level_2")) {
        extracted.sublocality_level_2 = longName;
      } else if (types.includes("sublocality_level_1")) {
        extracted.sublocality_level_1 = longName;
      } else if (types.includes("sublocality")) {
        extracted.sublocality = longName;
      } else if (types.includes("neighborhood")) {
        extracted.neighborhood = longName;
      } else if (types.includes("premise")) {
        extracted.premise = longName;
      } else if (types.includes("subpremise")) {
        extracted.subpremise = longName;
      } else if (types.includes("locality")) {
        extracted.locality = longName;
      } else if (types.includes("administrative_area_level_4")) {
        extracted.area_level_4 = longName; // Village/ward level
      } else if (types.includes("administrative_area_level_3")) {
        extracted.area_level_3 = longName; // Tehsil/Block level
      } else if (types.includes("administrative_area_level_2")) {
        extracted.area_level_2 = longName; // District level
      } else if (types.includes("administrative_area_level_1")) {
        extracted.state = longName;
      } else if (types.includes("postal_code")) {
        extracted.postal_code = longName;
      } else if (types.includes("country")) {
        extracted.country = longName;
      }
    });

    console.log("🔍 Extracted address components:", extracted);
    return extracted;
  }

  /**
   * Format enhanced Indian address from Google Maps components with street-level priority
   */
  private formatEnhancedIndianAddress(components: any): string {
    // Enhanced address formatting prioritizing street-level details
    const addressParts = [];

    // House/Building number (prioritize street number)
    if (components.street_number) {
      addressParts.push(components.street_number);
    }

    // Building/Premise details
    if (components.subpremise) {
      addressParts.push(components.subpremise);
    } else if (
      components.premise &&
      components.premise !== components.street_number
    ) {
      addressParts.push(components.premise);
    }

    // Street/Road name (critical for detailed addressing)
    if (components.route) {
      addressParts.push(components.route);
    } else if (components.intersection) {
      addressParts.push(`Near ${components.intersection}`);
    }

    // Area/Locality details (in order of specificity)
    const areaDetails = [
      components.neighborhood,
      components.sublocality_level_3,
      components.sublocality_level_2,
      components.sublocality_level_1,
      components.sublocality,
    ].filter(Boolean);

    if (areaDetails.length > 0) {
      // Avoid duplication - only add unique area names
      const uniqueAreas = [...new Set(areaDetails)];
      addressParts.push(...uniqueAreas);
    }

    // City/Town
    if (components.locality) {
      addressParts.push(components.locality);
    }

    // Administrative areas (if different from city)
    const adminAreas = [
      components.area_level_4, // Village/Ward
      components.area_level_3, // Tehsil/Block
      components.area_level_2, // District
    ]
      .filter(Boolean)
      .filter((area) => area !== components.locality);

    if (adminAreas.length > 0) {
      addressParts.push(...adminAreas);
    }

    // State
    if (components.state) {
      addressParts.push(components.state);
    }

    // Postal code
    if (components.postal_code) {
      addressParts.push(components.postal_code);
    }

    const formattedAddress = addressParts.join(", ");
    console.log("📝 Formatted Indian address:", formattedAddress);

    return formattedAddress;
  }

  /**
   * Format detailed address from Nominatim response for Indian locations
   */
  private formatDetailedNominatimAddress(address: any): string {
    const parts = [
      address.house_number,
      address.road,
      address.neighbourhood,
      address.suburb,
      address.village,
      address.town,
      address.city_district,
      address.city,
      address.county,
      address.state_district,
      address.state,
      address.postcode,
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Extract house number from Indian address string using OpenCage service
   */
  extractHouseNumber(address: string): {
    houseNumber: string;
    building: string;
    cleanedAddress: string;
  } {
    // Delegate to OpenCage service for consistent handling
    return openCageService.extractHouseNumber(address);
  }

  /**
   * Get detailed address components from coordinates using OpenCage
   */
  async getDetailedAddressComponents(coordinates: Coordinates): Promise<any> {
    console.log("🔍 Getting detailed address components...");

    // Use OpenCage as primary source
    try {
      const openCageCoords: OpenCageCoordinates = {
        lat: coordinates.lat,
        lng: coordinates.lng,
        accuracy: coordinates.accuracy
      };

      const result = await openCageService.forwardGeocode(`${coordinates.lat},${coordinates.lng}`);
      if (result && result.components) {
        console.log("✅ Detailed components from OpenCage:", result);
        return {
          formatted_address: result.formatted_address,
          address_components: this.convertOpenCageComponentsToGoogleFormat(result.components),
          geometry: {
            location: {
              lat: () => result.coordinates.lat,
              lng: () => result.coordinates.lng,
            },
          },
        };
      }
    } catch (error) {
      console.warn("OpenCage component extraction failed:", error);
    }

    // Fallback to Nominatim for detailed components
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=20&addressdetails=1`,
        {
          headers: {
            "User-Agent": "LaundaryFlash-App/1.0",
          },
        },
      );

      const data = await response.json();

      if (data && data.address) {
        console.log("✅ Detailed components from Nominatim:", data);
        // Convert Nominatim format to Google-like format
        return {
          formatted_address: data.display_name,
          address_components: this.convertNominatimToGoogleFormat(data.address),
          geometry: {
            location: {
              lat: () => parseFloat(data.lat),
              lng: () => parseFloat(data.lon),
            },
          },
        };
      }
    } catch (error) {
      console.warn("Nominatim component extraction failed:", error);
    }

    return null;
  }

  /**
   * Convert OpenCage address components to Google Maps format for compatibility
   */
  private convertOpenCageComponentsToGoogleFormat(openCageComponents: any): any[] {
    const components = [];

    if (openCageComponents.house_number) {
      components.push({
        long_name: openCageComponents.house_number,
        short_name: openCageComponents.house_number,
        types: ["street_number"],
      });
    }

    if (openCageComponents.road) {
      components.push({
        long_name: openCageComponents.road,
        short_name: openCageComponents.road,
        types: ["route"],
      });
    }

    if (openCageComponents.neighbourhood || openCageComponents.suburb) {
      components.push({
        long_name: openCageComponents.neighbourhood || openCageComponents.suburb,
        short_name: openCageComponents.neighbourhood || openCageComponents.suburb,
        types: ["sublocality_level_1", "sublocality"],
      });
    }

    if (
      openCageComponents.city ||
      openCageComponents.town ||
      openCageComponents.village
    ) {
      components.push({
        long_name:
          openCageComponents.city ||
          openCageComponents.town ||
          openCageComponents.village,
        short_name:
          openCageComponents.city ||
          openCageComponents.town ||
          openCageComponents.village,
        types: ["locality"],
      });
    }

    if (openCageComponents.state) {
      components.push({
        long_name: openCageComponents.state,
        short_name: openCageComponents.state_code || openCageComponents.state,
        types: ["administrative_area_level_1"],
      });
    }

    if (openCageComponents.postcode) {
      components.push({
        long_name: openCageComponents.postcode,
        short_name: openCageComponents.postcode,
        types: ["postal_code"],
      });
    }

    if (openCageComponents.country) {
      components.push({
        long_name: openCageComponents.country,
        short_name:
          openCageComponents.country_code?.toUpperCase() ||
          openCageComponents.country,
        types: ["country"],
      });
    }

    return components;
  }

  /**
   * Convert Nominatim address format to Google Maps format (kept for fallback compatibility)
   */
  private convertNominatimToGoogleFormat(nominatimAddress: any): any[] {
    return this.convertOpenCageComponentsToGoogleFormat(nominatimAddress);
  }

  /**
   * Format coordinates as a readable address using geographical context
   */
  private async formatCoordinatesAsAddress(
    coordinates: Coordinates,
  ): Promise<string> {
    // Check if coordinates are in known regions (India focus)
    const { lat, lng } = coordinates;

    // India bounding box check
    if (lat >= 6.0 && lat <= 37.6 && lng >= 68.7 && lng <= 97.25) {
      // Rough region detection for India
      let region = "India";

      if (lat >= 28.4 && lat <= 28.8 && lng >= 76.8 && lng <= 77.3) {
        region = "Gurgaon, Haryana, India";
      } else if (lat >= 28.5 && lat <= 28.7 && lng >= 77.1 && lng <= 77.3) {
        region = "New Delhi, India";
      } else if (lat >= 19.0 && lat <= 19.3 && lng >= 72.7 && lng <= 73.0) {
        region = "Mumbai, Maharashtra, India";
      } else if (lat >= 12.8 && lat <= 13.1 && lng >= 77.4 && lng <= 77.8) {
        region = "Bangalore, Karnataka, India";
      } else if (lat >= 17.3 && lat <= 17.5 && lng >= 78.3 && lng <= 78.6) {
        region = "Hyderabad, Telangana, India";
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}, ${region}`;
    }

    // Default coordinates display
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  /**
   * Geocode address to coordinates using OpenCage as primary provider
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      // Method 1: OpenCage API (Primary)
      try {
        const result = await openCageService.forwardGeocode(address);
        console.log("✅ OpenCage forward geocoding successful:", result);
        return result;
      } catch (openCageError) {
        console.warn("OpenCage forward geocoding failed, trying backend:", openCageError);
      }

      // Method 2: Backend proxy (fallback)
      const { getApiBaseUrl } = await import('../config/env');
      const apiBaseUrl = getApiBaseUrl();

      if (!apiBaseUrl) {
        throw new Error("Backend not available for geocoding");
      }

      const response = await fetch(
        `${apiBaseUrl}/google-maps/geocode-address?address=${encodeURIComponent(address)}&language=en&region=IN`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        return {
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
          formatted_address: result.formatted_address,
          place_id: result.place_id,
        };
      }

      throw new Error(`Geocoding failed: ${data.status}`);
    } catch (error) {
      throw new Error(
        `Geocoding error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get place autocomplete suggestions using OpenCage geocoding
   */
  async getPlaceAutocomplete(
    input: string,
    location?: Coordinates,
    radius?: number,
  ): Promise<PlaceAutocomplete[]> {
    try {
      // Use OpenCage for autocomplete suggestions
      const results = await openCageService.getGeocodingSuggestions(input, 5);

      return results.map((result, index) => ({
        place_id: result.place_id || `opencage_${index}`,
        description: result.formatted_address,
        structured_formatting: {
          main_text: this.extractMainText(result.formatted_address),
          secondary_text: this.extractSecondaryText(result.formatted_address)
        }
      }));
    } catch (error) {
      console.warn("OpenCage autocomplete failed:", error);
      return [];
    }
  }

  /**
   * Extract main text from formatted address for autocomplete display
   */
  private extractMainText(address: string): string {
    const parts = address.split(',');
    return parts[0]?.trim() || address;
  }

  /**
   * Extract secondary text from formatted address for autocomplete display
   */
  private extractSecondaryText(address: string): string {
    const parts = address.split(',');
    return parts.slice(1).join(',').trim() || '';
  }

  /**
   * Search for nearby places of interest
   */
  async getNearbyPlaces(
    coordinates: Coordinates,
    radius: number = 500,
    type?: string,
  ): Promise<any[]> {
    if (!this.GOOGLE_MAPS_API_KEY) {
      return [];
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${radius}&key=${this.GOOGLE_MAPS_API_KEY}`;

      if (type) {
        url += `&type=${type}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        return data.results || [];
      }

      return [];
    } catch (error) {
      console.warn("Nearby places search failed:", error);
      return [];
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.GOOGLE_MAPS_API_KEY) {
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,types,rating,vicinity&key=${this.GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        return data.result;
      }

      return null;
    } catch (error) {
      console.warn("Place details failed:", error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers using OpenCage service
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const openCageCoord1: OpenCageCoordinates = { lat: coord1.lat, lng: coord1.lng };
    const openCageCoord2: OpenCageCoordinates = { lat: coord2.lat, lng: coord2.lng };
    return openCageService.calculateDistance(openCageCoord1, openCageCoord2);
  }

  /**
   * Mock methods for database operations (previously Supabase)
   */
  async saveLocationToDatabase(
    locationData: LocationData,
  ): Promise<LocationData> {
    // Mock implementation - save to localStorage
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    existingLocations.push(locationData);
    localStorage.setItem("saved_locations", JSON.stringify(existingLocations));
    return locationData;
  }

  async getSavedLocations(): Promise<LocationData[]> {
    // Mock implementation - load from localStorage
    return JSON.parse(localStorage.getItem("saved_locations") || "[]");
  }

  async updateLocationInDatabase(
    locationId: string,
    updates: Partial<LocationData>,
  ): Promise<LocationData> {
    // Mock implementation
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    const updatedLocations = existingLocations.map((loc: LocationData) =>
      loc.id === locationId
        ? { ...loc, ...updates, updatedAt: new Date() }
        : loc,
    );
    localStorage.setItem("saved_locations", JSON.stringify(updatedLocations));
    return updatedLocations.find((loc: LocationData) => loc.id === locationId);
  }

  async deleteLocationFromDatabase(locationId: string): Promise<void> {
    // Mock implementation
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    const filteredLocations = existingLocations.filter(
      (loc: LocationData) => loc.id !== locationId,
    );
    localStorage.setItem("saved_locations", JSON.stringify(filteredLocations));
  }
}

export const locationService = new LocationService();
