import { config } from "../config/env";

export interface DetectedLocationData {
  full_address: string;
  city: string;
  state?: string;
  country?: string;
  pincode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  detection_method: "gps" | "ip" | "manual" | "autocomplete";
}

export interface LocationAvailabilityResponse {
  success: boolean;
  is_available: boolean;
  message?: string;
  error?: string;
}

export interface DetectedLocationResponse {
  success: boolean;
  data?: any;
  is_available?: boolean;
  error?: string;
}

export class LocationDetectionService {
  private static instance: LocationDetectionService;
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = config.apiBaseUrl;
  }

  public static getInstance(): LocationDetectionService {
    if (!LocationDetectionService.instance) {
      LocationDetectionService.instance = new LocationDetectionService();
    }
    return LocationDetectionService.instance;
  }

  /**
   * Save detected location to backend
   */
  async saveDetectedLocation(
    locationData: DetectedLocationData,
  ): Promise<DetectedLocationResponse> {
    try {
      console.log("📍 Saving detected location:", locationData);

      if (!this.apiBaseUrl) {
        console.warn("⚠️ No API URL configured for location detection");
        return {
          success: false,
          error: "API not configured",
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/detected-locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Location saved to backend:", result);

      return result;
    } catch (error) {
      console.error("❌ Failed to save detected location:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if location is available for service
   */
  async checkLocationAvailability(
    city: string,
    pincode?: string,
    fullAddress?: string,
  ): Promise<LocationAvailabilityResponse> {
    try {
      if (!this.apiBaseUrl) {
        // Fallback local check
        return this.checkAvailabilityLocal(city, pincode, fullAddress);
      }

      const response = await fetch(
        `${this.apiBaseUrl}/detected-locations/check-availability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            city,
            pincode,
            full_address: fullAddress,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      // Also check locally as a secondary validation with full address
      if (result.is_available) {
        const localCheck = this.checkAvailabilityLocal(city, pincode, fullAddress);
        if (!localCheck.is_available) {
          console.log('🔍 Backend said available but local check failed, using local result');
          return localCheck; // Use stricter local check
        }
      }

      return result;
    } catch (error) {
      console.error("❌ Failed to check availability:", error);
      // Fallback to local check with full address
      return this.checkAvailabilityLocal(city, pincode, fullAddress);
    }
  }

  /**
   * Local fallback for availability check - Service only in Sector 69 Gurugram
   */
  private checkAvailabilityLocal(
    city: string,
    pincode?: string,
    fullAddress?: string,
  ): LocationAvailabilityResponse {
    console.log("📍 Location availability check:", { city, pincode, fullAddress });

    // Check if location is in Sector 69, Gurugram with full address context
    const isAvailable = this.isLocationInServiceArea(city, pincode, fullAddress);

    return {
      success: true,
      is_available: isAvailable,
      message: isAvailable
        ? "Service available in your area"
        : "Service currently only available in Sector 69, Gurugram (Pincode: 122505)",
    };
  }

  /**
   * Check if location is in our service area (Sector 69, Gurugram)
   */
  private isLocationInServiceArea(city: string, pincode?: string, fullAddress?: string): boolean {
    const normalizedCity = city.toLowerCase().trim();
    const normalizedPincode = pincode?.trim();
    const normalizedFullAddress = fullAddress?.toLowerCase().trim() || '';

    // Combine city and full address for comprehensive checking
    const searchText = `${normalizedCity} ${normalizedFullAddress}`.toLowerCase();

    // Check for Sector 69 mentions in various formats
    const isSector69 = searchText.includes('sector 69') ||
                      searchText.includes('sector-69') ||
                      searchText.includes('sec 69') ||
                      searchText.includes('sec-69') ||
                      searchText.includes('sector69');

    // Check for Gurugram/Gurgaon mentions
    const isGurugram = searchText.includes('gurugram') ||
                      searchText.includes('gurgaon') ||
                      searchText.includes('gurgram'); // Common misspelling

    // Check pincode for Sector 69 Gurugram (122505)
    const isCorrectPincode = normalizedPincode === '122505';

    // Must have both Sector 69 and Gurugram/Gurgaon mentions, or correct pincode
    const isInServiceArea = (isSector69 && isGurugram) || isCorrectPincode;

    console.log('🏠 Service area check:', {
      searchText: searchText.substring(0, 100) + (searchText.length > 100 ? '...' : ''),
      pincode: normalizedPincode,
      isSector69,
      isGurugram,
      isCorrectPincode,
      isInServiceArea
    });

    return isInServiceArea;
  }

  /**
   * Detect location using browser geolocation API
   */
  async detectLocationGPS(): Promise<DetectedLocationData | null> {
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation not supported");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          });
        },
      );

      const { latitude, longitude } = position.coords;
      console.log("📍 GPS coordinates detected:", { latitude, longitude });

      // Try to get address from coordinates using reverse geocoding
      const addressData = await this.reverseGeocode(latitude, longitude);

      let detectedLocation: DetectedLocationData;
      if (addressData) {
        detectedLocation = {
          ...addressData,
          coordinates: { lat: latitude, lng: longitude },
          detection_method: "gps",
        };
      } else {
        detectedLocation = {
          full_address: `Coordinates: ${latitude}, ${longitude}`,
          city: "Unknown",
          coordinates: { lat: latitude, lng: longitude },
          detection_method: "gps",
        };
      }

      // Auto-save detected location to database
      try {
        await this.saveDetectedLocation(detectedLocation);
        console.log("✅ GPS location saved to database");
      } catch (error) {
        console.warn("⚠️ Failed to save GPS location to database:", error);
      }

      return detectedLocation;
    } catch (error) {
      console.error("❌ GPS detection failed:", error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  private async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<Omit<
    DetectedLocationData,
    "coordinates" | "detection_method"
  > | null> {
    try {
      // Try Google Maps Geocoding API if available
      if ((window as any).google?.maps) {
        const geocoder = new (window as any).google.maps.Geocoder();
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode(
            { location: { lat, lng } },
            (results: any, status: any) => {
              if (status === "OK" && results[0]) {
                resolve(results[0]);
              } else {
                reject(new Error("Geocoding failed"));
              }
            },
          );
        });

        return this.parseGoogleMapsResult(result);
      }

      // Fallback to a free geocoding service (example with Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );

      if (!response.ok) throw new Error("Nominatim request failed");

      const data = await response.json();

      return {
        full_address: data.display_name || "Unknown address",
        city:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "Unknown",
        state: data.address?.state || "",
        country: data.address?.country || "India",
        pincode: data.address?.postcode || "",
      };
    } catch (error) {
      console.error("❌ Reverse geocoding failed:", error);
      return null;
    }
  }

  /**
   * Parse Google Maps geocoding result
   */
  private parseGoogleMapsResult(
    result: any,
  ): Omit<DetectedLocationData, "coordinates" | "detection_method"> {
    const components = result.address_components || [];

    let city = "";
    let state = "";
    let country = "";
    let pincode = "";

    components.forEach((component: any) => {
      const types = component.types || [];

      if (
        types.includes("locality") ||
        types.includes("administrative_area_level_2")
      ) {
        city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        state = component.long_name;
      } else if (types.includes("country")) {
        country = component.long_name;
      } else if (types.includes("postal_code")) {
        pincode = component.long_name;
      }
    });

    return {
      full_address: result.formatted_address || "Unknown address",
      city: city || "Unknown",
      state,
      country: country || "India",
      pincode,
    };
  }
}
