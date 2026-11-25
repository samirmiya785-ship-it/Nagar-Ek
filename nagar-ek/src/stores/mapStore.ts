import { create } from "zustand";

export type PlaceCategory = 'hospital' | 'government' | 'police';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  distance: string;
}

interface MapStoreInterface {
  places: Place[];
  loading: boolean;
  fetchPlaces: (lat: number, lng: number) => Promise<Place[]>;
}

// Distance helper within store for calculating distance of DB places
function distMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const ph1 = (lat1 * Math.PI) / 180;
  const ph2 = (lat2 * Math.PI) / 180;
  const dph = ((lat2 - lat1) * Math.PI) / 180;
  const dlm = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dph / 2) * Math.sin(dph / 2) +
    Math.cos(ph1) * Math.cos(ph2) * Math.sin(dlm / 2) * Math.sin(dlm / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function classifyTags(tags: Record<string, string>): PlaceCategory | null {
  const a = tags.amenity;
  const h = tags.healthcare;
  const o = tags.office;
  if (a === 'hospital' || a === 'clinic' || a === 'doctors' ||
      h === 'hospital' || h === 'clinic') return 'hospital';
  if (a === 'police') return 'police';
  if (a === 'townhall' || a === 'public_building' ||
      o === 'government' || o === 'administrative') return 'government';
  return null;
}

export const useMapStore = create<MapStoreInterface>((set) => ({
  places: [],
  loading: false,
  fetchPlaces: async (lat: number, lng: number) => {
    set({ loading: true });
    const r = 15000; // 15 km radius
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.10.8.143:4444/api';

    // 1. Fetch cached places from Backend DB
    let dbPlaces: Place[] = [];
    try {
      const dbRes = await fetch(`${API_URL}/map/places?lat=${lat}&lng=${lng}&radius=${r}`);
      if (dbRes.ok) {
        const data = await dbRes.json();
        dbPlaces = data.map((p: any) => ({
          id: `db-${p._id}`,
          name: p.name,
          category: p.category as PlaceCategory,
          lat: p.location.coordinates[1],
          lng: p.location.coordinates[0],
          address: '',
          phone: '',
          distance: fmtDist(distMeters(lat, lng, p.location.coordinates[1], p.location.coordinates[0])),
        }));
        // Show cached DB places on the map immediately to keep UX fast
        set({ places: dbPlaces, loading: false });
      }
    } catch (err) {
      console.warn('[Map DB Fetch] failed:', err);
    }

    // 2. Fetch from Overpass API (Continues in background/parallel with retries)
    let elements: any[] = [];
    let success = false;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Dynamic longer timeout: 28s -> 38s -> 48s
      const timeoutMs = 18000 + attempt * 10000;
      const queryTimeoutSec = 20 + attempt * 10;
      
      const query = [
        `[out:json][timeout:${queryTimeoutSec}];`,
        `(`,
        `node["amenity"="hospital"](around:${r},${lat},${lng});`,
        `way["amenity"="hospital"](around:${r},${lat},${lng});`,
        `node["amenity"="clinic"](around:${r},${lat},${lng});`,
        `way["amenity"="clinic"](around:${r},${lat},${lng});`,
        `node["amenity"="doctors"](around:${r},${lat},${lng});`,
        `node["healthcare"="hospital"](around:${r},${lat},${lng});`,
        `way["healthcare"="hospital"](around:${r},${lat},${lng});`,
        `node["healthcare"="clinic"](around:${r},${lat},${lng});`,
        `node["amenity"="police"](around:${r},${lat},${lng});`,
        `way["amenity"="police"](around:${r},${lat},${lng});`,
        `node["office"="government"](around:${r},${lat},${lng});`,
        `way["office"="government"](around:${r},${lat},${lng});`,
        `node["amenity"="townhall"](around:${r},${lat},${lng});`,
        `way["amenity"="townhall"](around:${r},${lat},${lng});`,
        `node["office"="administrative"](around:${r},${lat},${lng});`,
        `way["office"="administrative"](around:${r},${lat},${lng});`,
        `);`,
        `out center 120;`,
      ].join('');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: { 'User-Agent': 'NagarEkMobileApp/1.0 (contact@nagarek.gov.np)' },
          }
        );
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        elements = Array.isArray(data.elements) ? data.elements : [];
        success = true;
        break; // Successfully fetched, break the retry loop
      } catch (e: any) {
        clearTimeout(timer);
        console.warn(`[Overpass] Attempt ${attempt} failed:`, e?.message || e);
        if (attempt === maxRetries) {
          // All retries failed
          set({ loading: false });
          return dbPlaces;
        }
        // Wait 1.5 seconds before retrying
        await new Promise(res => setTimeout(res, 1500));
      }
    }

    const apiPlaces: Place[] = [];

    for (const item of elements) {
      const itemLat: number | undefined = item.lat ?? item.center?.lat;
      const itemLng: number | undefined = item.lon ?? item.center?.lon;
      if (itemLat == null || itemLng == null) continue;

      const d = distMeters(lat, lng, itemLat, itemLng);
      if (d > r) continue;

      const tags: Record<string, string> = item.tags ?? {};
      const category = classifyTags(tags);
      if (!category) continue;

      const name: string =
        tags.name ||
        tags['name:en'] ||
        tags['name:ne'] ||
        (category === 'hospital' ? 'Hospital' : category === 'police' ? 'Police Station' : 'Government Office');

      const addrParts: string[] = [];
      if (tags['addr:street']) addrParts.push(tags['addr:street']);
      if (tags['addr:suburb'] || tags['addr:quarter'])
        addrParts.push(tags['addr:suburb'] ?? tags['addr:quarter']);
      if (tags['addr:city'] || tags['addr:town'] || tags['addr:village'])
        addrParts.push(tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village']);
      const address = addrParts.join(', ') || tags['addr:full'] || '';

      apiPlaces.push({
        id: `${category}-${item.id}`,
        name,
        category,
        lat: itemLat,
        lng: itemLng,
        address,
        phone: tags.phone ?? tags['contact:phone'] ?? '',
        distance: fmtDist(d),
      });
    }

    // 3. Store new API places to Backend DB
    if (apiPlaces.length > 0) {
      try {
        fetch(`${API_URL}/map/places`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            places: apiPlaces.map(p => ({
              name: p.name,
              category: p.category,
              lat: p.lat,
              lng: p.lng,
            })),
          }),
        }).catch(err => console.warn('[Map DB Save] failed async:', err));
      } catch (err) {
        console.warn('[Map DB Save] call failed:', err);
      }
    }

    // 4. Combine uniquely
    const combined = [...apiPlaces];
    for (const dbP of dbPlaces) {
      const dup = combined.some(
        (u) => Math.abs(u.lat - dbP.lat) < 0.0001 && Math.abs(u.lng - dbP.lng) < 0.0001
      );
      if (!dup) {
        combined.push(dbP);
      }
    }

    combined.sort((a, b) => {
      const toM = (s: string) =>
        s.endsWith('km') ? parseFloat(s) * 1000 : parseInt(s, 10) || 9_999_999;
      return toM(a.distance) - toM(b.distance);
    });

    set({ places: combined, loading: false });
    return combined;
  }
}));
