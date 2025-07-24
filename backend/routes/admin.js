const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const router = express.Router();

// Update itemsxquantity field for existing bookings
router.post("/update-itemsxquantity", async (req, res) => {
  try {
    console.log('🔍 Finding bookings without itemsxquantity field...');
    
    const bookingsToUpdate = await Booking.find({
      $or: [
        { itemsxquantity: { $exists: false } },
        { itemsxquantity: "" },
        { itemsxquantity: null }
      ]
    }).select('_id item_prices services');

    console.log(`📊 Found ${bookingsToUpdate.length} bookings to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const booking of bookingsToUpdate) {
      try {
        let itemsxquantity = '';

        // Generate itemsxquantity from item_prices
        if (booking.item_prices && booking.item_prices.length > 0) {
          itemsxquantity = booking.item_prices.map(item => 
            `${item.service_name} x ${item.quantity}`
          ).join(', ');
        } 
        // Fallback: generate from services array
        else if (booking.services && booking.services.length > 0) {
          itemsxquantity = booking.services.map(service => {
            if (typeof service === 'object') {
              return `${service.name || service.service || service} x ${service.quantity || 1}`;
            }
            return `${service} x 1`;
          }).join(', ');
        }
        // Final fallback
        else {
          itemsxquantity = 'Services x 1';
        }

        // Update the booking
        await Booking.findByIdAndUpdate(
          booking._id,
          { itemsxquantity },
          { runValidators: false } // Skip validation to avoid triggering pre-save hooks
        );

        updatedCount++;
        console.log(`✅ Updated booking ${booking._id}: "${itemsxquantity}"`);
      } catch (updateError) {
        console.error(`❌ Failed to update booking ${booking._id}:`, updateError.message);
        skippedCount++;
      }
    }

    res.json({
      success: true,
      message: 'itemsxquantity field update completed',
      totalFound: bookingsToUpdate.length,
      updated: updatedCount,
      skipped: skippedCount
    });

  } catch (error) {
    console.error('❌ Error updating itemsxquantity field:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fix discount tracking for existing bookings
router.post("/fix-discount-tracking", async (req, res) => {
  try {
    console.log('🔍 Finding bookings with discount tracking issues...');
    
    const bookingsWithDiscountIssues = await Booking.find({
      $and: [
        { discount_amount: 0 },
        { 'charges_breakdown.discount': { $gt: 0 } }
      ]
    }).select('_id discount_amount charges_breakdown');

    console.log(`📊 Found ${bookingsWithDiscountIssues.length} bookings with discount tracking issues`);

    let fixedCount = 0;

    for (const booking of bookingsWithDiscountIssues) {
      try {
        const correctDiscount = booking.charges_breakdown.discount;
        
        await Booking.findByIdAndUpdate(
          booking._id,
          { discount_amount: correctDiscount },
          { runValidators: false }
        );

        fixedCount++;
        console.log(`✅ Fixed discount for booking ${booking._id}: ${correctDiscount}`);
      } catch (updateError) {
        console.error(`❌ Failed to fix discount for booking ${booking._id}:`, updateError.message);
      }
    }

    res.json({
      success: true,
      message: 'Discount tracking fix completed',
      totalFound: bookingsWithDiscountIssues.length,
      fixed: fixedCount
    });

  } catch (error) {
    console.error('❌ Error fixing discount tracking:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Run both updates together
router.post("/update-all", async (req, res) => {
  try {
    // Update itemsxquantity first
    const itemsResult = await router.stack[0].route.stack[0].handle(req, { json: () => {} });
    
    // Then fix discount tracking
    const discountResult = await router.stack[1].route.stack[0].handle(req, { json: () => {} });
    
    res.json({
      success: true,
      message: 'All booking updates completed successfully',
      itemsxquantity: itemsResult,
      discountTracking: discountResult
    });
    
  } catch (error) {
    console.error('❌ Error running all updates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get statistics about bookings
router.get("/booking-stats", async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const bookingsWithItemsQuantity = await Booking.countDocuments({
      itemsxquantity: { $exists: true, $ne: "", $ne: null }
    });
    const bookingsWithDiscounts = await Booking.countDocuments({
      discount_amount: { $gt: 0 }
    });
    const bookingsWithChargesDiscount = await Booking.countDocuments({
      'charges_breakdown.discount': { $gt: 0 }
    });
    const discountMismatch = await Booking.countDocuments({
      $and: [
        { discount_amount: 0 },
        { 'charges_breakdown.discount': { $gt: 0 } }
      ]
    });

    res.json({
      success: true,
      stats: {
        total_bookings: totalBookings,
        with_itemsxquantity: bookingsWithItemsQuantity,
        missing_itemsxquantity: totalBookings - bookingsWithItemsQuantity,
        with_discount_amount: bookingsWithDiscounts,
        with_charges_discount: bookingsWithChargesDiscount,
        discount_tracking_issues: discountMismatch
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting booking stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
