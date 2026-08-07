// Asks the National Weather Service which county, forecast zone, and office cover a
// pair of coordinates. Called once during onboarding, right after a ZIP is looked up.

// NWS requires a User-Agent naming the app and a way to reach whoever runs it.
const USER_AGENT = "(Landfall, github.com/imAryanL/Landfall)";

// fetch has no timeout of its own. Without this, a connection that is accepted but never
// answered would leave the screen loading forever instead of falling back to offline.
const TIMEOUT_MS = 8000;

export type PointData = {
  county: string;
  zoneId: string;
  office: string;
  city: string;
  state: string;
};

// The API is JSON-LD, so these come back as full URLs and we only want the ID on the end.
function lastPart(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

export async function fetchPointData(lat: number, lon: number): Promise<PointData | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    const point = body.properties;
    const place = point.relativeLocation.properties;

    return {
      county: lastPart(point.county),
      zoneId: lastPart(point.forecastZone),
      office: point.cwa,
      city: place.city,
      state: place.state,
    };
  } catch {
    // No signal, NWS is down, or it ran past the timeout above. Onboarding carries on
    // without these.
    return null;
  } finally {
    // Runs whether we returned or threw, so a fast answer doesn't leave a timer pending.
    clearTimeout(timer);
  }
}
