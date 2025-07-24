const mongoose = require('mongoose');
const Booking = require('../models/Booking');

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/home_services';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Update bookings with itemsxquantity field
const updateBookingItemsQuantity = async () => {
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

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} bookings`);
    console.log(`❌ Skipped due to errors: ${skippedCount} bookings`);
    console.log(`📋 Total processed: ${bookingsToUpdate.length} bookings`);

  } catch (error) {
    console.error('❌ Error updating bookings:', error);
    throw error;
  }
};

// Fix discount tracking for existing bookings
const fixDiscountTracking = async () => {
  try {
    console.log('\n🔍 Finding bookings with discount issues...');
    
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

    console.log('\n📊 Discount Fix Summary:');
    console.log(`✅ Successfully fixed: ${fixedCount} bookings`);
    console.log(`📋 Total processed: ${bookingsWithDiscountIssues.length} bookings`);

  } catch (error) {
    console.error('❌ Error fixing discount tracking:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectToDatabase();
    
    console.log('🚀 Starting booking update process...\n');
    
    // Update itemsxquantity field
    await updateBookingItemsQuantity();
    
    // Fix discount tracking
    await fixDiscountTracking();
    
    console.log('\n✅ All updates completed successfully!');
    
  } catch (error) {
    console.error('❌ Update process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateBookingItemsQuantity, fixDiscountTracking };
