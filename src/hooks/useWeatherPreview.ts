import { useEffect, useState } from "react";

export interface WeatherSnapshot {
  tempF: number;
  condition: string;
  code: number;
  highF: number;
  lowF: number;
  city: string | null;
}

export type WeatherState = "idle" | "loading" | "denied" | "error" | "ready";

function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Storms";
  return "—";
}

async function fetchWeatherFromCoords(lat: number, lon: number): Promise<WeatherSnapshot> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const body = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
    daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
  };
  const tempF = Math.round(body.current?.temperature_2m ?? 0);
  const code = body.current?.weather_code ?? 0;
  const highF = Math.round(body.daily?.temperature_2m_max?.[0] ?? tempF);
  const lowF = Math.round(body.daily?.temperature_2m_min?.[0] ?? tempF);
  return { tempF, code, condition: describeWeatherCode(code), highF, lowF, city: null };
}

interface AddressLike {
  lat?: number;
  lng?: number;
  city?: string;
}

/** Fetches a one-shot weather snapshot, preferring saved profile coords and
 *  falling back to browser geolocation. Returns a `reload` to retry on demand. */
export function useWeatherPreview(address: AddressLike | null | undefined) {
  const [data, setData] = useState<WeatherSnapshot | null>(null);
  const [state, setState] = useState<WeatherState>("idle");

  const load = () => {
    setState("loading");

    if (address?.lat != null && address?.lng != null) {
      fetchWeatherFromCoords(address.lat, address.lng)
        .then((snap) => {
          setData({ ...snap, city: address.city ?? null });
          setState("ready");
        })
        .catch(() => setState("error"));
      return;
    }

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const snap = await fetchWeatherFromCoords(pos.coords.latitude, pos.coords.longitude);
          setData(snap);
          setState("ready");
        } catch {
          setState("error");
        }
      },
      () => setState("denied"),
      { maximumAge: 10 * 60 * 1000, timeout: 8000 },
    );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address?.lat, address?.lng]);

  return { data, state, reload: load };
}
