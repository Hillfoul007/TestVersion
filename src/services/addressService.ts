import { config } from "../config/env";
import { getCurrentUser, getUserId, isUserAuthenticated } from "../utils/authUtils";

export interface AddressData {
  id?: string;
  _id?: string;
  flatNo: string;
  flatHouseNo?: string;
  street: string;
  landmark: string;
  village: string;
  city: string;
  pincode: string;
  fullAddress: string;
  coordinates?: { lat: number; lng: number };
  label: string;
  type: "home" | "work" | "other";
  createdAt?: string;
  updatedAt?: string;
  status?: "active" | "deleted";
  phone?: string;
}

export interface AddressResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: AddressData | AddressData[];
}

export class AddressService {
  private static instance: AddressService;
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = config.apiBaseUrl;
  }

  public static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  /**
   * Get user ID for API calls with better fallback
   */
  private getCurrentUserId(): string | null {
    const userId = getUserId();

    if (!userId) {
      // Try to get from current user object
      const currentUser = getCurrentUser();
      if (currentUser) {
        const id = currentUser.id || currentUser._id || currentUser.phone;
        if (id) {
          console.log(`🔑 Using user ID from current user object: ${id}`);
          return id;
        }
      }

      console.log(`🔑 No user ID found, using guest mode`);
      return null;
    }

    console.log(`🔑 Using user ID from auth utils: ${userId}`);
    return userId;
  }

  /**
   * Get addresses from localStorage with better error handling
   */
  private getAddressesFromLocalStorage(userId: string): AddressData[] {
    try {
      const storageKey = `addresses_${userId}`;
      const savedAddresses = localStorage.getItem(storageKey);

      console.log(`💾 Checking localStorage for addresses with key: ${storageKey}`);

      if (savedAddresses) {
        const addresses = JSON.parse(savedAddresses);
        const validAddresses = Array.isArray(addresses) ? addresses : [];
        console.log(`💾 Found ${validAddresses.length} addresses in localStorage`);
        return validAddresses;
      }

      console.log(`💾 No addresses found in localStorage for ${storageKey}`);
      return [];
    } catch (error) {
      console.error(`❌ Error reading addresses from localStorage:`, error);
      return [];
    }
  }

  /**
   * Delete address (soft delete with status update)
   */
  async deleteAddress(addressId: string): Promise<AddressResponse> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn("⚠️ User not authenticated, using localStorage only");
        return this.deleteAddressFromLocalStorage(addressId, "guest");
      }

      console.log("🗑️ Deleting address:", { addressId, userId });

      // Skip backend call if no API URL configured
      if (!this.apiBaseUrl) {
        console.log("🌐 No API URL configured, using localStorage only");
        return this.deleteAddressFromLocalStorage(addressId, userId);
      }

      const response = await fetch(
        `${this.apiBaseUrl}/addresses/${addressId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        // Check for rate limiting
        if (response.status === 429) {
          throw new Error("Too many requests, please try again later");
        }

        throw new Error(
          errorData.error || `HTTP ${response.status}: ${errorText}`,
        );
      }

      const result = await response.json();
      console.log("✅ Address deleted from backend:", result);

      // Also remove from localStorage
      this.deleteAddressFromLocalStorage(addressId, userId);

      return {
        success: true,
        message: "Address deleted successfully",
        data: result.data,
      };
    } catch (error) {
      console.error("❌ Failed to delete address from backend:", error);

      // Fallback to localStorage deletion
      const userId = this.getCurrentUserId();
      if (userId) {
        const result = this.deleteAddressFromLocalStorage(addressId, userId);
        return {
          ...result,
          message: "Address deleted locally (will sync when online)",
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete address",
      };
    }
  }

  /**
   * Delete address from localStorage
   */
  private deleteAddressFromLocalStorage(
    addressId: string,
    userId: string,
  ): AddressResponse {
    try {
      const storageKey = `addresses_${userId}`;
      const savedAddresses = localStorage.getItem(storageKey);

      if (!savedAddresses) {
        return { success: false, error: "No addresses found" };
      }

      const addresses = JSON.parse(savedAddresses);
      if (!Array.isArray(addresses)) {
        return { success: false, error: "Invalid address data" };
      }

      // Remove the address instead of marking as deleted for localStorage
      const updatedAddresses = addresses.filter(
        (addr) => addr.id !== addressId && addr._id !== addressId,
      );

      localStorage.setItem(storageKey, JSON.stringify(updatedAddresses));
      console.log("✅ Address removed from localStorage");

      return {
        success: true,
        message: "Address deleted successfully",
      };
    } catch (error) {
      console.error("Failed to delete address from localStorage:", error);
      return {
        success: false,
        error: "Failed to delete address locally",
      };
    }
  }

  /**
   * Get user addresses (active only)
   */
  async getUserAddresses(): Promise<AddressResponse> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn("⚠️ User not authenticated, checking guest localStorage...");

        // Check guest localStorage
        const guestAddresses = this.getAddressesFromLocalStorage("guest");
        return {
          success: true,
          data: guestAddresses,
        };
      }

      // Try backend first
      if (this.apiBaseUrl) {
        try {
          const response = await fetch(`${this.apiBaseUrl}/addresses`, {
            headers: {
              "Content-Type": "application/json",
              "user-id": userId,
            },
          });

          if (response.ok) {
            const result = await response.json();
            // Transform backend format to frontend format
            const transformedAddresses = (result.data || []).map(
              (addr: any) => ({
                id: addr._id,
                _id: addr._id,
                flatNo: addr.full_address.split(",")[0] || "",
                street: addr.area || "",
                landmark: addr.landmark || "",
                village: addr.city || "",
                city: addr.city || "",
                pincode: addr.pincode || "",
                fullAddress: addr.full_address,
                coordinates: addr.coordinates,
                label: addr.title || addr.address_type,
                type: addr.address_type || "other",
                phone: addr.contact_phone || "",
                createdAt: addr.created_at,
                status: addr.status,
              }),
            );

            return {
              success: true,
              data: transformedAddresses,
            };
          }
        } catch (error) {
          console.warn("Backend fetch failed, using localStorage:", error);
        }
      }

      // Fallback to localStorage
      const addresses = this.getAddressesFromLocalStorage(userId);
      return {
        success: true,
        data: addresses,
      };
    } catch (error) {
      console.error("Failed to get user addresses:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get addresses",
        data: [],
      };
    }
  }

  /**
   * Save address to backend and localStorage
   */
  async saveAddress(addressData: AddressData): Promise<AddressResponse> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn("⚠️ User not authenticated, saving to localStorage only");
        return this.saveAddressToLocalStorage(addressData, "guest");
      }

      console.log("💾 Saving address:", addressData);

      // Prepare data for backend
      const backendData = {
        title: addressData.label || addressData.type,
        full_address: addressData.fullAddress,
        area: addressData.street || addressData.village,
        city: addressData.city || addressData.village,
        state: "India", // Default state
        pincode: addressData.pincode,
        landmark: addressData.landmark,
        coordinates: addressData.coordinates,
        address_type: addressData.type,
        contact_phone: addressData.phone,
        is_default: false, // You can modify this logic
        status: "active",
      };

      // Try to save to backend first
      if (this.apiBaseUrl) {
        try {
          const url = addressData.id
            ? `${this.apiBaseUrl}/addresses/${addressData.id}`
            : `${this.apiBaseUrl}/addresses`;

          const method = addressData.id ? "PUT" : "POST";

          const response = await fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
              "user-id": userId,
            },
            body: JSON.stringify(backendData),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("✅ Address saved to backend:", result);

            // Also save to localStorage as backup
            this.saveAddressToLocalStorage(addressData, userId);

            return {
              success: true,
              message: "Address saved successfully",
              data: result.data,
            };
          } else {
            const errorText = await response.text();
            console.error("Backend save failed:", errorText);
            // Still try to save locally
          }
        } catch (error) {
          console.error("Backend save error:", error);
          // Continue to localStorage save
        }
      }

      // Fallback to localStorage
      const result = this.saveAddressToLocalStorage(addressData, userId);
      return {
        ...result,
        message: "Address saved locally (will sync when online)",
      };
    } catch (error) {
      console.error("Failed to save address:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save address",
      };
    }
  }

  /**
   * Save address to localStorage
   */
  private saveAddressToLocalStorage(
    addressData: AddressData,
    userId: string,
  ): AddressResponse {
    try {
      const storageKey = `addresses_${userId}`;
      const savedAddresses = localStorage.getItem(storageKey);
      const addresses = savedAddresses ? JSON.parse(savedAddresses) : [];

      // Add unique ID if not present
      if (!addressData.id && !addressData._id) {
        addressData.id = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Add timestamps
      if (!addressData.createdAt) {
        addressData.createdAt = new Date().toISOString();
      }

      // Update existing address or add new one
      const existingIndex = addresses.findIndex(
        (addr: AddressData) =>
          addr.id === addressData.id || addr._id === addressData._id,
      );

      if (existingIndex >= 0) {
        addresses[existingIndex] = {
          ...addresses[existingIndex],
          ...addressData,
        };
      } else {
        addresses.push(addressData);
      }

      localStorage.setItem(storageKey, JSON.stringify(addresses));
      console.log("✅ Address saved to localStorage");

      return {
        success: true,
        message: "Address saved successfully",
        data: addressData,
      };
    } catch (error) {
      console.error("Failed to save address to localStorage:", error);
      return {
        success: false,
        error: "Failed to save address locally",
      };
    }
  }
}
