import { warn } from '@/lib/log';

export type LatLng = { lat: number; lng: number };

export type DirectionsETAResult = {
  distanceMeters: number;
  distanceText: string;
  durationSec: number;
  durationText: string;
  durationInTrafficSec?: number;
  durationInTrafficText?: string;
};

type TrafficModel = 'best_guess' | 'pessimistic' | 'optimistic';
type Units = 'metric' | 'imperial';

/**
 * Fetch ETA (with traffic) using Google Directions API.
 * Requires EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env and Directions API enabled.
 */
export async function getDrivingEta(
  origin: LatLng,
  destination: LatLng,
  options?: { departureTime?: Date | 'now'; trafficModel?: TrafficModel; units?: Units }
): Promise<DirectionsETAResult | null> {
  try {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return null;

    const departure = options?.departureTime === 'now' || !options?.departureTime
      ? 'now'
      : Math.floor((options?.departureTime as Date).getTime() / 1000).toString();
    const trafficModel = options?.trafficModel || 'best_guess';
    const units = options?.units || 'metric';

    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: 'driving',
      departure_time: departure,
      traffic_model: trafficModel,
      units,
      key,
    });

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      try { warn('Google Directions fetch failed', { status: res.status, body: (await res.text()).slice(0, 200) }); } catch {}
      return null;
    }
    const data = await res.json();
    if (data.status !== 'OK' || !data.routes?.length || !data.routes[0].legs?.length) {
      try { warn('Google Directions response not OK', { status: data.status, error_message: data.error_message }); } catch {}
      return null;
    }

    const leg = data.routes[0].legs[0];
    const distanceMeters: number = leg.distance?.value ?? 0;
    const distanceText: string = leg.distance?.text ?? '';
    const durationSec: number = leg.duration?.value ?? 0;
    const durationText: string = leg.duration?.text ?? '';
    const durationInTrafficSec: number | undefined = leg.duration_in_traffic?.value;
    const durationInTrafficText: string | undefined = leg.duration_in_traffic?.text;

    return {
      distanceMeters,
      distanceText,
      durationSec,
      durationText,
      durationInTrafficSec,
      durationInTrafficText,
    };
  } catch (e) {
    try { warn('Google Directions exception', String(e)); } catch {}
    return null;
  }
}


