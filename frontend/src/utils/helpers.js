// Category icons as SVG strings or components
export const getCategoryIcon = (category) => {
  const icons = {
    pothole: '🕳️',
    trash: '🗑️',
    streetlight: '💡',
    hazard: '⚠️',
    graffiti: '🎨',
    road_damage: '🚧',
    other: '📍',
  };
  return icons[category] || icons.other;
};

// Category labels
export const getCategoryLabel = (category) => {
  const labels = {
    pothole: 'Pothole',
    trash: 'Trash/Garbage',
    streetlight: 'Streetlight',
    hazard: 'Safety Hazard',
    graffiti: 'Graffiti',
    road_damage: 'Road Damage',
    other: 'Other',
  };
  return labels[category] || 'Other';
};

// Priority colors for badges
export const getPriorityColor = (priority) => {
  const colors = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    urgent: 'priority-urgent',
  };
  return colors[priority] || colors.medium;
};

// Status badge styles
export const getStatusBadge = (status) => {
  const badges = {
    open: 'badge badge-open',
    in_progress: 'badge badge-in-progress',
    resolved: 'badge badge-resolved',
  };
  return badges[status] || badges.open;
};

// Format time ago
export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Compress image before upload
export const compressImage = (file, maxWidth = 1280, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// Extract EXIF GPS data from image
export const extractExifGps = async (file) => {
  return new Promise((resolve) => {
    // Dynamic import for EXIF-js
    import('exif-js').then((EXIF) => {
      EXIF.default.getData(file, function() {
        const lat = EXIF.default.getTag(this, 'GPSLatitude');
        const latRef = EXIF.default.getTag(this, 'GPSLatitudeRef');
        const lng = EXIF.default.getTag(this, 'GPSLongitude');
        const lngRef = EXIF.default.getTag(this, 'GPSLongitudeRef');

        if (lat && lng) {
          const latitude = convertDMSToDD(lat, latRef);
          const longitude = convertDMSToDD(lng, lngRef);
          resolve({ lat: latitude, lng: longitude });
        } else {
          resolve(null);
        }
      });
    }).catch(() => resolve(null));
  });
};

// Convert GPS coordinates from DMS to Decimal Degrees
const convertDMSToDD = (dms, ref) => {
  const degrees = dms[0];
  const minutes = dms[1];
  const seconds = dms[2];

  let dd = degrees + minutes / 60 + seconds / 3600;

  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }

  return dd;
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Generate share URL
export const getShareUrl = (reportId) => {
  return `${window.location.origin}/report/${reportId}`;
};

// Share report using Web Share API
export const shareReport = async (report) => {
  const shareData = {
    title: report.title,
    text: `Check out this civic issue: ${report.title}`,
    url: getShareUrl(report.id),
  };

  if (navigator.share && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareData.url);
      return true;
    } catch {
      return false;
    }
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Check if browser supports required features
export const checkBrowserSupport = () => {
  return {
    geolocation: 'geolocation' in navigator,
    serviceWorker: 'serviceWorker' in navigator,
    notifications: 'Notification' in window,
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webShare: !!navigator.share,
    indexedDB: !!window.indexedDB,
  };
};
