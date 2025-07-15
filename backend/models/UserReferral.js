// Extension to User model for referral tracking
const mongoose = require("mongoose");

// Add referral fields to existing User schema
const referralUserFields = {
  referral_stats: {
    total_referrals: {
      type: Number,
      default: 0,
    },
    successful_referrals: {
      type: Number,
      default: 0,
    },
    total_rewards_earned: {
      type: Number,
      default: 0,
    },
    pending_rewards: {
      type: Number,
      default: 0,
    },
  },
  referral_code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  referral_applied: {
    type: Boolean,
    default: false,
  },
  available_discounts: [
    {
      type: {
        type: String,
        enum: ["referral_reward", "referee_discount"],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        required: true,
      },
      expires_at: {
        type: Date,
        required: true,
      },
      booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        default: null,
      },
      used: {
        type: Boolean,
        default: false,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
};

module.exports = referralUserFields;
