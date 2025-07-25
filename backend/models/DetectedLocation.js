const mongoose = require("mongoose");

const detectedLocationSchema = new mongoose.Schema(
  {
    full_address: {
      type: String,
      required: [true, "Full address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    pincode: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: false,
      },
      lng: {
        type: Number,
        required: false,
      },
    },
    ip_address: {
      type: String,
      trim: true,
    },
    user_agent: {
      type: String,
      trim: true,
    },
    device_fingerprint: {
      type: String,
      trim: true,
    },
    detection_method: {
      type: String,
      enum: ["gps", "ip", "manual", "autocomplete"],
      default: "gps",
    },
    is_available: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Update the updated_at field before saving
detectedLocationSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Create indexes for efficient querying
detectedLocationSchema.index({ city: 1, pincode: 1 });
detectedLocationSchema.index({ coordinates: "2dsphere" });
detectedLocationSchema.index({ created_at: -1 });
detectedLocationSchema.index({ is_available: 1 });
detectedLocationSchema.index({ ip_address: 1 });

// Static method to check if location is available
detectedLocationSchema.statics.checkAvailability = function (city, pincode) {
  // For now, only Sector 69, Gurgaon is available
  const availableLocations = [
    { city: "Gurgaon", area: "Sector 69" },
    { city: "Gurugram", area: "Sector 69" },
  ];

  const normalizedCity = city?.toLowerCase().trim();
  return availableLocations.some(
    (location) =>
      normalizedCity?.includes(location.city.toLowerCase()) &&
      (city?.toLowerCase().includes("sector 69") ||
        city?.toLowerCase().includes("sector-69")),
  );
};

// Static method to save detected location
detectedLocationSchema.statics.saveDetectedLocation = async function (
  locationData,
) {
  try {
    // Create device fingerprint to avoid duplicates
    const fingerprint = `${locationData.ip_address || "unknown"}_${
      locationData.city || "unknown"
    }_${locationData.pincode || "unknown"}`;

    // Check if this location was already detected recently (within 24 hours)
    const recentDetection = await this.findOne({
      device_fingerprint: fingerprint,
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recentDetection) {
      return recentDetection; // Don't create duplicate
    }

    // Check if location is available
    const isAvailable = this.checkAvailability(
      locationData.city,
      locationData.pincode,
    );

    const detectedLocation = new this({
      ...locationData,
      device_fingerprint: fingerprint,
      is_available: isAvailable,
    });

    await detectedLocation.save();
    return detectedLocation;
  } catch (error) {
    console.error("Error saving detected location:", error);
    throw error;
  }
};

module.exports = mongoose.model("DetectedLocation", detectedLocationSchema);
