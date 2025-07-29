/**
 * OpenCage Geocoding Service
 * Provides geocoding and reverse geocoding using OpenCage Data API
 * Replaces Google Maps Geocoding API functionality
 */

export interface OpenCageCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface OpenCageResult {
  annotations?: any;
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  components: {
    [key: string]: any;
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    state_code?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  confidence: number;
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
}

export interface OpenCageResponse {
  documentation: string;
  licenses: any[];
  rate: {
    limit: number;
    remaining: number;
    reset: number;
  };
  results: OpenCageResult[];
  status: {
    code: number;
    message: string;
  };
  stay_informed: {
    blog: string;
    mastodon: string;
  };
  thanks: string;
  timestamp: {
    created_http: string;
    created_unix: number;
  };
  total_results: number;
}

export interface GeocodeResult {
  coordinates: OpenCageCoordinates;
  formatted_address: string;
  place_id?: string;
  components?: any;
}

class OpenCageService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://api.opencagedata.com/geocode/v1/json';
  private readonly DEFAULT_PARAMS = {
    language: 'en',
    limit: '5',
    no_annotations: '1',
    pretty: '1'
  };

  constructor() {
    // Use the provided API key as fallback
    this.API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || 'bb9e8b5e99a24e1c811e89a6c1099fd1';
    
    if (!this.API_KEY) {
      console.warn('⚠️ OpenCage API key not configured. Geocoding functionality will be limited.');
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinates: OpenCageCoordinates): Promise<string> {
    try {
      console.log('🔍 OpenCage reverse geocoding for:', coordinates);

      const params = new URLSearchParams({
        q: `${coordinates.lat},${coordinates.lng}`,
        key: this.API_KEY,
        countrycode: 'in', // Focus on India
        ...this.DEFAULT_PARAMS
      });

      const url = `${this.BASE_URL}?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Laundrify-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenCage API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenCageResponse = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log('✅ OpenCage reverse geocoding result:', result);
        
        // Return the formatted address or build a custom one
        return this.formatIndianAddress(result.components) || result.formatted;
      }

      throw new Error('No results found');
    } catch (error) {
      console.error('❌ OpenCage reverse geocoding failed:', error);
      throw error;
    }
  }

  /**
   * Forward geocode address to coordinates
   */
  async forwardGeocode(address: string): Promise<GeocodeResult> {
    try {
      console.log('🔍 OpenCage forward geocoding for:', address);

      const params = new URLSearchParams({
        q: address,
        key: this.API_KEY,
        countrycode: 'in', // Focus on India
        ...this.DEFAULT_PARAMS
      });

      const url = `${this.BASE_URL}?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Laundrify-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenCage API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenCageResponse = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log('✅ OpenCage forward geocoding result:', result);
        
        return {
          coordinates: {
            lat: result.geometry.lat,
            lng: result.geometry.lng
          },
          formatted_address: this.formatIndianAddress(result.components) || result.formatted,
          place_id: `opencage_${result.geometry.lat}_${result.geometry.lng}`,
          components: result.components
        };
      }

      throw new Error('No results found');
    } catch (error) {
      console.error('❌ OpenCage forward geocoding failed:', error);
      throw error;
    }
  }

  /**
   * Get multiple geocoding suggestions for autocomplete
   */
  async getGeocodingSuggestions(query: string, limit: number = 5): Promise<GeocodeResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        key: this.API_KEY,
        countrycode: 'in',
        limit: limit.toString(),
        language: 'en',
        no_annotations: '1',
        pretty: '1'
      });

      const url = `${this.BASE_URL}?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Laundrify-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenCage API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenCageResponse = await response.json();

      return data.results.map(result => ({
        coordinates: {
          lat: result.geometry.lat,
          lng: result.geometry.lng
        },
        formatted_address: this.formatIndianAddress(result.components) || result.formatted,
        place_id: `opencage_${result.geometry.lat}_${result.geometry.lng}`,
        components: result.components
      }));
    } catch (error) {
      console.error('❌ OpenCage geocoding suggestions failed:', error);
      return [];
    }
  }

  /**
   * Format Indian address from OpenCage components
   */
  private formatIndianAddress(components: any): string {
    if (!components) return '';

    const parts = [
      components.house_number,
      components.road,
      components.neighbourhood || components.suburb,
      components.village || components.town || components.city,
      components.county,
      components.state,
      components.postcode
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Extract house number from Indian address
   */
  extractHouseNumber(address: string): {
    houseNumber: string;
    building: string;
    cleanedAddress: string;
  } {
    let houseNumber = '';
    let building = '';
    let cleanedAddress = address;

    // Split address into parts
    const parts = address.split(',').map(part => part.trim());
    const firstPart = parts[0] || '';

    // Pattern 1: Simple house numbers (123, 45, etc.) - but not pincodes
    const simpleNumberMatch = firstPart.match(/^\s*(\d+)\s*$/);
    if (simpleNumberMatch && !simpleNumberMatch[1].match(/^\d{6}$/)) {
      houseNumber = simpleNumberMatch[1];
      cleanedAddress = parts.slice(1).join(', ').trim();
      return { houseNumber, building, cleanedAddress };
    }

    // Pattern 2: House number with suffix (123A, 45B, etc.)
    const numberSuffixMatch = firstPart.match(/^\s*(\d+[A-Z]+)\s*$/i);
    if (numberSuffixMatch) {
      houseNumber = numberSuffixMatch[1].toUpperCase();
      cleanedAddress = parts.slice(1).join(', ').trim();
      return { houseNumber, building, cleanedAddress };
    }

    // Pattern 3: Alphanumeric formats (A-123, B/45, Plot-67, etc.)
    const alphaNumericMatch = firstPart.match(/^\s*([A-Z]*[-\/]?\d+[A-Z]*)\s*$/i);
    if (alphaNumericMatch) {
      houseNumber = alphaNumericMatch[1].toUpperCase();
      cleanedAddress = parts.slice(1).join(', ').trim();
      return { houseNumber, building, cleanedAddress };
    }

    // Pattern 4: House number with description (House No 123, Plot 45, etc.)
    const houseDescMatch = firstPart.match(
      /(house\s+no\.?|plot\s+no\.?|flat\s+no\.?|door\s+no\.?|#)\s*(\d+[A-Z]*)/i
    );
    if (houseDescMatch) {
      houseNumber = houseDescMatch[2];
      cleanedAddress = firstPart.replace(houseDescMatch[0], '').trim() + 
        ', ' + parts.slice(1).join(', ');
      cleanedAddress = cleanedAddress.replace(/^,\s*/, '').trim();
      return { houseNumber, building, cleanedAddress };
    }

    // Extract any number from first part as fallback
    const anyNumberMatch = firstPart.match(/(\d+)/);
    if (anyNumberMatch) {
      houseNumber = anyNumberMatch[1];
      const buildingPart = firstPart.replace(anyNumberMatch[0], '').trim();
      if (buildingPart.length > 2) {
        building = buildingPart.replace(/[,-]/g, '').trim();
      }
      cleanedAddress = parts.slice(1).join(', ').trim();
    }

    return { houseNumber, building, cleanedAddress };
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(coord1: OpenCageCoordinates, coord2: OpenCageCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check API status and rate limits
   */
  async checkApiStatus(): Promise<{
    available: boolean;
    remaining: number;
    reset: number;
  }> {
    try {
      // Make a simple geocoding request to check status
      const params = new URLSearchParams({
        q: 'India',
        key: this.API_KEY,
        limit: '1',
        no_annotations: '1'
      });

      const url = `${this.BASE_URL}?${params}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data: OpenCageResponse = await response.json();
        return {
          available: true,
          remaining: data.rate?.remaining || 0,
          reset: data.rate?.reset || 0
        };
      }

      return {
        available: false,
        remaining: 0,
        reset: 0
      };
    } catch (error) {
      console.error('OpenCage API status check failed:', error);
      return {
        available: false,
        remaining: 0,
        reset: 0
      };
    }
  }
}

export const openCageService = new OpenCageService();
