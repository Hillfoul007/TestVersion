// Enhanced API client with better error handling and CORS support
import { config } from "@/config/env";

const API_BASE_URL = config.apiBaseUrl;

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class EnhancedApiClient {
  private baseURL: string;
  private token: string | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ""); // Remove trailing slash
    this.token = localStorage.getItem("auth_token");
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createRequestKey(url: string, options: RequestOptions): string {
    return `${options.method || "GET"}:${url}:${JSON.stringify(options.body || {})}`;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestOptions & { timeout?: number },
  ): Promise<Response> {
    const { timeout = 30000, ...fetchOptions } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      body,
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
      ...requestOptions
    } = options;

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    // Create request key for deduplication
    const requestKey = this.createRequestKey(url, options);

    // Return existing request if in progress
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((requestOptions.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const requestPromise = this.executeRequestWithRetry<T>(
      url,
      {
        method: "GET",
        ...requestOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        timeout,
        credentials: "include", // Include credentials for CORS
        mode: "cors", // Explicitly set CORS mode
      },
      retries,
      retryDelay,
    );

    // Store in queue
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up from queue
      this.requestQueue.delete(requestKey);
    }
  }

  private async executeRequestWithRetry<T>(
    url: string,
    options: RequestOptions & { timeout?: number },
    retries: number,
    retryDelay: number,
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🌐 API Request [Attempt ${attempt + 1}/${retries + 1}]:`, {
          url,
          method: options.method || "GET",
          hasAuth: !!this.token,
        });

        const response = await this.fetchWithTimeout(url, options);

        // Handle different response types
        const contentType = response.headers.get("content-type");
        let data: any;

        if (contentType?.includes("application/json")) {
          try {
            data = await response.json();
          } catch (jsonError) {
            console.warn("Failed to parse JSON response:", jsonError);
            data = null;
          }
        } else {
          const text = await response.text();
          data = text ? { message: text } : null;
        }

        if (!response.ok) {
          const errorMessage =
            data?.error ||
            data?.message ||
            `HTTP ${response.status}: ${response.statusText}`;

          // Handle specific status codes
          if (response.status === 401) {
            this.handleUnauthorized();
            return {
              error: "Authentication required. Please log in again.",
              status: response.status,
            };
          }

          if (response.status === 403) {
            console.warn(
              "🚫 403 Keep-alive ping failed - this is likely due to CORS or API key issues",
            );
            return {
              error: "Access forbidden. Check API configuration.",
              status: response.status,
            };
          }

          if (response.status >= 500 && attempt < retries) {
            console.warn(`Server error ${response.status}, retrying...`);
            await this.sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          }

          return {
            error: errorMessage,
            status: response.status,
          };
        }

        console.log("✅ API Request successful:", response.status);
        return {
          data,
          status: response.status,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        console.warn(`❌ API Request failed [Attempt ${attempt + 1}]:`, {
          error: lastError.message,
          willRetry: attempt < retries,
        });

        // Don't retry on certain errors
        if (
          lastError.message.includes("Failed to fetch") &&
          lastError.message.includes("CORS")
        ) {
          break; // Don't retry CORS errors
        }

        if (attempt < retries) {
          await this.sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // All retries exhausted
    const errorMessage = lastError?.message || "Request failed after retries";
    console.error("💥 API Request failed after all retries:", errorMessage);

    return {
      error: `Network error: ${errorMessage}`,
      status: 0,
    };
  }

  private handleUnauthorized(): void {
    console.warn("🔐 Unauthorized request - clearing token");
    this.setToken(null);

    // Optionally redirect to login or dispatch logout event
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Health check endpoint
  async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    return this.request("/health", {
      timeout: 5000,
      retries: 1,
    });
  }

  // Auth endpoints with enhanced error handling
  async register(userData: {
    email: string;
    password: string;
    name: string;
    phone: string;
    userType?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/auth/register", {
      method: "POST",
      body: userData,
    });
  }

  async login(credentials: {
    email: string;
    password: string;
    phone?: string;
  }): Promise<ApiResponse<{ token: string; [key: string]: any }>> {
    const response = await this.request<{ token: string; [key: string]: any }>(
      "/auth/login",
      {
        method: "POST",
        body: credentials,
      },
    );

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.request("/auth/logout", {
        method: "POST",
        timeout: 5000,
      });

      this.setToken(null);
      return response.error
        ? response
        : { data: { message: "Logged out successfully" } };
    } catch (error) {
      // Even if logout request fails, clear local token
      this.setToken(null);
      return { data: { message: "Logged out locally" } };
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ApiResponse<any>> {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    });
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.request("/auth/profile");
  }

  async updateProfile(profileData: {
    full_name?: string;
    phone?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/auth/profile", {
      method: "PUT",
      body: profileData,
    });
  }

  // Booking endpoints
  async createBooking(bookingData: {
    customer_id: string;
    service_type: string;
    services: string[];
    scheduled_date: string;
    scheduled_time: string;
    address: string;
    coordinates?: { lat: number; lng: number };
    total_price: number;
    additional_details?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/bookings", {
      method: "POST",
      body: bookingData,
    });
  }

  async getCustomerBookings(
    customerId: string,
    status?: string,
  ): Promise<ApiResponse<any>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(
      `/bookings/customer/${encodeURIComponent(customerId)}${query}`,
    );
  }

  async getPendingBookings(
    lat: number,
    lng: number,
  ): Promise<ApiResponse<any>> {
    return this.request(`/bookings/pending/${lat}/${lng}`);
  }

  async getRiderBookings(
    riderId: string,
    status?: string,
  ): Promise<ApiResponse<any>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(
      `/bookings/rider/${encodeURIComponent(riderId)}${query}`,
    );
  }

  async acceptBooking(
    bookingId: string,
    riderId: string,
  ): Promise<ApiResponse<any>> {
    return this.request(`/bookings/${encodeURIComponent(bookingId)}/accept`, {
      method: "PUT",
      body: { rider_id: riderId },
    });
  }

  async updateBookingStatus(
    bookingId: string,
    status: string,
    riderId?: string,
  ): Promise<ApiResponse<any>> {
    return this.request(`/bookings/${encodeURIComponent(bookingId)}/status`, {
      method: "PUT",
      body: { status, rider_id: riderId },
    });
  }

  async getBooking(bookingId: string): Promise<ApiResponse<any>> {
    return this.request(`/bookings/${encodeURIComponent(bookingId)}`);
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    userType: string,
  ): Promise<ApiResponse<any>> {
    return this.request(`/bookings/${encodeURIComponent(bookingId)}`, {
      method: "DELETE",
      body: { user_id: userId, user_type: userType },
    });
  }

  // Location endpoints with fallback handling
  async geocodeLocation(lat: number, lng: number): Promise<ApiResponse<any>> {
    return this.request("/location/geocode", {
      method: "POST",
      body: { lat, lng },
      timeout: 10000,
    });
  }

  async getCoordinates(address: string): Promise<ApiResponse<any>> {
    return this.request("/location/coordinates", {
      method: "POST",
      body: { address },
      timeout: 10000,
    });
  }

  async getAutocomplete(
    input: string,
    location?: string,
  ): Promise<ApiResponse<any>> {
    const query = location
      ? `?input=${encodeURIComponent(input)}&location=${encodeURIComponent(location)}`
      : `?input=${encodeURIComponent(input)}`;
    return this.request(`/location/autocomplete${query}`, {
      timeout: 8000,
    });
  }

  async getPlaceDetails(placeId: string): Promise<ApiResponse<any>> {
    return this.request(`/location/place/${encodeURIComponent(placeId)}`);
  }

  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<ApiResponse<any>> {
    return this.request("/location/distance", {
      method: "POST",
      body: { origin, destination },
    });
  }

  // Address endpoints
  async getAddresses(userId: string): Promise<ApiResponse<any[]>> {
    return this.request("/addresses", {
      headers: {
        "user-id": userId,
      },
    });
  }

  async createAddress(
    userId: string,
    addressData: any,
  ): Promise<ApiResponse<any>> {
    return this.request("/addresses", {
      method: "POST",
      headers: {
        "user-id": userId,
      },
      body: addressData,
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    addressData: any,
  ): Promise<ApiResponse<any>> {
    return this.request(`/addresses/${encodeURIComponent(addressId)}`, {
      method: "PUT",
      headers: {
        "user-id": userId,
      },
      body: addressData,
    });
  }

  async deleteAddress(
    userId: string,
    addressId: string,
  ): Promise<ApiResponse<any>> {
    return this.request(`/addresses/${encodeURIComponent(addressId)}`, {
      method: "DELETE",
      headers: {
        "user-id": userId,
      },
    });
  }

  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<ApiResponse<any>> {
    return this.request(
      `/addresses/${encodeURIComponent(addressId)}/set-default`,
      {
        method: "PATCH",
        headers: {
          "user-id": userId,
        },
      },
    );
  }

  // Referral endpoints
  async validateReferralCode(code: string): Promise<ApiResponse<any>> {
    return this.request(`/referrals/validate/${encodeURIComponent(code)}`);
  }

  async applyReferralCode(
    referralCode: string,
    userId: string,
  ): Promise<ApiResponse<any>> {
    return this.request("/referrals/apply", {
      method: "POST",
      body: { referralCode, userId },
    });
  }

  async generateReferralCode(userId: string): Promise<ApiResponse<any>> {
    return this.request("/referrals/generate", {
      method: "POST",
      body: { userId },
    });
  }

  async getReferralStats(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/referrals/stats/${encodeURIComponent(userId)}`);
  }

  async getReferralShareLink(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/referrals/share-link/${encodeURIComponent(userId)}`);
  }

  async applyReferralDiscount(
    bookingId: string,
    userId: string,
  ): Promise<ApiResponse<any>> {
    return this.request("/referrals/apply-discount", {
      method: "POST",
      body: { bookingId, userId },
    });
  }

  // Clear all pending requests (useful for component unmount)
  clearPendingRequests(): void {
    this.requestQueue.clear();
    console.log("🧹 Cleared all pending API requests");
  }

  // Get API connection status
  getConnectionStatus(): {
    hasToken: boolean;
    baseURL: string;
    pendingRequests: number;
  } {
    return {
      hasToken: !!this.token,
      baseURL: this.baseURL,
      pendingRequests: this.requestQueue.size,
    };
  }
}

// Create and export the enhanced API client instance
export const apiClient = new EnhancedApiClient(API_BASE_URL);

// Export types for better TypeScript support
export type { ApiResponse, RequestOptions };

// Auto-cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    apiClient.clearPendingRequests();
  });
}
