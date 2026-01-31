import { useState, useEffect, useRef } from 'react';
import { getCurrentLocation, watchLocation, clearLocationWatch } from '../../services/geolocation';

const LocationPermissionPrompt = ({ onLocationGranted }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown');
  const watchIdRef = useRef(null);
  const hasGrantedRef = useRef(false);
  const hasCalledOnLocationGrantedRef = useRef(false);

  // Start watching location for continuous updates
  const startLocationWatch = () => {
    if (watchIdRef.current) return; // Already watching
    
    const isMobile = window.innerWidth < 768 || 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    watchIdRef.current = watchLocation(
      (location) => {
        // Dispatch event for continuous location updates (marker updates)
        window.dispatchEvent(new CustomEvent('userLocationUpdated', { detail: location }));
      },
      (error) => {
        console.log('Watch location error:', error);
      },
      { 
        highAccuracy: true,
        // Use longer timeout on mobile for better GPS acquisition
        timeout: isMobile ? 15000 : 10000,
        // Allow cached positions on mobile to reduce battery drain
        maximumAge: isMobile ? 30000 : 10000
      }
    );
  };

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        clearLocationWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768 || 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    // Check current permission state
    const checkPermission = async () => {
      try {
        // Check if we already have permission
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionState(permission.state);
          
          // Listen for permission changes
          permission.onchange = () => {
            setPermissionState(permission.state);
            if (permission.state === 'granted') {
              hasGrantedRef.current = true;
              setShowPrompt(false);
              startLocationWatch();
            } else if (permission.state === 'denied') {
              // On denied, show prompt again on mobile so user knows to enable in settings
              if (isMobile) {
                setShowPrompt(true);
              }
            }
          };
          
          if (permission.state === 'granted') {
            hasGrantedRef.current = true;
            // Already have permission, start watching location
            try {
              const location = await getCurrentLocation({ forceRefresh: true });
              if (onLocationGranted && !hasCalledOnLocationGrantedRef.current) {
                hasCalledOnLocationGrantedRef.current = true;
                onLocationGranted(location);
              }
              // Start continuous watch
              startLocationWatch();
            } catch (err) {
              console.log('Error getting location:', err);
            }
            return;
          } else if (permission.state === 'prompt') {
            // Try to get location directly (same behavior for mobile and desktop)
            try {
              const location = await getCurrentLocation({ forceRefresh: true });
              if (onLocationGranted && !hasCalledOnLocationGrantedRef.current) {
                hasCalledOnLocationGrantedRef.current = true;
                onLocationGranted(location);
              }
              startLocationWatch();
              return;
            } catch (err) {
              console.log('Location request failed:', err);
              // Just log error - no custom prompt (consistent with desktop)
            }
          } else if (permission.state === 'denied') {
            // Permission denied - just log, no custom prompt (consistent with desktop)
            console.log('Location permission denied');
          }
        } else {
          // Permissions API not available, try to get location directly
          try {
            const location = await getCurrentLocation({ forceRefresh: true });
            if (onLocationGranted && !hasCalledOnLocationGrantedRef.current) {
              hasCalledOnLocationGrantedRef.current = true;
              onLocationGranted(location);
            }
            startLocationWatch();
            return;
          } catch (err) {
            console.log('Location fallback failed:', err);
            // Just log error - no custom prompt
          }
        }
      } catch (err) {
        console.log('Permission check error:', err);
        // Just log error - no custom prompt (consistent behavior)
      }
    };

    checkPermission();
  }, [onLocationGranted]);

  const handleEnableLocation = async () => {
    setIsRequesting(true);
    
    try {
      // This will trigger the browser's permission prompt
      const location = await getCurrentLocation({ forceRefresh: true });
      setPermissionState('granted');
      hasGrantedRef.current = true;
      setShowPrompt(false);
      if (onLocationGranted && !hasCalledOnLocationGrantedRef.current) {
        hasCalledOnLocationGrantedRef.current = true;
        onLocationGranted(location);
      }
      // Start continuous location watching
      startLocationWatch();
    } catch (err) {
      console.log('Location request error:', err);
      setPermissionState('denied');
      // Keep prompt visible but show error state - user needs to enable in settings
    } finally {
      setIsRequesting(false);
    }
  };

  const isMobile = window.innerWidth < 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // On mobile, don't render anything - location logic is handled elsewhere
  if (isMobile) return null;

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
        {/* Header with icon */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Enable Location</h2>
          <p className="text-blue-100 text-sm mt-1">To show issues near you</p>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-gray-600 text-sm text-center mb-5">
            Patrol needs your location to show nearby civic issues and help you report problems in your area.
          </p>

          {/* Benefits */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">See issues near your location</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">Report issues with accurate location</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">Navigate to issue locations</span>
            </div>
          </div>

          {permissionState === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm text-center">
                Location access was denied. Please enable it in your browser settings.
              </p>
            </div>
          )}

          {/* Button */}
          <div className="space-y-2">
            <button
              onClick={handleEnableLocation}
              disabled={isRequesting}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Getting Location...
                </>
              ) : permissionState === 'denied' ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Open Settings to Enable
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Enable Location
                </>
              )}
            </button>
            {permissionState === 'denied' && (
              <p className="text-xs text-gray-500 text-center">
                Go to your browser/app settings and enable location for this site
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionPrompt;
