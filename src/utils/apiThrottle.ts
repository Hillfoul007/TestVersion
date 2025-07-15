/**
 * API call throttle utility to prevent excessive requests and rate limiting
 */

interface ThrottleEntry {
  lastCall: number;
  pendingCall?: Promise<any>;
}

class APIThrottle {
  private static instance: APIThrottle;
  private throttleMap: Map<string, ThrottleEntry> = new Map();
  private defaultDelay = 1000; // 1 second between calls

  public static getInstance(): APIThrottle {
    if (!APIThrottle.instance) {
      APIThrottle.instance = new APIThrottle();
    }
    return APIThrottle.instance;
  }

  /**
   * Throttle API calls to prevent rate limiting
   */
  async throttle<T>(
    key: string,
    apiCall: () => Promise<T>,
    delay: number = this.defaultDelay,
  ): Promise<T> {
    const entry = this.throttleMap.get(key);
    const now = Date.now();

    if (entry) {
      const timeSinceLastCall = now - entry.lastCall;

      // If there's a pending call for the same key, return it
      if (entry.pendingCall) {
        console.log(`🔄 Reusing pending API call for: ${key}`);
        return entry.pendingCall;
      }

      // If we need to wait, add delay
      if (timeSinceLastCall < delay) {
        const waitTime = delay - timeSinceLastCall;
        console.log(`⏳ Throttling API call for ${key}, waiting ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Make the API call
    const promise = apiCall();
    this.throttleMap.set(key, {
      lastCall: Date.now(),
      pendingCall: promise,
    });

    try {
      const result = await promise;
      // Clear pending call on success
      const currentEntry = this.throttleMap.get(key);
      if (currentEntry) {
        this.throttleMap.set(key, { lastCall: currentEntry.lastCall });
      }
      return result;
    } catch (error) {
      // Clear pending call on error
      const currentEntry = this.throttleMap.get(key);
      if (currentEntry) {
        this.throttleMap.set(key, { lastCall: currentEntry.lastCall });
      }
      throw error;
    }
  }

  /**
   * Clear throttle for a specific key
   */
  clear(key: string): void {
    this.throttleMap.delete(key);
  }

  /**
   * Clear all throttles
   */
  clearAll(): void {
    this.throttleMap.clear();
  }

  /**
   * Check if a key is currently being throttled
   */
  isThrottled(key: string, delay: number = this.defaultDelay): boolean {
    const entry = this.throttleMap.get(key);
    if (!entry) return false;

    const timeSinceLastCall = Date.now() - entry.lastCall;
    return timeSinceLastCall < delay;
  }
}

export default APIThrottle;
