import { LocationDetectionService } from './locationDetectionService';
import { locationService } from './locationService';

export interface LoginLocationCheckResult {
  isInServiceArea: boolean;
  detectedLocation: string;
  coordinates?: { lat: number; lng: number };
}

export class LoginLocationChecker {
  private static instance: LoginLocationChecker;
  private hasCheckedThisSession = false;
  private locationService = LocationDetectionService.getInstance();

  public static getInstance(): LoginLocationChecker {
    if (!LoginLocationChecker.instance) {
      LoginLocationChecker.instance = new LoginLocationChecker();
    }
    return LoginLocationChecker.instance;
  }

  /**
   * Check user's location after login and return result
   */
  async checkLocationAfterLogin(): Promise<LoginLocationCheckResult | null> {
    // Only check once per session to avoid annoying the user
    if (this.hasCheckedThisSession) {
      console.log('🔄 Location already checked this session, skipping');
      return null;
    }

    try {
      console.log('📍 Starting location check after login...');
      this.hasCheckedThisSession = true;

      // Try to get current location
      const location = await this.getCurrentLocationQuick();
      if (!location) {
        console.log('⚠️ Could not detect location, skipping check');
        return null;
      }

      const { coordinates, address } = location;
      console.log('📍 Location detected:', { address, coordinates });

      // Extract city and pincode from address for availability check
      const addressParts = address.split(',').map(part => part.trim());
      let city = '';
      let pincode = '';

      // Try to extract pincode (6 digits)
      const pincodeMatch = address.match(/\b\d{6}\b/);
      if (pincodeMatch) {
        pincode = pincodeMatch[0];
      }

      // Use the most specific location part as city
      if (addressParts.length > 0) {
        // Usually the first or second part contains the most specific location
        city = addressParts.slice(0, 2).join(', ');
      }

      // Check availability
      const availability = await this.locationService.checkLocationAvailability(
        city,
        pincode,
        address
      );

      console.log('🏠 Location availability result:', availability);

      return {
        isInServiceArea: availability.is_available,
        detectedLocation: address,
        coordinates
      };

    } catch (error) {
      console.error('❌ Location check after login failed:', error);
      this.hasCheckedThisSession = false; // Reset so it can be tried again
      return null;
    }
  }

  /**
   * Get current location quickly with fallback
   */
  private async getCurrentLocationQuick(): Promise<{ coordinates: { lat: number; lng: number }, address: string } | null> {
    try {
      // First try quick location detection
      const coordinates = await locationService.getCurrentPosition({
        enableHighAccuracy: false, // Use network/wifi for speed
        timeout: 5000,
        maximumAge: 300000 // 5 minutes cache
      });

      console.log('⚡ Quick coordinates obtained:', coordinates);

      // Get address from coordinates
      const address = await locationService.reverseGeocode(coordinates);
      if (!address) {
        throw new Error('Could not get address from coordinates');
      }

      return {
        coordinates: { lat: coordinates.lat, lng: coordinates.lng },
        address
      };

    } catch (error) {
      console.warn('⚠️ Quick location failed, trying high accuracy:', error);

      try {
        // Fallback to high accuracy with longer timeout
        const coordinates = await locationService.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });

        console.log('🎯 High accuracy coordinates obtained:', coordinates);

        const address = await locationService.reverseGeocode(coordinates);
        if (!address) {
          throw new Error('Could not get address from coordinates');
        }

        return {
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
          address
        };

      } catch (highAccuracyError) {
        console.error('❌ All location detection methods failed:', highAccuracyError);
        return null;
      }
    }
  }

  /**
   * Reset the session check flag (useful for testing or forced rechecks)
   */
  resetSessionCheck(): void {
    this.hasCheckedThisSession = false;
    console.log('🔄 Location check session reset');
  }

  /**
   * Check if we've already checked location this session
   */
  hasCheckedLocation(): boolean {
    return this.hasCheckedThisSession;
  }
}

export const loginLocationChecker = LoginLocationChecker.getInstance();
