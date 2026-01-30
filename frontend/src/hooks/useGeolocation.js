import { useState, useEffect, useCallback } from 'react';
import { getCurrentLocation, watchLocation, clearLocationWatch } from '../services/geolocation';

/**
 * Hook to manage user's geolocation
 */
export const useGeolocation = (options = {}) => {
  const { watch = false, enableHighAccuracy = true } = options;
  
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const position = await getCurrentLocation();
      setLocation(position);
      return position;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (watch) {
      const watchId = watchLocation(
        (position) => {
          setLocation(position);
          setError(null);
        },
        (err) => {
          setError(err.message);
        }
      );

      return () => clearLocationWatch(watchId);
    }
  }, [watch]);

  return {
    location,
    error,
    isLoading,
    getLocation,
  };
};
