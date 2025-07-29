const express = require('express');
const router = express.Router();

// Google Maps Geocoding API proxy to avoid CORS issues
router.get('/geocode', async (req, res) => {
  try {
    const { latlng, result_type, language = 'en', region = 'IN' } = req.query;
    
    if (!latlng) {
      return res.status(400).json({ 
        error: 'Missing required parameter: latlng' 
      });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured' 
      });
    }

    // Build URL parameters
    const params = new URLSearchParams({
      latlng,
      language,
      region,
      key: googleApiKey
    });

    if (result_type) {
      params.append('result_type', result_type);
    }

    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;
    
    // Make request to Google Maps API
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Google Maps API error',
        details: data
      });
    }

    // Return the geocoding data
    res.json(data);

  } catch (error) {
    console.error('Geocoding proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Forward geocoding proxy (address to coordinates)
router.get('/geocode-address', async (req, res) => {
  try {
    const { address, language = 'en', region = 'IN' } = req.query;
    
    if (!address) {
      return res.status(400).json({ 
        error: 'Missing required parameter: address' 
      });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured' 
      });
    }

    // Build URL parameters
    const params = new URLSearchParams({
      address,
      language,
      region,
      key: googleApiKey
    });

    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;
    
    // Make request to Google Maps API
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Google Maps API error',
        details: data
      });
    }

    // Return the geocoding data
    res.json(data);

  } catch (error) {
    console.error('Address geocoding proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
