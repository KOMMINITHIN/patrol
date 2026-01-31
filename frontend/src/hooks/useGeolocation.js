import { useState, useEffect, useCallback } from 'react';
import { getCurrentLocation, watchLocation, clearLocationWatch, requestLocationPermission } from '../services/geolocation';

/**
 * Hook to manage user's geolocation with optimized performance
 */
export const useGeolocation = (options = {}) => {
  const { watch = false, highAccuracy = false, autoRequest = false } = options;
  
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown');

  // Request location with optimized settings
  const getLocation = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const position = await getCurrentLocation({ forceRefresh, highAccuracy });
      setLocation(position);
      return position;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [highAccuracy]);

  // Request permission explicitly
  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await requestLocationPermission();
      setPermissionState(result.state);
      if (result.granted) {
        // Permission granted, get location
        await getLocation();
      } else if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { granted: false, state: 'error', error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [getLocation]);

  // Auto-request location on mount if specified
  useEffect(() => {
    if (autoRequest) {
      getLocation();
    }
  }, [autoRequest, getLocation]);

  // Watch location if specified
  useEffect(() => {
    if (watch) {
      const watchId = watchLocation(
        (position) => {
          setLocation(position);
          setError(null);
        },
        (err) => {
          setError(err.message);
        },
        { highAccuracy }
      );

      return () => clearLocationWatch(watchId);
    }
  }, [watch, highAccuracy]);

  return {
    location,
    error,
    isLoading,
    permissionState,
    getLocation,
    requestPermission,
  };
};
