/**
 * Geolocation Service
 * Handles GPS location and reverse geocoding
 */

// Default coordinates (San Francisco)
const DEFAULT_LOCATION = {
  lat: parseFloat(import.meta.env.VITE_DEFAULT_LAT) || 37.7749,
  lng: parseFloat(import.meta.env.VITE_DEFAULT_LNG) || -122.4194,
};

// Cache for location to avoid repeated requests
let cachedLocation = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

// Get current user location with fast fallback strategy
export const getCurrentLocation = (options = {}) => {
  const { forceRefresh = false, highAccuracy = false } = options;
  
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // Return cached location if valid and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && cachedLocation && (now - cacheTimestamp) < CACHE_DURATION) {
      resolve(cachedLocation);
      return;
    }

    // Fast location strategy: try low accuracy first for speed
    const getLocationWithAccuracy = (enableHighAccuracy, timeout) => {
      return new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            };
            res(loc);
          },
          rej,
          {
            enableHighAccuracy,
            timeout,
            maximumAge: enableHighAccuracy ? 0 : 60000,
          }
        );
      });
    };

    // Strategy: Fast low-accuracy first (2s), then optionally high-accuracy
    const fastTimeout = highAccuracy ? 5000 : 3000;
    
    getLocationWithAccuracy(highAccuracy, fastTimeout)
      .then((location) => {
        cachedLocation = location;
        cacheTimestamp = Date.now();
        resolve(location);
        
        // If we got low accuracy, try to get better accuracy in background
        if (!highAccuracy && location.accuracy > 100) {
          getLocationWithAccuracy(true, 8000)
            .then((betterLocation) => {
              cachedLocation = betterLocation;
              cacheTimestamp = Date.now();
            })
            .catch(() => {}); // Silently fail background update
        }
      })
      .catch((error) => {
        let message;
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            message = 'Location permission denied. Please enable location access.';
            break;
          case 2: // POSITION_UNAVAILABLE
            message = 'Location information unavailable.';
            break;
          case 3: // TIMEOUT
            message = 'Location request timed out.';
            break;
          default:
            message = 'An unknown error occurred while getting location.';
        }
        reject(new Error(message));
      });
  });
};

// Request location permission explicitly (useful for PWA)
export const requestLocationPermission = async () => {
  try {
    // Check if permission API is available
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'granted') {
        return { granted: true, state: 'granted' };
      } else if (permission.state === 'prompt') {
        // Trigger the permission prompt by requesting location
        try {
          await getCurrentLocation({ forceRefresh: true });
          return { granted: true, state: 'granted' };
        } catch (err) {
          return { granted: false, state: 'denied', error: err.message };
        }
      } else {
        return { granted: false, state: 'denied' };
      }
    } else {
      // Fallback: just try to get location
      try {
        await getCurrentLocation({ forceRefresh: true });
        return { granted: true, state: 'granted' };
      } catch (err) {
        return { granted: false, state: 'denied', error: err.message };
      }
    }
  } catch (err) {
    return { granted: false, state: 'error', error: err.message };
  }
};

// Watch user location with optimized settings
export const watchLocation = (onSuccess, onError, options = {}) => {
  const { highAccuracy = false } = options;
  
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const loc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      // Update cache
      cachedLocation = loc;
      cacheTimestamp = Date.now();
      onSuccess(loc);
    },
    onError,
    {
      enableHighAccuracy: highAccuracy,
      timeout: highAccuracy ? 8000 : 5000,
      maximumAge: highAccuracy ? 0 : 10000,
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
          'User-Agent': 'Patrol/1.0',
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
          'User-Agent': 'Patrol/1.0',
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
