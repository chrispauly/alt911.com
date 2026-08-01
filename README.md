# alt911.com — The Non-Emergency Dispatch Finder

> **Instant 10-Digit Police Dispatch & Municipal 311 Lookup Service**

**alt911.com** is a web application designed to help individuals instantly locate local 10-digit non-emergency police dispatch lines, county sheriff numbers, and 311 municipal service channels based on their live GPS location or typed search queries (city, zip code, or address).

The goal of this service is to prevent misdialing 911 for non-life-threatening situations (such as noise complaints, historical property damage, parking issues, or lost items), keeping 911 operators clear for critical life-safety emergencies.

---

## 🚀 Key Features

* **📍 Live Location Detection**: One-tap GPS detection resolves your exact city, county, and state via reverse geocoding.
* **🔍 Automatic 10-Digit Lookup**: Queries live search APIs to retrieve verified local police dispatch and county sheriff phone numbers.
* **🏢 Dual City & County Line Display**: Shows both municipal police lines and regional/county 24/7 dispatch lines when both exist.
* **📍 Station Address & Hours Extraction**: Automatically parses verified police station street addresses and operating hours/24-7 availability without displaying unhelpful search blurbs.
* **🏢 Conditional 311 Municipal Card**: Automatically renders a direct 311 municipal call button when searching within one of the 36+ major participating North American cities.
* **🌓 Smart Dark / Light Mode**: Automatically adapts theme based on device OS preference and time-of-day (Light theme 7am–7pm / Dark theme 7pm–7am) with a manual header toggle.
* **📱 Mobile-First Responsive Design**: Optimized for touch devices with a 3-column navigation grid, high contrast WCAG-compliant colors, and smooth scroll positioning.
* **🌐 Universal N11 Directory**: Includes a guide for 211, 311, 511, 811, 988, UK 101/111, New Zealand 105, Australia 131 444, and Germany 116 117.

---

## 🛠️ How the Lookup Pipeline Works

```
[ User Input / GPS Coords ]
            │
            ▼
[ OpenStreetMap / Nominatim Reverse Geocoding ] ──► (Resolves City, County, State)
            │
            ▼
[ Server Middleware API: /api/search-phone ]
            │
            ├─► 1. Executes Live Search Query (DDG Lite / Bing Fallback API)
            ├─► 2. Sanitizes HTML & Decodes Unicode Entities
            ├─► 3. Regex Phone Parsing (10-digit North American Format)
            ├─► 4. Context Proximity Scoring Algorithm
            └─► 5. Structured Address & Office Hours Extraction
            │
            ▼
[ Render Verified Dispatch Cards & 1-Click Call Buttons ]
```

1. **Geocoding**: When GPS is triggered or a search term is submitted, the client queries the **OpenStreetMap Nominatim API** to resolve geographic coordinates to structured location metadata (City, County, State).
2. **Server Middleware Lookup (`/api/search-phone`)**: A Vite custom middleware intercepts search requests server-side to avoid CORS restrictions.
3. **Multi-Engine Search Fallback & Header Rotation**: The engine queries search endpoints using dynamic User-Agent rotation. If one search provider is rate-limited, it automatically fails over to secondary search engines.
4. **Phone Parsing & Proximity Scoring**: Raw HTML is stripped of script tags and decoded. A regular expression identifies standard 10-digit US/CA phone numbers `(XXX) XXX-XXXX`. Candidate numbers are scored based on proximity to keywords like `"non-emergency"`, `"dispatch"`, `"police"`, and `"sheriff"`, while penalizing social media posts, scam notices, or lost pet blurbs.
5. **Structured Snippet Extraction**: Snippets are scanned for verified street addresses (e.g. `📍 111 Lincoln St`) and station hours or 24/7 dispatch notes (e.g. `🕒 24/7 Non-Emergency County Dispatch`). If neither exists, snippet text is hidden for a clean UI.

---

## 📦 Tech Stack & Dependencies

* **Frontend Framework**: [React 18](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Build Tool & Server Middleware**: [Vite 8](https://vitejs.dev/)
* **Iconography**: [Lucide React](https://lucide.dev/)
* **Geocoding API**: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)
* **Styling**: Vanilla CSS with modern custom design tokens and dynamic Light/Dark mode state

---

## 🛠️ Installation & Local Development

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/alt911.git
   cd alt911
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your web browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 Security & Privacy

* **No User Tracking**: User location coordinates and search terms are processed ephemeral-only for reverse geocoding and phone matching. No user location data is stored or logged.
* **Input Sanitization**: All API search parameters are sanitized against null bytes, control characters, and capped at 150 characters to prevent SSRF and buffer abuse.
* **ReDoS Prevention**: Regular expression matching algorithms are non-backtracking and run in linear time $O(N)$.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for details.
