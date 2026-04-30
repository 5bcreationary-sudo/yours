// National Weather Service (api.weather.gov) — no API key required, but every
// request must include a User-Agent header per NWS policy. Two-hop flow:
//   1. GET /points/{lat},{lon}  → metadata with forecast + forecastHourly URLs
//   2. GET <forecastHourly>     → 156 hourly periods (we use periods[0] as "now")
//      GET <forecast>           → 14 twice-daily periods (we derive today high/low)
//
// NWS covers US + territories only. For points outside that envelope, /points
// returns 404 — we fall back to null so the briefing pipeline can skip weather
// cleanly rather than inventing data.

import { withTimeout, retry, logInfo, logError } from "./errors.ts";

const USER_AGENT =
  Deno.env.get("NWS_USER_AGENT") ??
  "YoursBriefing/1.0 (https://yours.fm; support@yours.fm)";

const TZ_FALLBACK: Record<string, { lat: number; lon: number; name: string }> = {
  "America/Los_Angeles": { lat: 34.05, lon: -118.24, name: "Los Angeles" },
  "America/New_York":    { lat: 40.71, lon: -74.01,  name: "New York" },
  "America/Chicago":     { lat: 41.88, lon: -87.63,  name: "Chicago" },
  "America/Denver":      { lat: 39.74, lon: -104.99, name: "Denver" },
  "America/Phoenix":     { lat: 33.45, lon: -112.07, name: "Phoenix" },
};

export interface WeatherSnapshot {
  location: string;
  currentF: number;
  highF: number;
  lowF: number;
  condition: string;
  chanceOfRain: number;
  windMph: number;
}

interface NWSPoint {
  properties: {
    forecast: string;
    forecastHourly: string;
    relativeLocation?: {
      properties?: { city?: string; state?: string };
    };
  };
}

interface NWSForecastPeriod {
  number: number;
  name: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: "F" | "C";
  windSpeed: string;
  shortForecast: string;
  probabilityOfPrecipitation?: { value: number | null };
}

interface NWSForecastResponse {
  properties: { periods: NWSForecastPeriod[] };
}

class NWSError extends Error {
  constructor(message: string, readonly status: number, readonly retryable: boolean) {
    super(message);
  }
}

async function nwsFetch(url: string, label: string): Promise<Response> {
  const res = await withTimeout(
    fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json",
      },
    }),
    8000,
    `nws.${label}`,
  );

  if (res.status === 429) throw new NWSError(`${label} rate limited`, 429, true);
  if (res.status >= 500) throw new NWSError(`${label} server ${res.status}`, res.status, true);
  if (res.status === 403) {
    const body = await res.text();
    if (body.includes("User-Agent")) {
      throw new NWSError(`${label} rejected: User-Agent required`, 403, false);
    }
    throw new NWSError(`${label} forbidden`, 403, false);
  }
  if (!res.ok) throw new NWSError(`${label} http ${res.status}`, res.status, false);
  return res;
}

function parseWindMph(windSpeed: string): number {
  // NWS format: "10 mph" or "10 to 15 mph". Pick upper bound.
  const matches = Array.from(windSpeed.matchAll(/(\d+)/g)).map((m) => Number(m[1]));
  if (!matches.length) return 0;
  return Math.max(...matches);
}

function resolveCoords(params: {
  timezone: string;
  homeAddress: Record<string, unknown> | null;
}): { lat: number; lon: number; name?: string } | null {
  if (params.homeAddress && typeof params.homeAddress === "object") {
    const a = params.homeAddress as Record<string, unknown>;
    if (typeof a.lat === "number" && typeof a.lng === "number") {
      return { lat: a.lat, lon: a.lng, name: typeof a.city === "string" ? a.city : undefined };
    }
  }
  const fb = TZ_FALLBACK[params.timezone];
  return fb ? { lat: fb.lat, lon: fb.lon, name: fb.name } : null;
}

export async function fetchWeather(params: {
  timezone: string;
  homeAddress: Record<string, unknown> | null;
}): Promise<WeatherSnapshot | null> {
  const coords = resolveCoords(params);
  if (!coords) {
    logInfo("weather.skipped", { reason: "no_coords" });
    return null;
  }

  const lat = Number(coords.lat.toFixed(4));
  const lon = Number(coords.lon.toFixed(4));

  try {
    const shouldRetry = (err: unknown) => err instanceof NWSError && err.retryable;

    const pointRes = await retry(
      () => nwsFetch(`https://api.weather.gov/points/${lat},${lon}`, "points"),
      { tries: 3, baseMs: 600, shouldRetry },
    );
    const point = (await pointRes.json()) as NWSPoint;
    const loc = point.properties.relativeLocation?.properties;
    const locationName =
      coords.name ??
      (loc?.city && loc?.state ? `${loc.city}, ${loc.state}` : `${lat},${lon}`);

    const [hourlyRes, dailyRes] = await Promise.all([
      retry(() => nwsFetch(point.properties.forecastHourly, "hourly"), {
        tries: 3, baseMs: 600, shouldRetry,
      }),
      retry(() => nwsFetch(point.properties.forecast, "forecast"), {
        tries: 3, baseMs: 600, shouldRetry,
      }),
    ]);

    const hourly = (await hourlyRes.json()) as NWSForecastResponse;
    const daily  = (await dailyRes.json())  as NWSForecastResponse;

    const now = hourly.properties.periods[0];
    if (!now) {
      logInfo("weather.empty_forecast", { lat, lon });
      return null;
    }

    // NWS daily periods alternate day/night starting with whichever is current.
    // Pull the next 4 periods and derive today's extremes so we're robust
    // whether the briefing is generated in the morning or evening.
    const next4 = daily.properties.periods.slice(0, 4);
    const temps = next4.map((p) => p.temperature);
    const highF = temps.length ? Math.max(...temps) : now.temperature;
    const lowF  = temps.length ? Math.min(...temps) : now.temperature;

    const popRaw = now.probabilityOfPrecipitation?.value;
    const chanceOfRain = typeof popRaw === "number" ? Math.round(popRaw) : 0;

    return {
      location: locationName,
      currentF: now.temperature,
      highF,
      lowF,
      condition: now.shortForecast,
      chanceOfRain,
      windMph: parseWindMph(now.windSpeed),
    };
  } catch (err) {
    if (err instanceof NWSError && err.status === 404) {
      logInfo("weather.out_of_coverage", { lat, lon });
      return null;
    }
    logError("weather.error", {
      err: err instanceof Error ? err.message : String(err),
      lat,
      lon,
    });
    return null;
  }
}
