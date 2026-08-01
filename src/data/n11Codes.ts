export interface N11Service {
  code: string;
  name: string;
  purpose: string;
  region: string;
  availability: string;
  examples: string[];
  callAction: string;
}

export interface City311Info {
  name: string;
  state: string;
  country: string;
  phone: string;
  notes?: string;
  url?: string;
}

export const CITIES_WITH_311: City311Info[] = [
  { name: "New York City", state: "NY", country: "US", phone: "311 or (212) 639-9675", url: "https://portal.311.nyc.gov" },
  { name: "Los Angeles", state: "CA", country: "US", phone: "311 or (877) 275-5273", url: "https://myla311.lacity.org" },
  { name: "Chicago", state: "IL", country: "US", phone: "311 or (312) 746-6000", url: "https://311.chicago.gov" },
  { name: "Houston", state: "TX", country: "US", phone: "311 or (713) 884-3131", url: "https://www.houstontx.gov/311" },
  { name: "Phoenix", state: "AZ", country: "US", phone: "311 or (602) 262-6151", url: "https://www.phoenix.gov" },
  { name: "Philadelphia", state: "PA", country: "US", phone: "311 or (215) 686-8686", url: "https://www.phila.gov/311" },
  { name: "San Antonio", state: "TX", country: "US", phone: "311 or (210) 207-6000", url: "https://311.sanantonio.gov" },
  { name: "San Diego", state: "CA", country: "US", phone: "311 or (619) 531-2000", url: "https://www.sandiego.gov/get-it-done" },
  { name: "Dallas", state: "TX", country: "US", phone: "311 or (214) 670-3111", url: "https://dallascityhall.com" },
  { name: "San Jose", state: "CA", country: "US", phone: "311 or (408) 535-3500", url: "https://311.sanjoseca.gov" },
  { name: "Austin", state: "TX", country: "US", phone: "311 or (512) 974-2000", url: "https://www.austintexas.gov/department/311" },
  { name: "Fort Worth", state: "TX", country: "US", phone: "311 or (817) 392-1234", url: "https://www.fortworthtexas.gov/311" },
  { name: "Columbus", state: "OH", country: "US", phone: "311 or (614) 645-3111", url: "https://www.columbus.gov/311" },
  { name: "Charlotte", state: "NC", country: "US", phone: "311 or (704) 336-7600", url: "https://charlottenc.gov/311" },
  { name: "San Francisco", state: "CA", country: "US", phone: "311 or (415) 701-2311", url: "https://sf311.org" },
  { name: "Seattle", state: "WA", country: "US", phone: "311 or (206) 684-2489", url: "https://www.seattle.gov/find-it-fix-it-mobile-app" },
  { name: "Denver", state: "CO", country: "US", phone: "311 or (720) 913-1311", url: "https://www.denvergov.org/311" },
  { name: "Washington", state: "DC", country: "US", phone: "311 or (202) 737-4404", url: "https://311.dc.gov" },
  { name: "Boston", state: "MA", country: "US", phone: "311 or (617) 635-4500", url: "https://www.boston.gov/311" },
  { name: "Nashville", state: "TN", country: "US", phone: "311 or (615) 862-5000", url: "https://hub.nashville.gov" },
  { name: "Baltimore", state: "MD", country: "US", phone: "311 or (410) 396-3100", url: "https://balt311.baltimorecity.gov" },
  { name: "Miami", state: "FL", country: "US", phone: "311 or (305) 468-5900", url: "https://www.miamidade.gov/global/service.page?Mkey=service-311-contact-center" },
  { name: "Atlanta", state: "GA", country: "US", phone: "311 or (404) 546-0311", url: "https://www.atl311.com" },
  { name: "Minneapolis", state: "MN", country: "US", phone: "311 or (612) 673-3000", url: "https://www.minneapolismn.gov/311" },
  { name: "Portland", state: "OR", country: "US", phone: "311 or (503) 823-4000", url: "https://www.portland.gov/311" },
  { name: "Sacramento", state: "CA", country: "US", phone: "311 or (916) 264-5011", url: "https://www.cityofsacramento.gov/311" },
  { name: "Kansas City", state: "MO", country: "US", phone: "311 or (816) 513-1313", url: "https://www.kcmo.gov/talk-to-us/mykcmo" },
  { name: "Louisville", state: "KY", country: "US", phone: "311 or (502) 574-5000", url: "https://louisvilleky.gov/government/louisville-311" },
  { name: "Pittsburgh", state: "PA", country: "US", phone: "311 or (412) 255-2621", url: "https://pittsburghpa.gov/311" },
  { name: "New Orleans", state: "LA", country: "US", phone: "311 or (504) 658-2299", url: "https://nola311.org" },
  { name: "Toronto", state: "ON", country: "Canada", phone: "311 or (416) 392-2489", url: "https://www.toronto.ca/311" },
  { name: "Calgary", state: "AB", country: "Canada", phone: "311 or (403) 268-2489", url: "https://www.calgary.ca/311" },
  { name: "Vancouver", state: "BC", country: "Canada", phone: "311 or (604) 873-7000", url: "https://vancouver.ca/vanconnect.aspx" },
  { name: "Edmonton", state: "AB", country: "Canada", phone: "311 or (780) 442-5311", url: "https://www.edmonton.ca/311" },
  { name: "Ottawa", state: "ON", country: "Canada", phone: "311 or (613) 580-2400", url: "https://ottawa.ca/311" },
  { name: "Winnipeg", state: "MB", country: "Canada", phone: "311 or (877) 311-4974", url: "https://winnipeg.ca/311" }
];

export const OFFICIAL_311_LINKS = [
  { title: "FCC Official 311 Service Guide", url: "https://www.fcc.gov/general/3-1-1-search" },
  { title: "Open311 International Standard & API Directory", url: "https://www.open311.org" },
  { title: "Wikipedia 311 Coverage Directory", url: "https://en.wikipedia.org/wiki/311_(telephone_number)" }
];

export const GLOBAL_N11_SERVICES: N11Service[] = [
  {
    code: "311",
    name: "Municipal Non-Emergency & City Services",
    purpose: "Local government services, non-emergency police dispatch in participating cities, noise complaints, pothole reporting, municipal questions.",
    region: "United States & Canada (Select Cities)",
    availability: "Varies by municipality. If 311 is unassigned locally, call the 10-digit police line.",
    examples: ["New York City", "Chicago", "Los Angeles", "Houston", "Austin", "San Francisco"],
    callAction: "tel:311"
  },
  {
    code: "211",
    name: "Community & Social Services Lifeline",
    purpose: "Free, confidential access to local community resources: food banks, housing, utility assistance, disaster relief, mental health, and senior care.",
    region: "United States & Canada (95%+ Coverage)",
    availability: "24/7 across most of North America",
    examples: ["Food assistance", "Housing crisis", "Utility bill relief", "Veterans support"],
    callAction: "tel:211"
  },
  {
    code: "988",
    name: "Suicide & Crisis Lifeline",
    purpose: "Immediate free & confidential emotional support for anyone in suicidal crisis, mental health distress, or substance abuse emergency.",
    region: "United States & Canada",
    availability: "24/7 Call or Text",
    examples: ["Depression", "Mental health crisis", "Substance abuse help"],
    callAction: "tel:988"
  },
  {
    code: "101",
    name: "Police Non-Emergency (UK)",
    purpose: "Contact local police in England, Scotland, Wales, or Northern Ireland for crimes not currently in progress, property damage, or advice.",
    region: "United Kingdom",
    availability: "24/7 nationwide",
    examples: ["Car stolen while parked", "Vandalism noticed after the fact", "General police inquiries"],
    callAction: "tel:101"
  },
  {
    code: "111",
    name: "NHS Non-Emergency Medical (UK)",
    purpose: "Urgent medical advice when it's not a 999 life-threatening emergency but you need medical help quickly.",
    region: "United Kingdom",
    availability: "24/7 nationwide",
    examples: ["Unsure if you need A&E", "Urgent prescription advice", "Minor illness after hours"],
    callAction: "tel:111"
  },
  {
    code: "105",
    name: "Police Non-Emergency (New Zealand)",
    purpose: "Report things that have already happened to New Zealand Police where no one is in danger.",
    region: "New Zealand",
    availability: "24/7 nationwide",
    examples: ["Lost property", "Historical burglary", "Traffic complaints post-event"],
    callAction: "tel:105"
  },
  {
    code: "131 444",
    name: "Police Assistance Line (Australia)",
    purpose: "Report non-urgent crime or general inquiries to police anywhere in Australia.",
    region: "Australia",
    availability: "24/7 nationwide",
    examples: ["Break-in occurred hours ago", "Stolen bike", "Lost wallet"],
    callAction: "tel:131444"
  },
  {
    code: "116 117",
    name: "On-Call Medical Service (Germany)",
    purpose: "Non-emergency medical treatment and doctor home visits when medical practices are closed.",
    region: "Germany & EU Parts",
    availability: "Nights, weekends & holidays",
    examples: ["High fever on Sunday", "Severe non-emergency pain"],
    callAction: "tel:116117"
  },
  {
    code: "511",
    name: "Traffic & Travel Information",
    purpose: "Real-time highway updates, weather road conditions, lane closures, and transit information.",
    region: "United States & Canada",
    availability: "24/7",
    examples: ["Icy highway alerts", "Mountain pass conditions", "Roadwork delays"],
    callAction: "tel:511"
  },
  {
    code: "811",
    name: "Know What's Below (Call Before You Dig)",
    purpose: "Notify local utility companies before digging on your property to prevent hitting gas, water, or electric lines.",
    region: "United States & Canada",
    availability: "Business Hours / 24/7 Notice line",
    examples: ["Planting a tree", "Installing a fence", "Major landscaping"],
    callAction: "tel:811"
  }
];
