interface ReferralDiscount {
  code: string;
  discount: number;
  maxDiscount: number;
  isFirstOrder: boolean;
  description: string;
}

interface User {
  _id?: string;
  id?: string;
  phone: string;
  referralCode?: string;
  isFirstOrder?: boolean;
}

export class ReferralService {
  private static instance: ReferralService;

  public static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService();
    }
    return ReferralService.instance;
  }

  // Check if user is eligible for referral discount
  isFirstTimeUser(currentUser: User): boolean {
    if (!currentUser) return false;

    // Check if user has existing bookings
    const userId = currentUser._id || currentUser.id || currentUser.phone;
    const existingBookings = JSON.parse(
      localStorage.getItem(`user_bookings_${userId}`) || "[]",
    );

    return existingBookings.length === 0;
  }

  // Validate referral code and return discount if valid
  validateReferralCode(
    code: string,
    currentUser: User,
  ): ReferralDiscount | null {
    if (!code || !currentUser) return null;

    // Check if it's the user's first order
    const isFirstOrder = this.isFirstTimeUser(currentUser);

    if (!isFirstOrder) {
      return null; // Referral discount only for first-time users
    }

    // For now, we'll accept any referral code that follows pattern
    // In a real app, this would validate against a database
    const referralPattern = /^[A-Z0-9]{4,10}$/;

    if (referralPattern.test(code.toUpperCase())) {
      return {
        code: code.toUpperCase(),
        discount: 50, // 50% off
        maxDiscount: 200, // Max ₹200 discount
        isFirstOrder: true,
        description: "50% off on first order (up to ₹200)",
      };
    }

    return null;
  }

  // Apply referral discount to total amount
  calculateReferralDiscount(
    subtotal: number,
    referralDiscount: ReferralDiscount,
  ): number {
    if (!referralDiscount) return 0;

    const discountAmount = Math.round(
      subtotal * (referralDiscount.discount / 100),
    );
    return Math.min(discountAmount, referralDiscount.maxDiscount);
  }

  // Generate a referral code for user
  generateReferralCode(user: User): string {
    const name = user.phone || "USER";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${name.slice(-4)}${random}`.substring(0, 8);
  }

  // Store referral code usage for tracking
  trackReferralUsage(
    referralCode: string,
    userId: string,
    discountAmount: number,
  ): void {
    const usage = {
      referralCode,
      userId,
      discountAmount,
      usedAt: new Date().toISOString(),
    };

    const existingUsages = JSON.parse(
      localStorage.getItem("referral_usages") || "[]",
    );
    existingUsages.push(usage);
    localStorage.setItem("referral_usages", JSON.stringify(existingUsages));
  }

  // Award referral bonus to the referrer
  awardReferralBonus(referralCode: string): void {
    // Find the referrer and award them a coupon
    const bonusCoupon = {
      code: `REFER${Date.now().toString().slice(-6)}`,
      discount: 50,
      maxDiscount: 200,
      description: "50% off for successful referral",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    // Store the bonus coupon (in a real app, this would be stored in backend)
    const referrerCoupons = JSON.parse(
      localStorage.getItem(`referrer_coupons_${referralCode}`) || "[]",
    );
    referrerCoupons.push(bonusCoupon);
    localStorage.setItem(
      `referrer_coupons_${referralCode}`,
      JSON.stringify(referrerCoupons),
    );

    // Add notification to user's notification queue
    const notifications = JSON.parse(
      localStorage.getItem("user_notifications") || "[]",
    );
    notifications.push({
      id: `referral_${Date.now()}`,
      type: "referral_bonus",
      title: "Referral Bonus Earned! 🎉",
      message: `You've earned a ${bonusCoupon.discount}% discount coupon for referring a friend!`,
      couponCode: bonusCoupon.code,
      createdAt: new Date().toISOString(),
      read: false,
    });
    localStorage.setItem("user_notifications", JSON.stringify(notifications));

    // Trigger notification for referrer
    window.dispatchEvent(
      new CustomEvent("referralBonusAwarded", {
        detail: { referralCode, bonusCoupon },
      }),
    );

    // Trigger notification update event
    window.dispatchEvent(
      new CustomEvent("notificationUpdate", {
        detail: { type: "referral_bonus", coupon: bonusCoupon },
      }),
    );
  }

  // Get user notifications
  getUserNotifications(): any[] {
    return JSON.parse(localStorage.getItem("user_notifications") || "[]");
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: string): void {
    const notifications = this.getUserNotifications();
    const updatedNotifications = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif,
    );
    localStorage.setItem(
      "user_notifications",
      JSON.stringify(updatedNotifications),
    );
  }

  // Clear all notifications
  clearAllNotifications(): void {
    localStorage.setItem("user_notifications", JSON.stringify([]));
  }

  // Get user's available coupons (including referral bonuses)
  getUserCoupons(user: User): any[] {
    if (!user) return [];

    const userId = user._id || user.id || user.phone;
    const userReferralCode = this.generateReferralCode(user);

    // Get coupons earned from referrals
    const referralCoupons = JSON.parse(
      localStorage.getItem(`referrer_coupons_${userReferralCode}`) || "[]",
    );

    // Get general coupons
    const generalCoupons = [
      {
        code: "FIRST10",
        discount: 10,
        description: "10% off on first order",
        type: "general",
      },
      {
        code: "SAVE20",
        discount: 20,
        description: "20% off",
        type: "general",
      },
    ];

    return [
      ...referralCoupons.map((c) => ({ ...c, type: "referral" })),
      ...generalCoupons,
    ];
  }

  // Extract referral code from URL
  extractReferralFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("ref") || urlParams.get("referral");
  }

  // Store referral code for later use
  storeReferralCode(code: string): void {
    localStorage.setItem("pending_referral_code", code);
  }

  // Get stored referral code
  getStoredReferralCode(): string | null {
    return localStorage.getItem("pending_referral_code");
  }

  // Clear stored referral code
  clearStoredReferralCode(): void {
    localStorage.removeItem("pending_referral_code");
  }

  // Apply referral code for a user
  applyReferralCode(
    code: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      // In a real app, this would be an API call
      // For now, just simulate success
      setTimeout(() => {
        resolve({
          success: true,
          message: `Referral code ${code} applied successfully! You'll get 50% off your first order.`,
        });
      }, 1000);
    });
  }

  // Generate social sharing URLs
  generateSocialShareUrls(shareUrl: string, referralCode: string) {
    const message = `🧼 Join me on CleanCare Pro and get 50% OFF your first laundry service! Use my referral code: ${referralCode} or click my link: ${shareUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(shareUrl);
    const shortMessage = encodeURIComponent(
      `Get 50% OFF your first CleanCare Pro order with code ${referralCode}!`,
    );

    return {
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      twitter: `https://twitter.com/intent/tweet?text=${shortMessage}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${shortMessage}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${shortMessage}`,
      sms: `sms:?body=${encodedMessage}`,
      email: `mailto:?subject=${encodeURIComponent("Get 50% OFF with CleanCare Pro!")}&body=${encodedMessage}`,
    };
  }
}
