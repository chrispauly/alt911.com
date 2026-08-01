import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Phone,
  PhoneCall,
  Search,
  AlertTriangle,
  Info,
  Globe,
  Compass,
  Building2,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';
import {
  GLOBAL_N11_SERVICES,
  CITIES_WITH_311,
  OFFICIAL_311_LINKS
} from './data/n11Codes';
import type { GeoLocationResult } from './services/geolocationService';
import {
  getCurrentGPSPosition,
  reverseGeocode,
  geocodeSearchText
} from './services/geolocationService';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finder' | 'directory' | 'faq'>('finder');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationResult, setLocationResult] = useState<GeoLocationResult | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Theme State: OS preference -> Time of Day fallback (Day 7am-7pm = light, Night = dark)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    const hour = new Date().getHours();
    return hour >= 7 && hour < 19 ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    handleDetectLocation(true);
  }, []);

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDetectLocation = async (isInitial = false) => {
    setIsLocating(true);
    setLocationError(null);
    setActiveTab('finder');

    try {
      const coords = await getCurrentGPSPosition();
      const result = await reverseGeocode(coords.lat, coords.lng);
      setLocationResult(result);
      if (!isInitial) scrollToResults();
    } catch (err: any) {
      console.warn("GPS lookup issue:", err);
      if (!isInitial) {
        setLocationError("GPS location access was denied or timed out. Please type a city or zip code in the search bar.");
      } else {
        const defaultResult = await geocodeSearchText("Verona, WI");
        if (defaultResult) setLocationResult(defaultResult);
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setLocationError(null);
    setActiveTab('finder');

    const result = await geocodeSearchText(searchQuery.trim());
    if (result) {
      setLocationResult(result);
      scrollToResults();
    } else {
      setLocationError(`Could not find location for "${searchQuery}". Please check the spelling or try adding state/country (e.g., "Oregon, WI").`);
    }
    setIsSearching(false);
  };

  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <div className="brand-badge" style={{ marginBottom: 0 }}>
            <ShieldAlert size={14} />
            <span>alt911.com</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={13} color="var(--accent-amber)" /> : <Moon size={13} color="var(--accent-blue)" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <p className="subtitle">
          The Non-Emergency Dispatch Finder
        </p>
      </header>

      {/* Ultra-Compact Emergency Red Banner */}
      <div className="emergency-banner">
        <div className="emergency-banner-icon">
          <AlertTriangle size={18} />
        </div>
        <div className="emergency-banner-text">
          <strong>Life-threatening emergency?</strong> If someone is in immediate danger or a crime is in progress.
        </div>
        <a href="tel:911" className="emergency-banner-btn">
          <PhoneCall size={14} /> Call 911
        </a>
      </div>

      {/* Segmented Mobile 3-Column Navigation Tabs */}
      <nav className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'finder' ? 'active' : ''}`}
          onClick={() => setActiveTab('finder')}
        >
          <MapPin size={16} />
          <span>Finder</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Building2 size={16} />
          <span>311 Cities</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          <HelpCircle size={16} />
          <span>FAQ</span>
        </button>
      </nav>

      {/* Error Message */}
      {locationError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171',
          padding: '0.75rem 1rem',
          borderRadius: '0.85rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem'
        }}>
          <Info size={16} />
          <div>{locationError}</div>
        </div>
      )}

      {/* TAB 1: LOCATION FINDER */}
      {activeTab === 'finder' && locationResult && (
        <div>
          <div className="result-card" ref={resultsRef} style={{ scrollMarginTop: '0.75rem' }}>
            <div className="location-header">
              <div>
                <div className="location-badge">
                  <CheckCircle2 size={13} /> Location Identified
                </div>
                <h2 className="location-title">
                  {locationResult.address.city || locationResult.address.county || "Selected Area"}{" "}
                  {locationResult.address.state ? `, ${locationResult.address.state}` : ""}
                </h2>
                <p className="location-subtitle">
                  {locationResult.address.displayName || `Coordinates: ${locationResult.latitude.toFixed(4)}, ${locationResult.longitude.toFixed(4)}`}
                </p>
              </div>
            </div>

            {/* Phone Numbers Display Grid */}
            <div className="call-buttons-grid">
              {/* Primary Municipal Police Non-Emergency Card */}
              <div className="call-card call-card-primary">
                <div>
                  <div className="call-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <a
                      href={locationResult.searchQueryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: locationResult.liveSearchResult?.found ? 'var(--accent-emerald)' : 'var(--accent-blue)',
                        textDecoration: 'none',
                        fontWeight: 700
                      }}
                      title="Click to view full Google search results"
                    >
                      <ShieldAlert size={16} color={locationResult.liveSearchResult?.found ? "var(--accent-emerald)" : "var(--accent-blue)"} />
                      <span>{locationResult.address.city ? `${locationResult.address.city} Police Department` : "Google Result"}</span>
                      <ExternalLink size={13} style={{ opacity: 0.8 }} />
                    </a>
                  </div>

                  <div className="call-card-number" style={{ marginTop: '0.4rem' }}>
                    {locationResult.liveSearchResult?.phoneNumber || "Search Google for 10-digit number"}
                  </div>

                  {locationResult.liveSearchResult?.snippet && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.5rem', lineHeight: '1.5', fontWeight: 500 }}>
                      {locationResult.liveSearchResult.snippet}
                    </p>
                  )}
                </div>

                <div>
                  {locationResult.liveSearchResult?.phoneNumber ? (
                    <a
                      href={`tel:${locationResult.liveSearchResult.phoneNumber.replace(/[^0-9+]/g, '')}`}
                      className="btn-call btn-call-police"
                    >
                      <Phone size={18} /> Call {locationResult.liveSearchResult.phoneNumber}
                    </a>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <a
                        href={locationResult.searchQueryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-call btn-search-web"
                      >
                        <ExternalLink size={18} /> Search Google Directly on Phone
                      </a>
                      <a
                        href={locationResult.ddgSearchQueryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-call btn-search-web"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                      >
                        <Search size={16} /> Search DuckDuckGo on Phone
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary County Sheriff / Dispatch Card (Shown if available) */}
              {locationResult.liveSearchResult?.countyNumber && (
                <div className="call-card call-card-secondary">
                  <div>
                    <div className="call-card-title">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${locationResult.address.county || locationResult.address.city || ''} county sheriff non emergency phone number`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: 'var(--accent-blue)',
                          textDecoration: 'none',
                          fontWeight: 700
                        }}
                      >
                        <Compass size={16} color="var(--accent-blue)" />
                        <span>{locationResult.address.county ? `${locationResult.address.county} Sheriff & Dispatch` : "County Sheriff / Dispatch"}</span>
                        <ExternalLink size={13} style={{ opacity: 0.8 }} />
                      </a>
                    </div>

                    <div className="call-card-number" style={{ marginTop: '0.4rem' }}>
                      {locationResult.liveSearchResult.countyNumber}
                    </div>

                    {locationResult.liveSearchResult.countySnippet && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.5rem', lineHeight: '1.5', fontWeight: 500 }}>
                        {locationResult.liveSearchResult.countySnippet}
                      </p>
                    )}
                  </div>

                  <div>
                    <a
                      href={`tel:${locationResult.liveSearchResult.countyNumber.replace(/[^0-9+]/g, '')}`}
                      className="btn-call btn-call-police"
                      style={{ background: 'var(--accent-blue)' }}
                    >
                      <Phone size={18} /> Call {locationResult.liveSearchResult.countyNumber}
                    </a>
                  </div>
                </div>
              )}

              {/* 311 City Services (Rendered ONLY if current city participates in 311) */}
              {CITIES_WITH_311.some(
                (c) =>
                  c.name.toLowerCase() === (locationResult.address.city || '').toLowerCase() ||
                  c.name.toLowerCase() === (locationResult.address.town || '').toLowerCase() ||
                  c.name.toLowerCase() === (locationResult.address.village || '').toLowerCase()
              ) && (
                <div className="call-card">
                  <div>
                    <div className="call-card-title">
                      <Building2 size={16} color="var(--accent-teal)" />
                      311 Municipal & Non-Emergency
                    </div>
                    <div className="call-card-number">311</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                      311 Service active in {locationResult.address.city} for municipal non-emergencies.
                    </p>
                  </div>

                  <a href="tel:311" className="btn-call btn-call-311">
                    <Phone size={18} /> Call 311
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Primary Location Search Bar (Exclusively on Finder Tab) */}
          <div className="action-card" style={{ marginTop: '0' }}>
            <form onSubmit={handleSearchSubmit} className="search-bar-container">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search another city, zip, or area (e.g. Oregon WI)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-search-compact" disabled={isSearching}>
                {isSearching ? "Searching..." : "Lookup"}
              </button>
              <button
                type="button"
                onClick={() => handleDetectLocation(false)}
                className="btn-gps-compact"
                disabled={isLocating}
                title="Use current GPS location"
              >
                <Compass size={18} className={isLocating ? "pulse-icon" : ""} />
                <span>GPS</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: 311 PARTICIPATING CITIES DIRECTORY & N11 CODES (No Search Boxes) */}
      {activeTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 311 Cities Header */}
          <div className="qa-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <Building2 size={22} color="var(--accent-blue)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                311 Participating Municipalities Directory
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0.85rem' }}>
              In North America, dialing <strong>311</strong> connects you directly to local government services, non-emergency municipal dispatch, noise enforcement, and local reporting in participating cities.
            </p>

            {/* Official 311 Resource Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official 311 Reference Links:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
                {OFFICIAL_311_LINKS.map((link) => (
                  <a
                    key={link.title}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.82rem', color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                  >
                    {link.title} <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Grid of Cities supporting 311 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Major Cities with Active 311 Dispatch ({CITIES_WITH_311.length})
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
              {CITIES_WITH_311.map((city) => (
                <div
                  key={`${city.name}-${city.state}`}
                  className="call-card"
                  style={{ padding: '0.9rem 1rem' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {city.name}, {city.state}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', padding: '0.1rem 0.45rem', borderRadius: '999px', fontWeight: 700 }}>
                        {city.country}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Line: <strong>{city.phone}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <a
                      href={`tel:${city.phone.includes('311') ? '311' : city.phone.replace(/[^0-9+]/g, '')}`}
                      className="btn-call btn-call-311"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    >
                      <Phone size={14} /> Call 311
                    </a>

                    {city.url && (
                      <a
                        href={city.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-call btn-search-web"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        title="Official 311 Portal"
                      >
                        <ExternalLink size={14} /> Portal
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global N11 Standard Reference */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Standard N11 & International Short Codes
            </h3>
            <div className="n11-grid">
              {GLOBAL_N11_SERVICES.map((service) => (
                <div key={service.code} className="n11-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div className="n11-badge">{service.code}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{service.region}</span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{service.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      {service.purpose}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Availability: {service.availability}
                    </div>
                    <a href={service.callAction} className="btn-call btn-call-police">
                      <Phone size={16} /> Dial {service.code}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FAQ (No Search Boxes) */}
      {activeTab === 'faq' && (
        <div className="qa-section">
          <div className="qa-card">
            <h3 className="qa-question">
              <HelpCircle size={18} color="var(--accent-blue)" />
              What are the standard numbers for non-emergencies?
            </h3>
            <div className="qa-answer">
              <p>
                <strong>In North America, 311 serves as the universal non-emergency short code</strong> for municipal services and non-urgent police dispatch in participating cities.
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                Internationally, standard non-emergency short codes include:
              </p>
              <ul>
                <li><strong>United Kingdom:</strong> Dial <strong>101</strong> (Police) and <strong>111</strong> (NHS Medical).</li>
                <li><strong>Australia:</strong> Dial <strong>131 444</strong> (Police Assistance).</li>
                <li><strong>New Zealand:</strong> Dial <strong>105</strong> (Police Non-Emergency).</li>
                <li><strong>Germany:</strong> Dial <strong>116 117</strong> (Medical Non-Emergency).</li>
              </ul>
            </div>
          </div>

          <div className="qa-card">
            <h3 className="qa-question">
              <Globe size={18} color="var(--accent-teal)" />
              How does alt911.com find non-emergency numbers?
            </h3>
            <div className="qa-answer">
              <p>
                Whenever you search or share your GPS location, alt911.com automatically finds the verified 10-digit police dispatch line for your area with a 1-click call button.
              </p>
            </div>
          </div>

          <div className="qa-card">
            <h3 className="qa-question">
              <ShieldAlert size={18} color="var(--accent-amber)" />
              When should I call Non-Emergency vs. 911?
            </h3>
            <div className="qa-answer">
              <p><strong>Call Non-Emergency when:</strong></p>
              <ul>
                <li>A crime occurred in the past (e.g. overnight vehicle break-in).</li>
                <li>Property damage, noise complaints, or general police inquiries.</li>
              </ul>
              <p style={{ marginTop: '0.5rem' }}><strong>Call 911 when:</strong></p>
              <ul>
                <li>A crime is in progress or anyone is in immediate physical danger.</li>
                <li>Fire, medical emergency, or serious traffic crash.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} alt911.com — The Non-Emergency Dispatch Finder.</p>
        <div className="footer-links" style={{ marginTop: '0.4rem' }}>
          <span>Always dial 911 in life-threatening emergencies</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
