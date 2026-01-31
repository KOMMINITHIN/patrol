import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '../../stores/reportStore';
import { getDefaultLocation, getCurrentLocation } from '../../services/geolocation';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons by priority
const createCustomIcon = (priority) => {
  const colors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444',
  };

  const color = colors[priority] || colors.medium;

  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div class="custom-marker priority-${priority}" style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// User location marker
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid white;
      box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0,0,0,0.2);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Map event handler component
const MapEventHandler = ({ onMapClick, onBoundsChange }) => {
  const map = useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
  });

  return null;
};

// Component to capture map reference
const MapRefHandler = ({ mapRef }) => {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  return null;
};

// Component to fly to location - smooth animation on initial load and locate button
const FlyToLocation = ({ location, shouldFly, onAnimationEnd }) => {
  const map = useMap();
  const hasFlewRef = useRef(false);

  useEffect(() => {
    if (location && shouldFly && !hasFlewRef.current) {
      hasFlewRef.current = true;
      
      // Listen for animation end
      const handleMoveEnd = () => {
        map.off('moveend', handleMoveEnd);
        if (onAnimationEnd) onAnimationEnd();
      };
      map.on('moveend', handleMoveEnd);
      
      // Smooth fly animation - 1.8 seconds, nice and smooth
      map.flyTo([location.lat, location.lng], 15, {
        duration: 1.8,
        easeLinearity: 0.2,
      });
    }
  }, [location, shouldFly, map, onAnimationEnd]);

  return null;
};

// Helper to check if map is already at location
const isAtLocation = (map, lat, lng, tolerance = 0.0005) => {
  const center = map.getCenter();
  return Math.abs(center.lat - lat) < tolerance && Math.abs(center.lng - lng) < tolerance;
};

const MapView = ({ onLocationSelect, selectionMode = false, initialLocation = null, userLocationProp = null }) => {
  const navigate = useNavigate();
  const { reports, fetchReports, fetchReportsInBounds, selectReport } = useReportStore();
  const [userLocation, setUserLocation] = useState(userLocationProp);
  const [selectedPosition, setSelectedPosition] = useState(initialLocation);
  const [shouldFlyToUser, setShouldFlyToUser] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hasInitialFlyRef = useRef(false);

  const defaultLocation = getDefaultLocation();
  const defaultZoom = parseInt(import.meta.env.VITE_DEFAULT_ZOOM) || 13;

  // Update user location when prop changes (from LocationPermissionPrompt)
  useEffect(() => {
    if (userLocationProp) {
      setUserLocation({
        lat: userLocationProp.lat,
        lng: userLocationProp.lng,
      });
      // Only fly on first location set
      if (!hasInitialFlyRef.current) {
        hasInitialFlyRef.current = true;
        setShouldFlyToUser(true);
      }
    }
  }, [userLocationProp]);

  // Listen for location updates from App - only update marker, don't fly
  useEffect(() => {
    const handleLocationUpdate = (event) => {
      const loc = event.detail;
      if (loc) {
        setUserLocation({ lat: loc.lat, lng: loc.lng });
        // Don't auto-fly on every update - just update the marker position
      }
    };
    
    window.addEventListener('userLocationUpdated', handleLocationUpdate);
    return () => window.removeEventListener('userLocationUpdated', handleLocationUpdate);
  }, []);

  useEffect(() => {
    // Fetch initial reports
    fetchReports({ excludeResolved: true });

    // Get user location using optimized service (if not already provided)
    if (!userLocationProp) {
      getCurrentLocation()
        .then((location) => {
          setUserLocation({
            lat: location.lat,
            lng: location.lng,
          });
          // Fly to user on initial load
          if (!hasInitialFlyRef.current) {
            hasInitialFlyRef.current = true;
            setShouldFlyToUser(true);
          }
        })
        .catch((error) => {
          console.log('Geolocation error:', error.message);
        });
    }
  }, [userLocationProp]);

  const handleMapClick = (latlng) => {
    if (selectionMode && onLocationSelect) {
      setSelectedPosition({ lat: latlng.lat, lng: latlng.lng });
      onLocationSelect({ lat: latlng.lat, lng: latlng.lng });
    }
  };

  const handleBoundsChange = (bounds) => {
    // Optionally fetch reports in bounds for large datasets
    // fetchReportsInBounds(bounds);
  };

  const handleReportClick = (report) => {
    selectReport(report);
    navigate(`/report/${report.id}`);
  };

  const center = userLocation || defaultLocation;
  // Start with a slightly zoomed out view so fly animation is more visible
  const initialZoom = userLocation ? defaultZoom : 11;

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full relative"
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={initialZoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapRefHandler mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler
          onMapClick={handleMapClick}
          onBoundsChange={handleBoundsChange}
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-semibold text-gray-900">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Selected position marker (for report creation) */}
        {selectionMode && selectedPosition && (
          <Marker
            position={[selectedPosition.lat, selectedPosition.lng]}
            icon={createCustomIcon('medium')}
          >
            <Popup>
              <div className="text-center p-2">
                <p className="font-semibold text-gray-900">Selected Location</p>
                <p className="text-sm text-gray-500">
                  {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Report markers */}
        {!selectionMode &&
          reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createCustomIcon(report.priority)}
              eventHandlers={{
                click: () => handleReportClick(report),
              }}
            >
              <Popup>
                <div className="p-3 min-w-[200px]">
                  <div className="flex items-start space-x-3">
                    {report.photo_url && (
                      <img 
                        src={report.photo_url} 
                        alt={report.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                        {report.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          report.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          report.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          report.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {report.priority}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'open' ? 'bg-blue-100 text-blue-700' :
                          report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {report.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6z"/>
                          </svg>
                          {report.vote_count || 0}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {report.view_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleReportClick(report)}
                    className="w-full mt-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Fly to user location only once on initial load */}
        {userLocation && (
          <FlyToLocation 
            location={userLocation} 
            shouldFly={shouldFlyToUser} 
            onAnimationEnd={() => setIsAnimating(false)}
          />
        )}
      </MapContainer>

      {/* Map controls overlay - hidden on mobile */}
      <div className="absolute bottom-6 right-6 z-[1000] hidden md:flex flex-col space-y-2">
        {/* Locate me button - desktop only */}
        <button
          onClick={() => {
            // Prevent clicks while animating
            if (isAnimating) return;
            
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  };
                  setUserLocation(newLocation);
                  
                  // Only fly if not already at location (prevents shaking)
                  if (mapRef.current) {
                    if (isAtLocation(mapRef.current, newLocation.lat, newLocation.lng)) {
                      // Already at location - do nothing to prevent shaking
                      return;
                    }
                    // Smooth fly to new location - same animation as initial load
                    setIsAnimating(true);
                    mapRef.current.flyTo([newLocation.lat, newLocation.lng], 15, { 
                      duration: 1.8,
                      easeLinearity: 0.2,
                    });
                    // Clear animating state after animation
                    setTimeout(() => setIsAnimating(false), 1900);
                  }
                },
                (error) => console.log('Error:', error)
              );
            }
          }}
          className={`w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center transition-colors ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          title="Find my location"
          disabled={isAnimating}
        >
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Selection mode instruction */}
      {selectionMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700">
            Tap on the map to select location
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
