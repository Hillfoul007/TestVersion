#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Checks if all required REACT_APP_ environment variables are properly set
 */

const requiredVars = {
  // Essential for Google Maps functionality
  'REACT_APP_GOOGLE_MAPS_API_KEY': 'Google Maps API key (required for address search)',
  
  // API endpoints
  'REACT_APP_API_BASE_URL': 'API base URL (defaults to localhost:3001/api)',
  
  // Optional but recommended
  'REACT_APP_GOOGLE_MAPS_MAP_ID': 'Google Maps Map ID (optional, for advanced markers)',
  'REACT_APP_DVHOSTING_API_KEY': 'DVHosting SMS API key (for SMS services)',
  'REACT_APP_EXOTEL_API_KEY': 'Exotel API key (for call services)',
  'REACT_APP_GUPSHUP_API_KEY': 'Gupshup WhatsApp API key',
};

console.log('🔍 Environment Variable Verification');
console.log('====================================');

let hasErrors = false;
let hasWarnings = false;

Object.entries(requiredVars).forEach(([varName, description]) => {
  const value = process.env[varName];
  
  if (!value || value.trim() === '') {
    if (varName === 'REACT_APP_GOOGLE_MAPS_API_KEY') {
      console.log(`❌ ${varName}: Missing (${description})`);
      hasErrors = true;
    } else {
      console.log(`⚠️  ${varName}: Missing (${description})`);
      hasWarnings = true;
    }
  } else if (value.includes('your_') || value.includes('example')) {
    console.log(`⚠️  ${varName}: Placeholder value detected (${description})`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log('');

if (hasErrors) {
  console.log('❌ Critical issues found. The app may not work properly.');
  console.log('Please set the required environment variables.');
} else if (hasWarnings) {
  console.log('⚠️  Some optional variables are missing or have placeholder values.');
  console.log('The app will work but some features may be limited.');
} else {
  console.log('✅ All environment variables are properly configured!');
}

console.log('');
console.log('💡 To fix issues:');
console.log('1. Copy .env.example to .env');
console.log('2. Replace placeholder values with actual credentials');
console.log('3. Restart the development server');

if (hasErrors) {
  process.exit(1);
}
