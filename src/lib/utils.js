import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a Google Maps URL to extract latitude and longitude.
 * Supports formats like:
 *   https://www.google.com/maps/place/.../@10.873,106.804,17z/...
 *   https://maps.google.com/?q=10.873,106.804
 *   https://goo.gl/maps/... (after redirect — same @lat,lng pattern)
 *
 * @param {string} url
 * @returns {{ lat: number, lng: number } | null}
 */
export function parseGoogleMapsUrl(url) {
  if (!url || typeof url !== "string") return null;

  // Pattern 1: /@lat,lng in path
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Pattern 2: ?q=lat,lng or ?ll=lat,lng
  const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  return null;
}
