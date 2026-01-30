/**
 * Geolocation Service
 * Handles GPS location and reverse geocoding
 */

// Default coordinates (San Francisco)
const DEFAULT_LOCATION = {
  lat: parseFloat(import.meta.env.VITE_DEFAULT_LAT) || 37.7749,
  lng: parseFloat(import.meta.env.VITE_DEFAULT_LNG) || -122.4194,
};

// Get current user location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let message;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
          default:
            message = 'An unknown error occurred while getting location.';
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
};

// Watch user location
export const watchLocation = (onSuccess, onError) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    onError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }
  );

  return watchId;
};

// Stop watching location
export const clearLocationWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Reverse geocoding using OpenStreetMap Nominatim
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RoadPatrol/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Format address
    const address = data.address;
    const parts = [];

    if (address.house_number) parts.push(address.house_number);
    if (address.road) parts.push(address.road);
    if (address.suburb) parts.push(address.suburb);
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }
    if (address.state) parts.push(address.state);

    return {
      displayName: data.display_name,
      formattedAddress: parts.join(', ') || data.display_name,
      address: {
        road: address.road,
        suburb: address.suburb,
        city: address.city || address.town || address.village,
        state: address.state,
        postcode: address.postcode,
        country: address.country,
      },
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      address: null,
    };
  }
};

// Search for addresses (forward geocoding)
export const searchAddress = async (query, limit = 5) => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RoadPatrol/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Search request failed');
    }

    const data = await response.json();
    
    return data.map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      address: item.address,
    }));
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
};

// Calculate distance between two points (in meters)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Get default location
export const getDefaultLocation = () => DEFAULT_LOCATION;

// Check if coordinates are valid
export const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};
