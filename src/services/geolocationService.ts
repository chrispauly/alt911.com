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
  message?: string;
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

export async function fetchClientSideSearchResults(query: string): Promise<LiveSearchResult | undefined> {
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgUrl);
    if (!res.ok) return { found: false, queryUsed: query };

    const data = await res.json();
    const textToSearch = [
      data.AbstractText || '',
      data.Heading || '',
      ...(data.RelatedTopics || []).map((t: any) => t.Text || ''),
    ].join(' ');

    const phoneRegex = /(?:\+?1[-. ]?)?\(?([2-9]\d{2})\)?[-. ]?([2-9]\d{2})[-. ]?(\d{4})/g;
    const match = phoneRegex.exec(textToSearch);

    if (match) {
      const area = match[1];
      const prefix = match[2];
      const line = match[3];

      if (!['800', '888', '877', '866', '855', '844', '833'].includes(area)) {
        return {
          found: true,
          phoneNumber: `(${area}) ${prefix}-${line}`,
          label: 'Municipal Police Line',
          snippet: data.AbstractText ? `📍 ${data.AbstractText.slice(0, 140)}` : undefined,
          queryUsed: query,
          confidence: 'High',
          source: 'DuckDuckGo Instant Answer API (Client-side)',
        };
      }
    }

    return {
      found: false,
      queryUsed: query,
      message: 'Direct client-side phone search links ready.',
    };
  } catch (err) {
    console.warn("Client-side search fetch notice:", err);
    return {
      found: false,
      queryUsed: query,
      message: 'Direct client-side search ready.',
    };
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

    const liveSearchResult = await fetchClientSideSearchResults(searchQueryString);

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
    const liveSearchResult = await fetchClientSideSearchResults(searchQueryString);

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
      fetchClientSideSearchResults(searchQueryString),
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
