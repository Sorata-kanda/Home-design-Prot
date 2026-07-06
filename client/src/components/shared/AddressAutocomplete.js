import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader } from 'lucide-react';

export default function AddressAutocomplete({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (searchText) => {
    if (!searchText || searchText.length < 3) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      // Using OpenStreetMap Nominatim API (Free, no auth required)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&addressdetails=1&limit=5&countrycodes=in`, {
        headers: {
          'Accept-Language': 'en-US,en' // Force English results
        }
      });
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text); // Keep parent form in sync with raw text
    setShowDropdown(true);

    // Debounce API calls
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      searchAddress(text);
    }, 500);
  };

  const handleSelect = (place) => {
    setQuery(place.display_name);
    setShowDropdown(false);
    
    const addr = place.address || {};
    
    // Extract structured data from Nominatim response
    const street = (addr.road || addr.suburb || addr.neighbourhood || place.display_name.split(',')[0]).trim();
    const city = (addr.city || addr.town || addr.village || addr.state_district || '').trim();
    const state = (addr.state || '').trim();
    const pincode = (addr.postcode || '').trim();

    onSelect({
      fullAddress: place.display_name,
      street,
      city,
      state,
      pincode
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding to turn coordinates into a written address
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { 'Accept-Language': 'en-US,en' }
          });
          const place = await res.json();
          if (place && !place.error) {
            handleSelect(place);
          } else {
            alert("Could not determine address from location.");
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          alert("Failed to get address.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        alert("Location access denied or failed.");
      }
    );
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query.length > 2) setShowDropdown(true); }}
          placeholder="Start typing your address..."
          required
          style={{ flex: 1, paddingRight: '2rem' }}
        />
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="btn btn-secondary"
          style={{ padding: '0 0.75rem' }}
          title="Use my current location"
          disabled={loading}
        >
          <MapPin size={18} />
        </button>
      </div>
      
      {loading && (
        <div style={{ position: 'absolute', right: '3.5rem', top: '50%', transform: 'translateY(-50%)' }}>
          <Loader size={16} color="var(--charcoal-light)" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid var(--border-strong)',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginTop: 4,
          zIndex: 100,
          maxHeight: 250,
          overflowY: 'auto'
        }}>
          {suggestions.map((place, i) => (
            <div
              key={i}
              onClick={() => handleSelect(place)}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <MapPin size={16} color="var(--stone)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: 'var(--charcoal)' }}>
                  {place.display_name.split(',')[0]}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>
                  {place.display_name.split(',').slice(1).join(',')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
