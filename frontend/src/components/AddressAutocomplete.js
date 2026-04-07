import React, { useState, useEffect, useRef, useCallback } from 'react';

const AddressAutocomplete = ({ value, onChange, onAddressSelect, required, disabled }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSelected, setIsSelected] = useState(!!value);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);

  // Initialize Google Places services
  useEffect(() => {
    const initServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const div = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(div);
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        return true;
      }
      return false;
    };

    if (!initServices()) {
      const interval = setInterval(() => {
        if (initServices()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value || '');
      setIsSelected(!!value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((input) => {
    if (!autocompleteService.current || !input || input.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);

    // No type restriction — returns addresses, areas, neighborhoods, cities, etc.
    autocompleteService.current.getPlacePredictions(
      {
        input,
        sessionToken: sessionToken.current,
      },
      (predictions, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setIsOpen(true);
          setHighlightedIndex(-1);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      }
    );
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsSelected(false);

    // Notify parent of text change (not verified)
    if (onChange) onChange(val, false);

    // Debounce API calls (300ms)
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const parseAddressComponents = (components) => {
    const get = (type) => {
      const comp = components.find((c) => c.types.includes(type));
      return comp ? comp.long_name : '';
    };

    return {
      streetNumber: get('street_number'),
      route: get('route'),
      sublocality: get('sublocality_level_1') || get('sublocality_level_2') || get('sublocality'),
      city: get('locality') || get('sublocality_level_1') || get('administrative_area_level_2'),
      state: get('administrative_area_level_1'),
      country: get('country'),
      zipCode: get('postal_code'),
    };
  };

  const handleSelect = (prediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry'],
        sessionToken: sessionToken.current,
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const parsed = parseAddressComponents(place.address_components);
          // Build street from available parts (street number + route, or sublocality)
          const streetAddress = [parsed.streetNumber, parsed.route].filter(Boolean).join(' ') || parsed.sublocality || '';

          const addressData = {
            formattedAddress: place.formatted_address,
            streetAddress,
            city: parsed.city,
            state: parsed.state,
            country: parsed.country,
            zipCode: parsed.zipCode,
            latitude: place.geometry?.location?.lat(),
            longitude: place.geometry?.location?.lng(),
            addressVerified: true,
          };

          setInputValue(place.formatted_address);
          setIsSelected(true);
          setIsOpen(false);
          setSuggestions([]);

          // Refresh session token for next search
          if (window.google?.maps?.places) {
            sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
          }

          if (onAddressSelect) onAddressSelect(addressData);
          if (onChange) onChange(place.formatted_address, true);
        }
      }
    );
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.address-suggestion-item');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="address-autocomplete-wrapper">
      <div className="address-autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0 && !isSelected) setIsOpen(true); }}
          placeholder="Address, area, zip code, country"
          className={`address-autocomplete-input ${isSelected ? 'verified' : ''}`}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && <span className="address-loading-spinner" />}
        {isSelected && <span className="address-verified-badge" title="Verified address">&#10003;</span>}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="address-suggestions-dropdown" ref={dropdownRef} role="listbox">
          {suggestions.map((s, idx) => (
            <li
              key={s.place_id}
              className={`address-suggestion-item ${idx === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              role="option"
              aria-selected={idx === highlightedIndex}
            >
              <span className="suggestion-icon">&#128205;</span>
              <div className="suggestion-text">
                <span className="suggestion-main">{s.structured_formatting?.main_text}</span>
                <span className="suggestion-secondary">{s.structured_formatting?.secondary_text}</span>
              </div>
            </li>
          ))}
          <li className="address-powered-by">
            <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png" alt="Powered by Google" height="14" />
          </li>
        </ul>
      )}

      {!isSelected && inputValue.length > 0 && (
        <p className="address-autocomplete-hint">Select from dropdown for auto-fill, or fill address fields manually below.</p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
