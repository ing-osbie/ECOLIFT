/**
 * Google Maps Platform Service for EcoLift
 * Source: Google Maps Platform Code Assist
 *
 * Provides typed helper functions for interacting with Google Maps Platform APIs:
 * - Geocoding API (Address to Lat/Lng)
 * - Reverse Geocoding API (Lat/Lng to Address)
 * - Place Details API (Place information & Opening Hours)
 * - Directions API (Route calculation & Waypoint coordinates)
 */

export const getGoogleMapsApiKey = (): string => {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.warn(
      "[Google Maps Service] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set. " +
        "Add it to your .env file. Map features will be unavailable.",
    );
  }
  return key || "";
};

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
 * using the Google Maps Geocoding API worldwide.
 */
export async function geocodeAddress(
  address: string,
  regionBias?: string,
): Promise<GeocodeResult[]> {
  const apiKey = getGoogleMapsApiKey();
  const encodedAddress = encodeURIComponent(address.trim());
  const regionParam = regionBias ? `&region=${regionBias}` : "";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}${regionParam}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results) {
      return [];
    }

    return data.results.map((res: any) => ({
      placeId: res.place_id,
      formattedAddress: res.formatted_address,
      name: res.formatted_address.split(",")[0] || address,
      location: {
        latitude: res.geometry.location.lat,
        longitude: res.geometry.location.lng,
      },
    }));
  } catch (error) {
    console.warn("[Google Maps Service] Geocoding error:", error);
    return [];
  }
}

/**
 * Convert latitude and longitude into a human-readable street address
 * using the Google Maps Reverse Geocoding API.
 */
export async function reverseGeocode(coords: LatLng): Promise<string | null> {
  const apiKey = getGoogleMapsApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.warn("[Google Maps Service] Reverse Geocoding error:", error);
    return null;
  }
}

/**
 * Fetch detailed place information using Google Maps Place Details API.
 */
export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetailsResult | null> {
  const apiKey = getGoogleMapsApiKey();
  const fields = "place_id,name,formatted_address,geometry,opening_hours";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.result) {
      const place = data.result;
      return {
        placeId: place.place_id,
        name: place.name,
        formattedAddress: place.formatted_address,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        isOpenNow: place.opening_hours?.open_now,
      };
    }
    return null;
  } catch (error) {
    console.warn("[Google Maps Service] Place details error:", error);
    return null;
  }
}

/**
 * Calculate driving directions and route coordinates between origin and destination
 * using the Google Maps Directions API.
 */
export async function getDirections(
  origin: LatLng,
  destination: LatLng,
): Promise<RouteResult | null> {
  const apiKey = getGoogleMapsApiKey();
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=driving&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      // Simple overview polyline decoding into LatLng points
      const points: LatLng[] = decodePolyline(route.overview_polyline.points);

      return {
        distanceText: leg.distance.text,
        distanceValue: leg.distance.value,
        durationText: leg.duration.text,
        durationValue: leg.duration.value,
        points,
      };
    }
    return null;
  } catch (error) {
    console.warn("[Google Maps Service] Directions error:", error);
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
