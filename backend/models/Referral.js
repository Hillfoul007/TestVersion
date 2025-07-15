const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Referrer ID is required"],
    },
    referee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referral_code: {
      type: String,
      required: [true, "Referral code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "registered", "first_payment_completed", "rewarded"],
      default: "pending",
    },
    referee_discount_applied: {
      type: Boolean,
      default: false,
    },
    referrer_discount_applied: {
      type: Boolean,
      default: false,
    },
    referee_first_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    discount_percentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    referrer_reward_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    registration_date: {
      type: Date,
      default: null,
    },
    first_payment_date: {
      type: Date,
      default: null,
    },
    reward_date: {
      type: Date,
      default: null,
    },
    expires_at: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from creation
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
referralSchema.index({ referral_code: 1 });
referralSchema.index({ referrer_id: 1 });
referralSchema.index({ referee_id: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ expires_at: 1 });

// Methods
referralSchema.methods.markAsRegistered = function (refereeId) {
  this.referee_id = refereeId;
  this.status = "registered";
  this.registration_date = new Date();
  return this.save();
};

referralSchema.methods.markFirstPaymentCompleted = function (bookingId) {
  this.status = "first_payment_completed";
  this.referee_first_booking_id = bookingId;
  this.first_payment_date = new Date();
  this.referee_discount_applied = true;
  return this.save();
};

referralSchema.methods.markRewarded = function (rewardBookingId) {
  this.status = "rewarded";
  this.referrer_reward_booking_id = rewardBookingId;
  this.referrer_discount_applied = true;
  this.reward_date = new Date();
  return this.save();
};

referralSchema.methods.isExpired = function () {
  return new Date() > this.expires_at;
};

referralSchema.methods.canApplyRefereeDiscount = function () {
  return (
    this.status === "registered" &&
    !this.referee_discount_applied &&
    !this.isExpired()
  );
};

referralSchema.methods.canApplyReferrerReward = function () {
  return (
    this.status === "first_payment_completed" &&
    !this.referrer_discount_applied &&
    !this.isExpired()
  );
};

// Static methods
referralSchema.statics.generateReferralCode = function (userId) {
  // Generate a unique referral code based on user ID and timestamp
  const timestamp = Date.now().toString(36);
  const userPart = userId.toString().slice(-4);
  const randomPart = Math.random().toString(36).substr(2, 4);
  return `REF${userPart}${timestamp}${randomPart}`.toUpperCase();
};

referralSchema.statics.findByCode = function (code) {
  return this.findOne({ referral_code: code.toUpperCase() }).populate(
    "referrer_id referee_id",
  );
};

referralSchema.statics.getUserReferrals = function (userId) {
  return this.find({ referrer_id: userId })
    .populate("referee_id")
    .sort({ createdAt: -1 });
};

referralSchema.statics.getUserReferralAsReferee = function (userId) {
  return this.findOne({ referee_id: userId }).populate("referrer_id");
};

// Clean up expired referrals
referralSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expires_at: { $lt: new Date() },
    status: "pending",
  });
};

module.exports = mongoose.model("Referral", referralSchema);
