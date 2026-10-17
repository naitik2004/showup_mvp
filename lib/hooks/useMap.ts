'use client';

import { useState, useEffect, useCallback } from 'react';

// Fallback to Delhi NCR coordinates
export const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090 };

export function useMap() {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(DEFAULT_COORDS);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setPermissionDenied(false);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setPermissionDenied(true);
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    coords,
    loading,
    permissionDenied,
    requestLocation,
  };
}
