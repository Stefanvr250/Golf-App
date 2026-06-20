"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface UseGPSReturn {
  position: GPSPosition | null;
  error: string | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
}

/**
 * Custom hook wrapping navigator.geolocation.watchPosition with high accuracy.
 * Throttled to ~1 update per second.
 */
export function useGPS(): UseGPSReturn {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setError(null);
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        // Throttle to 1 update per second
        if (now - lastUpdateRef.current < 1000) return;
        lastUpdateRef.current = now;

        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please enable GPS access.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable. Check your GPS settings.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Retrying…");
            break;
          default:
            setError("An unknown GPS error occurred.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { position, error, isTracking, startTracking, stopTracking };
}
