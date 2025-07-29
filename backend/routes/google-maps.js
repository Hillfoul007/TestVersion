const express = require('express');
const router = express.Router();

// OpenCage Geocoding API proxy to avoid CORS issues
router.get('/geocode', async (req, res) => {
  try {
    const { latlng, result_type, language = 'en', region = 'IN' } = req.query;

    if (!latlng) {
      return res.status(400).json({
        error: 'Missing required parameter: latlng'
      });
    }

    const opencageApiKey = process.env.OPENCAGE_API_KEY || 'bb9e8b5e99a24e1c811e89a6c1099fd1';
    if (!opencageApiKey) {
      return res.status(500).json({
        error: 'OpenCage API key not configured'
      });
    }

    // Parse lat,lng
    const [lat, lng] = latlng.split(',');

    // Build URL parameters for OpenCage
    const params = new URLSearchParams({
      q: latlng,
      key: opencageApiKey,
      language: language,
      countrycode: region.toLowerCase(),
      limit: '5',
      no_annotations: '1',
      pretty: '1'
    });

    const apiUrl = `https://api.opencagedata.com/geocode/v1/json?${params}`;

    // Make request to OpenCage API
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'OpenCage API error',
        details: data
      });
    }

    // Convert OpenCage response to Google Maps format
    const convertedData = convertOpenCageToGoogleFormat(data, parseFloat(lat), parseFloat(lng));
    res.json(convertedData);

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

    const opencageApiKey = process.env.OPENCAGE_API_KEY || 'bb9e8b5e99a24e1c811e89a6c1099fd1';
    if (!opencageApiKey) {
      return res.status(500).json({
        error: 'OpenCage API key not configured'
      });
    }

    // Build URL parameters for OpenCage
    const params = new URLSearchParams({
      q: address,
      key: opencageApiKey,
      language: language,
      countrycode: region.toLowerCase(),
      limit: '5',
      no_annotations: '1',
      pretty: '1'
    });

    const apiUrl = `https://api.opencagedata.com/geocode/v1/json?${params}`;

    // Make request to OpenCage API
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'OpenCage API error',
        details: data
      });
    }

    // Convert OpenCage response to Google Maps format
    const convertedData = convertOpenCageToGoogleFormatAddress(data);
    res.json(convertedData);

  } catch (error) {
    console.error('Address geocoding proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Helper function to convert OpenCage reverse geocode to Google Maps format
function convertOpenCageToGoogleFormat(openCageData, lat, lng) {
  if (!openCageData.results || openCageData.results.length === 0) {
    return {
      status: 'ZERO_RESULTS',
      results: []
    };
  }

  const results = openCageData.results.map(result => {
    // Extract address components from OpenCage result
    const components = result.components || {};
    const addressComponents = [];

    // Street number
    if (components.house_number) {
      addressComponents.push({
        long_name: components.house_number,
        short_name: components.house_number,
        types: ['street_number']
      });
    }

    // Route/Street
    if (components.road) {
      addressComponents.push({
        long_name: components.road,
        short_name: components.road,
        types: ['route']
      });
    }

    // Neighborhood/Suburb
    if (components.neighbourhood || components.suburb) {
      addressComponents.push({
        long_name: components.neighbourhood || components.suburb,
        short_name: components.neighbourhood || components.suburb,
        types: ['sublocality_level_1', 'sublocality']
      });
    }

    // City/Town/Village
    if (components.city || components.town || components.village) {
      addressComponents.push({
        long_name: components.city || components.town || components.village,
        short_name: components.city || components.town || components.village,
        types: ['locality']
      });
    }

    // State
    if (components.state) {
      addressComponents.push({
        long_name: components.state,
        short_name: components.state_code || components.state,
        types: ['administrative_area_level_1']
      });
    }

    // Postal code
    if (components.postcode) {
      addressComponents.push({
        long_name: components.postcode,
        short_name: components.postcode,
        types: ['postal_code']
      });
    }

    // Country
    if (components.country) {
      addressComponents.push({
        long_name: components.country,
        short_name: components.country_code?.toUpperCase() || components.country,
        types: ['country']
      });
    }

    return {
      address_components: addressComponents,
      formatted_address: result.formatted,
      geometry: {
        location: {
          lat: result.geometry.lat,
          lng: result.geometry.lng
        },
        location_type: 'ROOFTOP',
        viewport: {
          northeast: {
            lat: result.bounds?.northeast?.lat || result.geometry.lat + 0.001,
            lng: result.bounds?.northeast?.lng || result.geometry.lng + 0.001
          },
          southwest: {
            lat: result.bounds?.southwest?.lat || result.geometry.lat - 0.001,
            lng: result.bounds?.southwest?.lng || result.geometry.lng - 0.001
          }
        }
      },
      place_id: result.annotations?.OSM?.edit_url || `opencage_${result.geometry.lat}_${result.geometry.lng}`,
      types: determineGoogleTypes(components)
    };
  });

  return {
    status: 'OK',
    results: results
  };
}

// Helper function to convert OpenCage forward geocode to Google Maps format
function convertOpenCageToGoogleFormatAddress(openCageData) {
  if (!openCageData.results || openCageData.results.length === 0) {
    return {
      status: 'ZERO_RESULTS',
      results: []
    };
  }

  const results = openCageData.results.map(result => {
    // Extract address components from OpenCage result
    const components = result.components || {};
    const addressComponents = [];

    // Street number
    if (components.house_number) {
      addressComponents.push({
        long_name: components.house_number,
        short_name: components.house_number,
        types: ['street_number']
      });
    }

    // Route/Street
    if (components.road) {
      addressComponents.push({
        long_name: components.road,
        short_name: components.road,
        types: ['route']
      });
    }

    // Neighborhood/Suburb
    if (components.neighbourhood || components.suburb) {
      addressComponents.push({
        long_name: components.neighbourhood || components.suburb,
        short_name: components.neighbourhood || components.suburb,
        types: ['sublocality_level_1', 'sublocality']
      });
    }

    // City/Town/Village
    if (components.city || components.town || components.village) {
      addressComponents.push({
        long_name: components.city || components.town || components.village,
        short_name: components.city || components.town || components.village,
        types: ['locality']
      });
    }

    // State
    if (components.state) {
      addressComponents.push({
        long_name: components.state,
        short_name: components.state_code || components.state,
        types: ['administrative_area_level_1']
      });
    }

    // Postal code
    if (components.postcode) {
      addressComponents.push({
        long_name: components.postcode,
        short_name: components.postcode,
        types: ['postal_code']
      });
    }

    // Country
    if (components.country) {
      addressComponents.push({
        long_name: components.country,
        short_name: components.country_code?.toUpperCase() || components.country,
        types: ['country']
      });
    }

    return {
      address_components: addressComponents,
      formatted_address: result.formatted,
      geometry: {
        location: {
          lat: result.geometry.lat,
          lng: result.geometry.lng
        },
        location_type: 'ROOFTOP',
        viewport: {
          northeast: {
            lat: result.bounds?.northeast?.lat || result.geometry.lat + 0.001,
            lng: result.bounds?.northeast?.lng || result.geometry.lng + 0.001
          },
          southwest: {
            lat: result.bounds?.southwest?.lat || result.geometry.lat - 0.001,
            lng: result.bounds?.southwest?.lng || result.geometry.lng - 0.001
          }
        }
      },
      place_id: result.annotations?.OSM?.edit_url || `opencage_${result.geometry.lat}_${result.geometry.lng}`,
      types: determineGoogleTypes(components)
    };
  });

  return {
    status: 'OK',
    results: results
  };
}

// Helper function to determine Google Maps types based on OpenCage components
function determineGoogleTypes(components) {
  const types = [];

  if (components.house_number && components.road) {
    types.push('street_address');
  }

  if (components.road) {
    types.push('route');
  }

  if (components.neighbourhood || components.suburb) {
    types.push('sublocality_level_1', 'sublocality');
  }

  if (components.city || components.town || components.village) {
    types.push('locality');
  }

  if (components.state) {
    types.push('administrative_area_level_1');
  }

  if (components.country) {
    types.push('country');
  }

  return types.length > 0 ? types : ['geocode'];
}

module.exports = router;
