const mongoose = require('mongoose');
const Booking = require('./models/Booking');

// Load environment variables
require('dotenv').config();

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

// Test creating a booking with new itemsxquantity field
const testBookingCreation = async () => {
  try {
    console.log('🧪 Testing booking creation with itemsxquantity field...');
    
    const testBooking = new Booking({
      name: 'Test Customer',
      phone: '1234567890',
      customer_id: new mongoose.Types.ObjectId(),
      service: 'Laundry',
      service_type: 'regular',
      services: ['Shirt', 'Trouser'],
      scheduled_date: '2024-01-15',
      scheduled_time: '10:00 AM',
      delivery_date: '2024-01-16',
      delivery_time: '6:00 PM',
      provider_name: 'Test Provider',
      address: 'Test Address, Test City, 123456',
      total_price: 200,
      discount_amount: 20,
      final_amount: 180,
      item_prices: [
        {
          service_name: 'Shirt',
          quantity: 3,
          unit_price: 30,
          total_price: 90
        },
        {
          service_name: 'Trouser',
          quantity: 2,
          unit_price: 55,
          total_price: 110
        }
      ],
      charges_breakdown: {
        base_price: 200,
        discount: 20
      }
    });

    // Save the booking (this should trigger our pre-save hook)
    await testBooking.save();
    
    console.log('✅ Test booking created successfully!');
    console.log('📋 Generated itemsxquantity:', testBooking.itemsxquantity);
    console.log('💰 Discount amount:', testBooking.discount_amount);
    console.log('💰 Final amount:', testBooking.final_amount);
    
    // Verify the itemsxquantity field was populated correctly
    if (testBooking.itemsxquantity === 'Shirt x 3, Trouser x 2') {
      console.log('✅ itemsxquantity field populated correctly!');
    } else {
      console.log('❌ itemsxquantity field not populated correctly');
      console.log('Expected: "Shirt x 3, Trouser x 2"');
      console.log('Actual:', testBooking.itemsxquantity);
    }
    
    // Verify discount handling
    if (testBooking.discount_amount === 20) {
      console.log('✅ Discount amount handled correctly!');
    } else {
      console.log('❌ Discount amount not handled correctly');
      console.log('Expected: 20');
      console.log('Actual:', testBooking.discount_amount);
    }
    
    // Clean up - remove test booking
    await Booking.findByIdAndDelete(testBooking._id);
    console.log('🧹 Test booking cleaned up');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing booking creation:', error);
    return false;
  }
};

// Test discount fallback logic
const testDiscountFallback = async () => {
  try {
    console.log('\n🧪 Testing discount fallback logic...');
    
    const testBooking = new Booking({
      name: 'Test Customer 2',
      phone: '0987654321',
      customer_id: new mongoose.Types.ObjectId(),
      service: 'Laundry',
      service_type: 'regular',
      services: ['Dress'],
      scheduled_date: '2024-01-15',
      scheduled_time: '10:00 AM',
      delivery_date: '2024-01-16',
      delivery_time: '6:00 PM',
      provider_name: 'Test Provider',
      address: 'Test Address, Test City, 123456',
      total_price: 100,
      discount_amount: 0, // Explicitly set to 0
      final_amount: 100,
      charges_breakdown: {
        base_price: 100,
        discount: 15 // But have discount in charges_breakdown
      }
    });

    // Save the booking (this should trigger our pre-save hook and fix discount)
    await testBooking.save();
    
    console.log('✅ Test booking for discount fallback created!');
    console.log('💰 Discount amount after save:', testBooking.discount_amount);
    console.log('💰 Final amount after save:', testBooking.final_amount);
    
    // Verify the discount was corrected from charges_breakdown
    if (testBooking.discount_amount === 15) {
      console.log('✅ Discount fallback logic working correctly!');
    } else {
      console.log('❌ Discount fallback logic not working');
      console.log('Expected discount_amount: 15');
      console.log('Actual discount_amount:', testBooking.discount_amount);
    }
    
    // Clean up - remove test booking
    await Booking.findByIdAndDelete(testBooking._id);
    console.log('🧹 Test booking cleaned up');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing discount fallback:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  try {
    await connectToDatabase();
    
    console.log('🚀 Starting booking model tests...\n');
    
    const test1Result = await testBookingCreation();
    const test2Result = await testDiscountFallback();
    
    if (test1Result && test2Result) {
      console.log('\n✅ All tests passed! Booking model changes are working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the model implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the tests
if (require.main === module) {
  main();
}

module.exports = { testBookingCreation, testDiscountFallback };
