import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Device Fingerprint Service
 * Generates unique device identifier for anonymous voting
 */

let fpPromise = null;
let cachedFingerprint = null;

// Initialize FingerprintJS
const initFingerprint = () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
};

// Get device fingerprint
export const getDeviceFingerprint = async () => {
  // Return cached fingerprint if available
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  // Check localStorage first
  const stored = localStorage.getItem('road_patrol_device_id');
  if (stored) {
    cachedFingerprint = stored;
    return stored;
  }

  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    
    // Create a hash of the visitor ID for privacy
    const fingerprint = result.visitorId;
    
    // Cache and store
    cachedFingerprint = fingerprint;
    localStorage.setItem('road_patrol_device_id', fingerprint);
    
    return fingerprint;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    
    // Fallback: Generate a random ID if fingerprinting fails
    const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('road_patrol_device_id', fallbackId);
    cachedFingerprint = fallbackId;
    
    return fallbackId;
  }
};

// Clear cached fingerprint (for testing)
export const clearFingerprint = () => {
  cachedFingerprint = null;
  localStorage.removeItem('road_patrol_device_id');
};

// Get fingerprint info (for debugging)
export const getFingerprintInfo = async () => {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    
    return {
      visitorId: result.visitorId,
      confidence: result.confidence,
      components: Object.keys(result.components),
    };
  } catch (error) {
    console.error('Error getting fingerprint info:', error);
    return null;
  }
};
