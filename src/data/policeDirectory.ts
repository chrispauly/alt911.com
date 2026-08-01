export interface LocalPoliceInfo {
  city: string;
  state: string;
  county?: string;
  policePhone: string;
  policeLabel?: string;
  policeSnippet?: string;
  countyPhone?: string;
  countyLabel?: string;
  countySnippet?: string;
}

export const DIRECTORY_POLICE_NUMBERS: LocalPoliceInfo[] = [
  {
    city: "Verona",
    state: "WI",
    county: "Dane County",
    policePhone: "(608) 845-7623",
    policeLabel: "Verona Police Department",
    policeSnippet: "📍 111 Lincoln St, Verona, WI 53593 · Mon-Fri 8:00 AM - 4:30 PM",
    countyPhone: "(608) 255-2345",
    countyLabel: "Dane County 24/7 Non-Emergency Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency County Dispatch for Dane County",
  },
  {
    city: "Two Rivers",
    state: "WI",
    county: "Manitowoc County",
    policePhone: "(920) 793-1191",
    policeLabel: "Two Rivers Police Department",
    policeSnippet: "📍 1717 E Park St, Two Rivers, WI 54241 · Mon-Thu 7:30 AM - 4:30 PM, Fri 7:30 AM - 11:30 AM",
    countyPhone: "(920) 686-7200",
    countyLabel: "Manitowoc County 24/7 Joint Dispatch Center",
    countySnippet: "🕒 24/7 Non-Emergency Police Request for Officer & Dispatch",
  },
  {
    city: "Manitowoc",
    state: "WI",
    county: "Manitowoc County",
    policePhone: "(920) 686-6550",
    policeLabel: "Manitowoc Police Department",
    policeSnippet: "📍 910 S 9th St, Manitowoc, WI 54220",
    countyPhone: "(920) 686-7200",
    countyLabel: "Manitowoc County 24/7 Joint Dispatch Center",
    countySnippet: "🕒 24/7 Non-Emergency Police Request for Officer & Dispatch",
  },
  {
    city: "Madison",
    state: "WI",
    county: "Dane County",
    policePhone: "(608) 255-2345",
    policeLabel: "Madison Police Non-Emergency Dispatch",
    policeSnippet: "📍 211 S Carroll St, Madison, WI 53703 · 24/7 Non-Emergency Dispatch",
    countyPhone: "(608) 255-2345",
    countyLabel: "Dane County 24/7 Non-Emergency Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency County Dispatch",
  },
  {
    city: "Fitchburg",
    state: "WI",
    county: "Dane County",
    policePhone: "(608) 270-4300",
    policeLabel: "Fitchburg Police Department",
    policeSnippet: "📍 5520 Lacy Rd, Fitchburg, WI 53711",
    countyPhone: "(608) 255-2345",
    countyLabel: "Dane County 24/7 Non-Emergency Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency County Dispatch",
  },
  {
    city: "Sun Prairie",
    state: "WI",
    county: "Dane County",
    policePhone: "(608) 837-7336",
    policeLabel: "Sun Prairie Police Department",
    policeSnippet: "📍 300 E Main St, Sun Prairie, WI 53590",
    countyPhone: "(608) 255-2345",
    countyLabel: "Dane County 24/7 Non-Emergency Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency County Dispatch",
  },
  {
    city: "Middleton",
    state: "WI",
    county: "Dane County",
    policePhone: "(608) 838-3151",
    policeLabel: "Middleton Police Department",
    policeSnippet: "📍 7341 Donna Dr, Middleton, WI 53562",
    countyPhone: "(608) 255-2345",
    countyLabel: "Dane County 24/7 Non-Emergency Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency County Dispatch",
  },
  {
    city: "Oregon",
    state: "WI",
    county: "Dane County",
    policePhone: "(608) 835-3111",
    policeLabel: "Oregon Police Department",
    policeSnippet: "📍 383 S Spring St, Oregon, WI 53575",
    countyPhone: "(608) 255-2345",
    countyLabel: "Dane County 24/7 Non-Emergency Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency County Dispatch",
  },
  {
    city: "Milwaukee",
    state: "WI",
    county: "Milwaukee County",
    policePhone: "(414) 935-7401",
    policeLabel: "Milwaukee Police Non-Emergency Line",
    policeSnippet: "📍 749 W State St, Milwaukee, WI 53233 · 24/7 Non-Emergency Dispatch",
    countyPhone: "(414) 278-4788",
    countyLabel: "Milwaukee County Sheriff Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency Sheriff Line",
  },
  {
    city: "Green Bay",
    state: "WI",
    county: "Brown County",
    policePhone: "(920) 448-3200",
    policeLabel: "Green Bay Police & Brown County Dispatch",
    policeSnippet: "📍 307 S Adams St, Green Bay, WI 54301 · 24/7 Non-Emergency Dispatch",
    countyPhone: "(920) 448-4200",
    countyLabel: "Brown County Sheriff Department",
    countySnippet: "🕒 24/7 Non-Emergency Sheriff Line",
  },
  {
    city: "Appleton",
    state: "WI",
    county: "Outagamie County",
    policePhone: "(920) 832-5500",
    policeLabel: "Appleton Police Department",
    policeSnippet: "📍 222 S Walnut St, Appleton, WI 54911",
    countyPhone: "(920) 832-5000",
    countyLabel: "Outagamie County Sheriff",
    countySnippet: "🕒 24/7 Non-Emergency Dispatch",
  },
  {
    city: "Oshkosh",
    state: "WI",
    county: "Winnebago County",
    policePhone: "(920) 236-5700",
    policeLabel: "Oshkosh Police Department",
    policeSnippet: "📍 420 Jackson St, Oshkosh, WI 54901",
    countyPhone: "(920) 236-7300",
    countyLabel: "Winnebago County Sheriff",
    countySnippet: "🕒 24/7 Non-Emergency Dispatch",
  },
  {
    city: "Janesville",
    state: "WI",
    county: "Rock County",
    policePhone: "(608) 757-2244",
    policeLabel: "Janesville Police & Rock County Dispatch",
    policeSnippet: "📍 100 N Jackson St, Janesville, WI 53548",
    countyPhone: "(608) 757-8000",
    countyLabel: "Rock County Sheriff Department",
    countySnippet: "🕒 24/7 Non-Emergency Dispatch",
  },
  {
    city: "Kenosha",
    state: "WI",
    county: "Kenosha County",
    policePhone: "(262) 656-1234",
    policeLabel: "Kenosha Police Non-Emergency Line",
    policeSnippet: "📍 1000 55th St, Kenosha, WI 53140",
    countyPhone: "(262) 605-5100",
    countyLabel: "Kenosha County Sheriff",
    countySnippet: "🕒 24/7 Non-Emergency Dispatch",
  },
  {
    city: "Racine",
    state: "WI",
    county: "Racine County",
    policePhone: "(262) 886-2300",
    policeLabel: "Racine County Non-Emergency Dispatch",
    policeSnippet: "📍 730 Center St, Racine, WI 53403",
    countyPhone: "(262) 636-3822",
    countyLabel: "Racine County Sheriff",
    countySnippet: "🕒 24/7 Non-Emergency Dispatch",
  },
  {
    city: "Chicago",
    state: "IL",
    county: "Cook County",
    policePhone: "311 or (312) 746-6000",
    policeLabel: "Chicago Police Non-Emergency Dispatch",
    policeSnippet: "📍 3510 S Michigan Ave, Chicago, IL 60653 · 24/7 311 Non-Emergency Service",
    countyPhone: "(312) 603-6444",
    countyLabel: "Cook County Sheriff Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency Sheriff Line",
  },
  {
    city: "Minneapolis",
    state: "MN",
    county: "Hennepin County",
    policePhone: "311 or (612) 673-3000",
    policeLabel: "Minneapolis Police Non-Emergency Line",
    policeSnippet: "📍 350 S 5th St, Minneapolis, MN 55415 · 24/7 Non-Emergency Service",
    countyPhone: "(612) 348-3744",
    countyLabel: "Hennepin County Sheriff",
    countySnippet: "🕒 24/7 Non-Emergency Sheriff Line",
  },
  {
    city: "Saint Paul",
    state: "MN",
    county: "Ramsey County",
    policePhone: "(651) 291-1111",
    policeLabel: "St. Paul Police Non-Emergency Dispatch",
    policeSnippet: "📍 367 Grove St, St Paul, MN 55101 · 24/7 Non-Emergency Dispatch",
    countyPhone: "(651) 266-9300",
    countyLabel: "Ramsey County Sheriff",
    countySnippet: "🕒 24/7 Non-Emergency Sheriff Line",
  },
  {
    city: "Chilton",
    state: "WI",
    county: "Calumet County",
    policePhone: "(920) 849-2222",
    policeLabel: "Chilton Police Department",
    policeSnippet: "📍 42 School St, Chilton, WI 53014",
    countyPhone: "(920) 849-2335",
    countyLabel: "Calumet County Sheriff Dispatch",
    countySnippet: "🕒 24/7 Non-Emergency Police Request for Officer & Dispatch Center",
  }
];

export function lookupLocalPoliceDirectory(cityName?: string, stateName?: string, countyName?: string): LocalPoliceInfo | undefined {
  if (!cityName && !countyName) return undefined;

  const cleanCity = (cityName || '').split(',')[0].trim().toLowerCase();
  const cleanCounty = (countyName || '').replace(/\b(county|parish|borough|municipality)\b/gi, '').trim().toLowerCase();
  const cleanState = (stateName || '').trim().toLowerCase();

  return DIRECTORY_POLICE_NUMBERS.find((entry) => {
    const cityMatch = entry.city.toLowerCase() === cleanCity || (entry.county && entry.county.toLowerCase() === cleanCity);
    const countyMatch = cleanCounty && (entry.city.toLowerCase() === cleanCounty || (entry.county && entry.county.toLowerCase().includes(cleanCounty)));
    const stateMatch = !cleanState || entry.state.toLowerCase() === cleanState || cleanState.includes(entry.state.toLowerCase()) || entry.state.toLowerCase().includes(cleanState);
    return (cityMatch || countyMatch) && stateMatch;
  }) || DIRECTORY_POLICE_NUMBERS.find((entry) => {
    const cityMatch = entry.city.toLowerCase() === cleanCity || (entry.county && entry.county.toLowerCase() === cleanCity);
    const countyMatch = cleanCounty && (entry.city.toLowerCase() === cleanCounty || (entry.county && entry.county.toLowerCase().includes(cleanCounty)));
    return cityMatch || countyMatch;
  });
}
