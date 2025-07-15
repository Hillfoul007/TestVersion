const express = require("express");
const router = express.Router();
const Referral = require("../models/Referral");
const User = require("../models/User");
const Booking = require("../models/Booking");

// Generate referral code for user
router.post("/generate", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user already has an active referral code
    const existingReferral = await Referral.findOne({
      referrer_id: userId,
      status: { $in: ["pending", "registered", "first_payment_completed"] },
    });

    if (existingReferral) {
      return res.json({
        success: true,
        referral: existingReferral,
        message: "Existing referral code retrieved",
      });
    }

    // Generate new referral code
    const referralCode = Referral.generateReferralCode(userId);

    // Create new referral
    const referral = new Referral({
      referrer_id: userId,
      referral_code: referralCode,
    });

    await referral.save();

    // Update user's referral stats
    await User.findByIdAndUpdate(userId, {
      $inc: { "referral_stats.total_referrals": 1 },
      referral_code: referralCode,
    });

    res.json({
      success: true,
      referral,
      message: "Referral code generated successfully",
    });
  } catch (error) {
    console.error("Generate referral error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate referral code",
      error: error.message,
    });
  }
});

// Validate referral code
router.get("/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const referral = await Referral.findByCode(code);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    if (referral.isExpired()) {
      return res.status(400).json({
        success: false,
        message: "Referral code has expired",
      });
    }

    if (referral.status === "rewarded") {
      return res.status(400).json({
        success: false,
        message: "Referral code has already been fully utilized",
      });
    }

    res.json({
      success: true,
      referral: {
        code: referral.referral_code,
        referrer_name:
          referral.referrer_id.name || referral.referrer_id.full_name,
        discount_percentage: referral.discount_percentage,
        expires_at: referral.expires_at,
        status: referral.status,
      },
      message: "Valid referral code",
    });
  } catch (error) {
    console.error("Validate referral error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate referral code",
      error: error.message,
    });
  }
});

// Apply referral code during registration
router.post("/apply", async (req, res) => {
  try {
    const { referralCode, userId } = req.body;

    if (!referralCode || !userId) {
      return res.status(400).json({
        success: false,
        message: "Referral code and user ID are required",
      });
    }

    const referral = await Referral.findByCode(referralCode);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    if (referral.isExpired()) {
      return res.status(400).json({
        success: false,
        message: "Referral code has expired",
      });
    }

    if (referral.referrer_id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot use your own referral code",
      });
    }

    if (referral.referee_id) {
      return res.status(400).json({
        success: false,
        message: "This referral code has already been used",
      });
    }

    // Mark referral as registered
    await referral.markAsRegistered(userId);

    // Update user to indicate they were referred
    await User.findByIdAndUpdate(userId, {
      referred_by: referral.referrer_id,
      available_discounts: [
        {
          type: "referee_discount",
          amount: 0, // Will be calculated at booking time
          percentage: referral.discount_percentage,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      ],
    });

    res.json({
      success: true,
      message:
        "Referral code applied successfully! You'll get 50% off on your first order.",
      discount_percentage: referral.discount_percentage,
    });
  } catch (error) {
    console.error("Apply referral error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply referral code",
      error: error.message,
    });
  }
});

// Get user's referral statistics
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's referrals
    const referrals = await Referral.getUserReferrals(userId);

    // Get current active referral code
    const activeReferral = await Referral.findOne({
      referrer_id: userId,
      status: { $in: ["pending", "registered", "first_payment_completed"] },
    });

    // Calculate statistics
    const stats = {
      total_referrals: referrals.length,
      successful_referrals: referrals.filter((r) => r.status === "rewarded")
        .length,
      pending_referrals: referrals.filter(
        (r) => r.status === "first_payment_completed",
      ).length,
      active_referral_code: activeReferral?.referral_code || null,
      available_discounts: user.available_discounts || [],
      referral_history: referrals.map((r) => ({
        code: r.referral_code,
        referee_name:
          r.referee_id?.name || r.referee_id?.full_name || "Pending",
        status: r.status,
        registration_date: r.registration_date,
        first_payment_date: r.first_payment_date,
        reward_date: r.reward_date,
        discount_percentage: r.discount_percentage,
      })),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get referral stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get referral statistics",
      error: error.message,
    });
  }
});

// Apply referral discount to booking
router.post("/apply-discount", async (req, res) => {
  try {
    const { bookingId, userId } = req.body;

    if (!bookingId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and user ID are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has available referral discounts
    const availableDiscount = user.available_discounts?.find(
      (d) =>
        d.type === "referee_discount" && !d.used && new Date() < d.expires_at,
    );

    if (!availableDiscount) {
      return res.status(400).json({
        success: false,
        message: "No available referral discount found",
      });
    }

    // Find the referral record
    const referral = await Referral.findOne({
      referee_id: userId,
      status: "registered",
    });

    if (!referral || !referral.canApplyRefereeDiscount()) {
      return res.status(400).json({
        success: false,
        message: "Referral discount not eligible",
      });
    }

    // Mark the referral as first payment completed
    await referral.markFirstPaymentCompleted(bookingId);

    // Mark the discount as used
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "available_discounts.$[elem].used": true,
          "available_discounts.$[elem].booking_id": bookingId,
        },
      },
      {
        arrayFilters: [{ "elem.type": "referee_discount", "elem.used": false }],
      },
    );

    // Add reward discount for referrer
    await User.findByIdAndUpdate(referral.referrer_id, {
      $push: {
        available_discounts: {
          type: "referral_reward",
          amount: 0, // Will be calculated at booking time
          percentage: referral.discount_percentage,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
      $inc: { "referral_stats.pending_rewards": 1 },
    });

    res.json({
      success: true,
      message: "Referral discount applied successfully",
      discount_percentage: availableDiscount.percentage,
    });
  } catch (error) {
    console.error("Apply referral discount error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply referral discount",
      error: error.message,
    });
  }
});

// Get share link for referral
router.get("/share-link/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get or create referral code
    let referral = await Referral.findOne({
      referrer_id: userId,
      status: { $in: ["pending", "registered", "first_payment_completed"] },
    });

    if (!referral) {
      const referralCode = Referral.generateReferralCode(userId);
      referral = new Referral({
        referrer_id: userId,
        referral_code: referralCode,
      });
      await referral.save();

      await User.findByIdAndUpdate(userId, {
        $inc: { "referral_stats.total_referrals": 1 },
        referral_code: referralCode,
      });
    }

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:10000";
    const shareUrl = `${baseUrl}?ref=${referral.referral_code}`;

    res.json({
      success: true,
      share_url: shareUrl,
      referral_code: referral.referral_code,
      discount_percentage: referral.discount_percentage,
    });
  } catch (error) {
    console.error("Get share link error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get share link",
      error: error.message,
    });
  }
});

module.exports = router;
