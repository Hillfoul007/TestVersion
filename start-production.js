#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Laundrify Production Setup');
console.log('================================');

// Check if .env file exists
const envExists = fs.existsSync('.env');
if (!envExists) {
  console.log('❌ Missing .env file');
  console.log('');
  console.log('📋 Please create a .env file with the following variables:');
  console.log('');
  console.log('NODE_ENV=production');
  console.log('PORT=3001');
  console.log('MONGODB_USERNAME=your_actual_username');
  console.log('MONGODB_PASSWORD=your_actual_password');
  console.log('MONGODB_CLUSTER=your_actual_cluster.mongodb.net');
  console.log('MONGODB_DATABASE=homeservices');
  console.log('JWT_SECRET=your_jwt_secret');
  console.log('REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key');
  console.log('');
  console.log('💡 Copy .env.example to .env and update the values');
  process.exit(1);
}

// Check if build exists
const buildExists = fs.existsSync('dist');
if (!buildExists) {
  console.log('❌ Missing build files');
  console.log('');
  console.log('🔨 Please run: npm run build');
  console.log('');
  process.exit(1);
}

console.log('✅ Environment and build files ready');
console.log('🚀 Starting production server...');
console.log('');

// Start the server
require('./server.js');
