import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import './SearchableSelect.css';

export const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  error = false,
  renderOption,
  clearable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(query)),
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  const toggleDropdown = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    setSearch('');
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={`custom-select-container ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`} ref={containerRef}>
      <div className="custom-select-trigger" onClick={toggleDropdown}>
        <div className="custom-select-value">
          {selectedOption ? <span className="selected-text">{selectedOption.label}</span> : <span className="placeholder-text">{placeholder}</span>}
        </div>
        <div className="custom-select-icons">
          {selectedOption && !disabled && clearable && (
            <button
              type="button"
              className="clear-icon"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={18} className={`chevron ${open ? 'open' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="custom-select-dropdown">
          <div className="custom-select-search-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="custom-select-search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          <ul className="custom-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li key={opt.value} className={`custom-select-option ${value === opt.value ? 'selected' : ''}`} onClick={() => !renderOption && handleSelect(opt.value)}>
                  {renderOption ? renderOption(opt, { close: () => { setOpen(false); setSearch(''); }, select: () => handleSelect(opt.value) }) : (
                    <>
                      <div className="opt-label">{opt.label}</div>
                      {opt.subLabel ? <div className="opt-sublabel">{opt.subLabel}</div> : null}
                    </>
                  )}
                </li>
              ))
            ) : (
              <li className="custom-select-empty">No options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
