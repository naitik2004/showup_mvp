'use client';

import { useState, useEffect, useCallback } from 'react';

// Fallback to Delhi NCR coordinates
export const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090 };

export function useMap() {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(DEFAULT_COORDS);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
        setPermissionDenied(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setPermissionDenied(true);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
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
