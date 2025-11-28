// src/services/geolocation.js

/**
 * Geolocation Service
 * Handles all location-related functionality including tracking, distance calculation,
 * and nearest resource matching
 */

// ============================================
// LOCATION TRACKING
// ============================================

export const locationService = {
  /**
   * Get current user location (one-time)
   */
  async getCurrentLocation(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp).toISOString()
          });
        },
        (error) => {
          reject(this.handleLocationError(error));
        },
        defaultOptions
      );
    });
  },

  /**
   * Start watching user location (continuous tracking)
   */
  startWatching(callback, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
      ...options
    };

    if (!navigator.geolocation) {
      callback(null, new Error('Geolocation is not supported'));
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toISOString()
        };
        callback(location, null);
      },
      (error) => {
        callback(null, this.handleLocationError(error));
      },
      defaultOptions
    );

    return watchId;
  },

  /**
   * Stop watching user location
   */
  stopWatching(watchId) {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  /**
   * Handle location errors
   */
  handleLocationError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Location permission denied. Please enable location access in your browser settings.');
      case error.POSITION_UNAVAILABLE:
        return new Error('Location information is unavailable. Please check your device settings.');
      case error.TIMEOUT:
        return new Error('Location request timed out. Please try again.');
      default:
        return new Error('An unknown error occurred while getting location.');
    }
  },

  /**
   * Check if location services are available
   */
  isAvailable() {
    return 'geolocation' in navigator;
  },

  /**
   * Request location permission
   */
  async requestPermission() {
    try {
      const location = await this.getCurrentLocation();
      return { granted: true, location };
    } catch (error) {
      return { granted: false, error: error.message };
    }
  }
};

// ============================================
// DISTANCE CALCULATION
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance with unit options
 */
export function calculateDistanceWithUnit(lat1, lon1, lat2, lon2, unit = 'km') {
  const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);
  
  switch (unit) {
    case 'km':
      return distanceKm;
    case 'm':
      return distanceKm * 1000;
    case 'mi':
      return distanceKm * 0.621371;
    default:
      return distanceKm;
  }
}

// ============================================
// RESOURCE PROXIMITY MATCHING
// ============================================

export const proximityService = {
  /**
   * Find nearest resources to a given location
   */
  findNearestResources(userLocation, resources, maxDistance = 50, limit = 10) {
    if (!userLocation || !resources || resources.length === 0) {
      return [];
    }

    // Calculate distance for each resource
    const resourcesWithDistance = resources
      .filter(resource => resource.latitude && resource.longitude)
      .map(resource => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          resource.latitude,
          resource.longitude
        );

        return {
          ...resource,
          distance,
          distanceText: this.formatDistance(distance)
        };
      });

    // Filter by max distance and sort by distance
    return resourcesWithDistance
      .filter(resource => resource.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  },

  /**
   * Find resources by type within radius
   */
  findResourcesByType(userLocation, resources, type, maxDistance = 50) {
    const nearest = this.findNearestResources(userLocation, resources, maxDistance, 100);
    return nearest.filter(resource => resource.type === type);
  },

  /**
   * Format distance for display
   */
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  },

  /**
   * Get estimated travel time (walking speed ~5 km/h)
   */
  estimateTravelTime(distance, mode = 'walking') {
    const speeds = {
      walking: 5, // km/h
      driving: 40, // km/h
      emergency: 60 // km/h
    };

    const speed = speeds[mode] || speeds.walking;
    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);

    if (timeInMinutes < 60) {
      return `${timeInMinutes} min`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  },

  /**
   * Check if location is within service area
   */
  isWithinServiceArea(location, serviceAreas) {
    // For now, simple circular areas
    // Can be extended to support polygon areas
    return serviceAreas.some(area => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        area.center.latitude,
        area.center.longitude
      );
      return distance <= area.radius;
    });
  },

  /**
   * Group resources by proximity zones
   */
  groupByProximity(userLocation, resources, zones = [1, 5, 10, 50]) {
    const nearest = this.findNearestResources(userLocation, resources, Math.max(...zones), 1000);
    
    return zones.reduce((acc, zone, index) => {
      const minDistance = index === 0 ? 0 : zones[index - 1];
      const maxDistance = zone;
      
      acc[`within_${zone}km`] = nearest.filter(
        r => r.distance > minDistance && r.distance <= maxDistance
      );
      
      return acc;
    }, {});
  }
};

// ============================================
// MAP URL GENERATORS
// ============================================

export const mapService = {
  /**
   * Generate Google Maps URL for location
   */
  getGoogleMapsUrl(latitude, longitude, label = '') {
    return `https://www.google.com/maps?q=${latitude},${longitude}${label ? `+(${encodeURIComponent(label)})` : ''}`;
  },

  /**
   * Generate directions URL
   */
  getDirectionsUrl(fromLat, fromLon, toLat, toLon, mode = 'driving') {
    return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLon}&destination=${toLat},${toLon}&travelmode=${mode}`;
  },

  /**
   * Generate Apple Maps URL (for iOS)
   */
  getAppleMapsUrl(latitude, longitude, label = '') {
    return `http://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`;
  },

  /**
   * Generate platform-specific maps URL
   */
  getMapsUrl(latitude, longitude, label = '') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS 
      ? this.getAppleMapsUrl(latitude, longitude, label)
      : this.getGoogleMapsUrl(latitude, longitude, label);
  },

  /**
   * Generate shareable location URL
   */
  getShareableLocationUrl(latitude, longitude) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
};

// ============================================
// LOCATION UTILITIES
// ============================================

export const locationUtils = {
  /**
   * Format coordinates for display
   */
  formatCoordinates(latitude, longitude, precision = 6) {
    return {
      latitude: latitude.toFixed(precision),
      longitude: longitude.toFixed(precision),
      display: `${latitude.toFixed(precision)}°N, ${longitude.toFixed(precision)}°E`
    };
  },

  /**
   * Validate coordinates
   */
  isValidCoordinates(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  },

  /**
   * Get location accuracy description
   */
  getAccuracyDescription(accuracy) {
    if (accuracy < 10) return 'Excellent';
    if (accuracy < 50) return 'Good';
    if (accuracy < 100) return 'Fair';
    return 'Poor';
  },

  /**
   * Check if location is stale
   */
  isLocationStale(timestamp, maxAgeSeconds = 60) {
    const now = new Date().getTime();
    const locationTime = new Date(timestamp).getTime();
    const ageSeconds = (now - locationTime) / 1000;
    return ageSeconds > maxAgeSeconds;
  }
};

export default {
  locationService,
  proximityService,
  mapService,
  locationUtils,
  calculateDistance,
  calculateDistanceWithUnit
};