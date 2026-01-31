import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../../services/geolocation';

const LocationPermissionPrompt = ({ onLocationGranted }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown');

  useEffect(() => {
    // Check current permission state
    const checkPermission = async () => {
      try {
        // Check if we already have permission
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionState(permission.state);
          
          if (permission.state === 'granted') {
            // Already have permission, get location
            try {
              const location = await getCurrentLocation();
              if (onLocationGranted) onLocationGranted(location);
            } catch (err) {
              console.log('Error getting location:', err);
            }
            return;
          } else if (permission.state === 'prompt') {
            // Need to ask for permission - show prompt on mobile
            const isMobile = window.innerWidth < 768 || 
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
              // Delay slightly to let the app render first
              setTimeout(() => setShowPrompt(true), 500);
            } else {
              // On desktop, try to get location directly (browser will show its own prompt)
              try {
                const location = await getCurrentLocation();
                if (onLocationGranted) onLocationGranted(location);
              } catch (err) {
                console.log('Desktop location error:', err);
              }
            }
          }
          // If denied, don't show our prompt
        } else {
          // Permissions API not available, show prompt on mobile
          const isMobile = window.innerWidth < 768;
          if (isMobile) {
            setTimeout(() => setShowPrompt(true), 500);
          }
        }
      } catch (err) {
        console.log('Permission check error:', err);
        // Show prompt as fallback on mobile
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setTimeout(() => setShowPrompt(true), 500);
        }
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
      setShowPrompt(false);
      if (onLocationGranted) onLocationGranted(location);
    } catch (err) {
      console.log('Location request error:', err);
      setPermissionState('denied');
      // Keep prompt visible but show error state
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store that user dismissed, don't show again for this session
    sessionStorage.setItem('location_prompt_dismissed', 'true');
  };

  // Don't show if already dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('location_prompt_dismissed')) {
      setShowPrompt(false);
    }
  }, []);

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

          {/* Buttons */}
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
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Enable Location
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionPrompt;
