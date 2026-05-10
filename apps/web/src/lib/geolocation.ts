export type Coords = { lat: number; lng: number };

export function getCurrentCoords(timeoutMs = 4000): Promise<Coords | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (coords: Coords | null) => {
      if (settled) return;
      settled = true;
      resolve(coords);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => finish(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 },
    );

    // Hard fallback in case the browser ignores `timeout` (some firefox versions)
    setTimeout(() => finish(null), timeoutMs + 500);
  });
}
