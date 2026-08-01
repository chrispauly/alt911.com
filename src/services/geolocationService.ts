export interface LiveSearchResult {
  found: boolean;
  phoneNumber?: string;
  label?: string;
  snippet?: string;
  countyNumber?: string;
  countyLabel?: string;
  countySnippet?: string;
  queryUsed?: string;
  confidence?: string;
  source?: string;
}

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  address: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    displayName?: string;
  };
  liveSearchResult?: LiveSearchResult;
  searchQueryUrl: string;
  ddgSearchQueryUrl: string;
  isFallback: boolean;
}

export async function fetchLiveSearchResults(query: string): Promise<LiveSearchResult | undefined> {
  try {
    const res = await fetch(`/api/search-phone?query=${encodeURIComponent(query)}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("Live search API polling issue:", err);
    return undefined;
  }
}

export async function getCurrentGPSPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoLocationResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "alt911.com/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocode failed: ${response.statusText}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const cityName =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.municipality ||
      addr.county ||
      "";
    const countyName = addr.county || "";
    const stateName = addr.state || "";
    const countryName = addr.country || "United States";
    const postcode = addr.postcode || "";

    const searchQueryString = `${cityName || countyName || "local"} ${stateName} police non emergency phone number`;
    const queryTerm = encodeURIComponent(searchQueryString);

    const liveSearchResult = await fetchLiveSearchResults(searchQueryString);

    return {
      latitude: lat,
      longitude: lng,
      address: {
        city: cityName,
        county: countyName,
        state: stateName,
        country: countryName,
        postcode: postcode,
        displayName: data.display_name,
      },
      liveSearchResult,
      searchQueryUrl: `https://www.google.com/search?q=${queryTerm}`,
      ddgSearchQueryUrl: `https://duckduckgo.com/?q=${queryTerm}`,
      isFallback: false,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    const searchQueryString = `police non emergency number near ${lat},${lng}`;
    const liveSearchResult = await fetchLiveSearchResults(searchQueryString);

    return {
      latitude: lat,
      longitude: lng,
      address: {
        city: "Current Location",
        state: "",
        country: "",
        displayName: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      },
      liveSearchResult,
      searchQueryUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQueryString)}`,
      ddgSearchQueryUrl: `https://duckduckgo.com/?q=${encodeURIComponent(searchQueryString)}`,
      isFallback: true,
    };
  }
}

export async function geocodeSearchText(query: string): Promise<GeoLocationResult | null> {
  try {
    const searchQueryString = query.toLowerCase().includes("police")
      ? query
      : `${query} police non emergency phone number`;

    const [nominatimRes, liveSearchResult] = await Promise.all([
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "alt911.com/1.0",
          },
        }
      ).then((r) => (r.ok ? r.json() : null)),
      fetchLiveSearchResults(searchQueryString),
    ]);

    let lat = 0;
    let lng = 0;
    let addr: any = {};
    let displayName = query;

    if (nominatimRes && nominatimRes.length > 0) {
      const first = nominatimRes[0];
      lat = parseFloat(first.lat);
      lng = parseFloat(first.lon);
      addr = first.address || {};
      displayName = first.display_name;
    }

    const cityName =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.municipality ||
      query;
    const countyName = addr.county || "";
    const stateName = addr.state || "";
    const countryName = addr.country || "";
    const postcode = addr.postcode || "";

    return {
      latitude: lat,
      longitude: lng,
      address: {
        city: cityName,
        county: countyName,
        state: stateName,
        country: countryName,
        postcode: postcode,
        displayName: displayName,
      },
      liveSearchResult,
      searchQueryUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQueryString)}`,
      ddgSearchQueryUrl: `https://duckduckgo.com/?q=${encodeURIComponent(searchQueryString)}`,
      isFallback: false,
    };
  } catch (err) {
    console.error("Geocode search failed:", err);
    return null;
  }
}
