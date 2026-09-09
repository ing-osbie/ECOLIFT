/** OpenStreetMap-compatible geocoding and routing service for EcoLift. */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const OSRM_URL = "https://router.project-osrm.org";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  placeId: string;
  formattedAddress: string;
  name: string;
  location: LatLng;
}

export interface PlaceDetailsResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: LatLng;
  isOpenNow?: boolean;
}

export interface RouteResult {
  distanceText: string;
  distanceValue: number; // meters
  durationText: string;
  durationValue: number; // seconds
  points: LatLng[];
}

/**
 * Geocode a search string into geographic coordinates and formatted address
 * using OpenStreetMap's Nominatim service.
 */
export async function geocodeAddress(
  address: string,
  regionBias?: string,
): Promise<GeocodeResult[]> {
  const encodedAddress = encodeURIComponent(address.trim());
  const countryParam = regionBias
    ? `&countrycodes=${encodeURIComponent(regionBias)}`
    : "";
  const url = `${NOMINATIM_URL}/search?format=jsonv2&addressdetails=1&limit=5&q=${encodedAddress}${countryParam}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((res: any) => ({
      placeId: `osm:${res.lat}:${res.lon}`,
      formattedAddress: res.display_name,
      name: res.name || res.display_name.split(",")[0] || address,
      location: {
        latitude: Number(res.lat),
        longitude: Number(res.lon),
      },
    }));
  } catch (error) {
    console.warn("[OpenStreetMap Service] Geocoding error:", error);
    return [];
  }
}

/**
 * Convert latitude and longitude into a human-readable street address
 * using OpenStreetMap's Nominatim service.
 */
export async function reverseGeocode(coords: LatLng): Promise<string | null> {
  const url = `${NOMINATIM_URL}/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.display_name) {
      return data.display_name;
    }
    return null;
  } catch (error) {
    console.warn("[OpenStreetMap Service] Reverse Geocoding error:", error);
    return null;
  }
}

/**
 * Resolve a Nominatim result into the existing place-details shape.
 */
export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetailsResult | null> {
  try {
    const [prefix, latitude, longitude] = placeId.split(":");
    if (prefix !== "osm" || !latitude || !longitude) return null;
    const address = await reverseGeocode({
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
    if (address) {
      return {
        placeId,
        name: address.split(",")[0],
        formattedAddress: address,
        location: { latitude: Number(latitude), longitude: Number(longitude) },
      };
    }
    return null;
  } catch (error) {
    console.warn("[OpenStreetMap Service] Place details error:", error);
    return null;
  }
}

/**
 * Calculate driving directions and route coordinates between origin and destination
 * using the public OSRM routing service.
 */
export async function getDirections(
  origin: LatLng,
  destination: LatLng,
): Promise<RouteResult | null> {
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${OSRM_URL}/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];

      // Simple overview polyline decoding into LatLng points
      const points: LatLng[] = decodePolyline(route.geometry);

      return {
        distanceText: `${(route.distance / 1000).toFixed(1)} km`,
        distanceValue: route.distance,
        durationText: `${Math.round(route.duration / 60)} min`,
        durationValue: route.duration,
        points,
      };
    }
    return null;
  } catch (error) {
    console.warn("[OpenStreetMap Service] Directions error:", error);
    return null;
  }
}

/**
 * Decode Encoded Google Polyline string into array of LatLng coordinates
 */
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}
