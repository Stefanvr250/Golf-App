/**
 * GPS distance and bearing utilities for golf course use.
 * Uses @turf/distance and @turf/bearing for geodesic calculations.
 */

import { distance as turfDistance } from "@turf/distance";
import { bearing as turfBearing } from "@turf/bearing";
import { point } from "@turf/helpers";

/**
 * Calculate distance between two GPS coordinates in yards.
 */
export function distanceToPoint(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number
): number {
  const from = point([userLng, userLat]);
  const to = point([targetLng, targetLat]);
  // turf returns km by default
  const km = turfDistance(from, to, { units: "kilometers" });
  // 1 km = 1093.6133 yards
  return Math.round(km * 1093.6133);
}

/**
 * Calculate bearing from user to target as compass direction (degrees 0-360).
 */
export function bearingToPoint(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number
): number {
  const from = point([userLng, userLat]);
  const to = point([targetLng, targetLat]);
  const deg = turfBearing(from, to);
  // turfBearing returns -180 to 180, normalize to 0-360
  return (deg + 360) % 360;
}

/**
 * Convert bearing degrees to cardinal direction string.
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Calculate distance in meters (for radius/proximity checks).
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const from = point([lng1, lat1]);
  const to = point([lng2, lat2]);
  return turfDistance(from, to, { units: "meters" });
}
