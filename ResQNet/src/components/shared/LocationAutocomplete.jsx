import { useEffect, useId, useRef, useState } from 'react';
import {
  normalizeSelectedLocation,
  reverseGeocodeLocation,
  searchLocations,
} from '../../lib/locationService';

function getHighlightedParts(text, query) {
  if (!query.trim()) return [text];

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'ig');
  return String(text || '').split(regex).filter(Boolean);
}

function Highlight({ text, query }) {
  return getHighlightedParts(text, query).map((part, index) => {
    const matches = part.toLowerCase() === query.trim().toLowerCase();

    return matches
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : <span key={`${part}-${index}`}>{part}</span>;
  });
}

export default function LocationAutocomplete({
  id,
  label = 'Location',
  value,
  selectedLocation,
  onInputChange,
  onSelect,
  onError,
  placeholder = 'Search location',
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listId = `${inputId}-listbox`;
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState('idle');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const wrapperRef = useRef(null);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (selectedLocation?.displayName === value) {
      const resetId = window.setTimeout(() => {
        setOpen(false);
        setStatus('idle');
        setSuggestions([]);
      }, 0);

      return () => window.clearTimeout(resetId);
    }

    const query = value.trim();
    if (query.length < 2) {
      const resetId = window.setTimeout(() => {
        setStatus('idle');
        setSuggestions([]);
        setOpen(false);
      }, 0);

      return () => window.clearTimeout(resetId);
    }

    const controller = new AbortController();
    const timerId = window.setTimeout(async () => {
      setStatus('loading');
      setOpen(true);

      try {
        const results = await searchLocations(query, { signal: controller.signal });
        setSuggestions(results);
        setActiveIndex(results.length > 0 ? 0 : -1);
        setStatus(results.length > 0 ? 'ready' : 'empty');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setSuggestions([]);
        setActiveIndex(-1);
        setStatus('error');
        setOpen(true);
        onErrorRef.current?.('Location service unavailable');
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timerId);
    };
  }, [selectedLocation?.displayName, value]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleSelect = (place) => {
    const normalized = normalizeSelectedLocation(place);
    setOpen(false);
    setStatus('idle');
    setSuggestions([]);
    setActiveIndex(-1);
    onSelect(normalized);
  };

  const handleKeyDown = (event) => {
    if (!open || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleSelect(suggestions[Math.max(activeIndex, 0)]);
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not available in this browser.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const place = await reverseGeocodeLocation(
            position.coords.latitude,
            position.coords.longitude,
          );
          handleSelect(place);
        } catch {
          onError?.('Location service unavailable');
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        onError?.('Unable to access your current location.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      },
    );
  };

  return (
    <div className="location-field" ref={wrapperRef}>
      <label className="field" htmlFor={inputId}>
        <span>{label}</span>
        <div className={`location-input-shell ${selectedLocation ? 'is-selected' : ''}`}>
          <input
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            autoComplete="off"
            id={inputId}
            onChange={(event) => onInputChange(event.target.value)}
            onFocus={() => {
              if (status !== 'idle') setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            value={value}
          />
          {selectedLocation && <span className="location-selected-dot" aria-hidden="true" />}
        </div>
      </label>

      <button
        className="location-use-button"
        disabled={geoLoading}
        onClick={handleUseCurrentLocation}
        type="button"
      >
        {geoLoading ? 'Locating...' : 'Use My Location'}
      </button>

      {open && (
        <div className="location-suggestions" id={listId} role="listbox">
          {status === 'loading' && (
            <div className="location-suggestions__state">Searching locations...</div>
          )}

          {status === 'empty' && (
            <div className="location-suggestions__state">No results found</div>
          )}

          {status === 'error' && (
            <div className="location-suggestions__state">Location service unavailable</div>
          )}

          {status === 'ready' && suggestions.map((place, index) => (
            <button
              aria-selected={index === activeIndex}
              className={`location-suggestion ${index === activeIndex ? 'is-active' : ''}`}
              id={`${listId}-${index}`}
              key={place.id}
              onClick={() => handleSelect(place)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              type="button"
            >
              <strong>
                <Highlight query={value} text={place.primary} />
              </strong>
              <span>
                <Highlight query={value} text={place.secondary || place.displayName} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
