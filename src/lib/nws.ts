// Asks the National Weather Service which county, forecast zone, and office cover a
// pair of coordinates. Called once during onboarding, right after a ZIP is looked up.

// NWS requires a User-Agent naming the app and a way to reach whoever runs it.
const USER_AGENT = "(Landfall, github.com/imAryanL/Landfall)";

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
  try {
    const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { "User-Agent": USER_AGENT },
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
    // No signal, or NWS is down. Onboarding carries on without these.
    return null;
  }
}
