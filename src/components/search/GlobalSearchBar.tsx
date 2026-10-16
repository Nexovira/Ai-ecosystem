import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  Package,
  GraduationCap,
  Briefcase,
  UserCheck,
  Tag,
  Loader2,
  Trash2,
} from 'lucide-react';
import { AutocompleteSuggestion } from '../../types/search';

interface GlobalSearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  variant?: 'header' | 'hero' | 'standalone';
  className?: string;
  autoFocus?: boolean;
  onSearchSubmit?: (query: string) => void;
}

const RECENT_SEARCHES_KEY = 'nexovira_recent_searches';

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  initialQuery = '',
  placeholder = 'Search products, courses, services, experts...',
  variant = 'header',
  className = '',
  autoFocus = false,
  onSearchSubmit,
}) => {
  const { navigate } = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial query
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Global '/' keyboard shortcut to focus search input if not inside another input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.warn('Error fetching autocomplete suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const saveRecentSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // Ignore
    }
  };

  const handleSubmit = (finalQuery: string) => {
    const trimmed = finalQuery.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setIsOpen(false);

    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = query.trim().length >= 2 ? suggestions.length : recentSearches.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (query.trim().length >= 2 && suggestions[selectedIndex]) {
          const sug = suggestions[selectedIndex];
          saveRecentSearch(sug.text);
          setIsOpen(false);
          navigate(sug.destinationUrl);
          return;
        } else if (recentSearches[selectedIndex]) {
          const item = recentSearches[selectedIndex];
          setQuery(item);
          handleSubmit(item);
          return;
        }
      }
      handleSubmit(query);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const getTypeIcon = (type: AutocompleteSuggestion['type']) => {
    switch (type) {
      case 'PRODUCT':
        return <Package className="w-3.5 h-3.5 text-[#06C3F8]" />;
      case 'COURSE':
        return <GraduationCap className="w-3.5 h-3.5 text-[#0682F4]" />;
      case 'SERVICE':
        return <Briefcase className="w-3.5 h-3.5 text-[#26B2E2]" />;
      case 'EXPERT':
        return <UserCheck className="w-3.5 h-3.5 text-[#08E6F9]" />;
      case 'CATEGORY':
        return <Tag className="w-3.5 h-3.5 text-[#4DDEEA]" />;
      default:
        return <Search className="w-3.5 h-3.5 text-[#CCD2D9]" />;
    }
  };

  const getTypeBadgeClass = (type: AutocompleteSuggestion['type']) => {
    switch (type) {
      case 'PRODUCT':
        return 'text-[#06C3F8] bg-[#06C3F8]/10 border-[#06C3F8]/30';
      case 'COURSE':
        return 'text-[#0682F4] bg-[#0682F4]/10 border-[#0682F4]/30';
      case 'SERVICE':
        return 'text-[#26B2E2] bg-[#26B2E2]/10 border-[#26B2E2]/30';
      case 'EXPERT':
        return 'text-[#08E6F9] bg-[#08E6F9]/10 border-[#08E6F9]/30';
      case 'CATEGORY':
        return 'text-[#4DDEEA] bg-[#4DDEEA]/10 border-[#4DDEEA]/30';
      default:
        return 'text-[#CCD2D9] bg-[#CCD2D9]/10 border-[#CCD2D9]/30';
    }
  };

  const isHeader = variant === 'header';
  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(query);
        }}
        className={`relative flex items-center transition-all ${
          isHero
            ? 'h-14 bg-[#011B33] border-2 border-[#0682F4]/40 hover:border-[#08E6F9] focus-within:border-[#08E6F9] rounded-2xl shadow-2xl px-4'
            : isHeader
            ? 'h-10 bg-[#011B33]/80 border border-[#0682F4]/30 hover:border-[#0682F4]/60 focus-within:border-[#08E6F9] rounded-xl px-3'
            : 'h-12 bg-[#011B33] border border-[#0682F4]/40 hover:border-[#08E6F9] focus-within:border-[#08E6F9] rounded-xl px-3.5'
        }`}
      >
        <Search
          className={`shrink-0 text-[#CCD2D9]/70 ${
            isHero ? 'w-5 h-5 mr-3' : 'w-4 h-4 mr-2.5'
          }`}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-transparent text-white placeholder-[#CCD2D9]/40 focus:outline-none font-sans ${
            isHero ? 'text-base' : 'text-xs'
          }`}
        />

        {/* Clear Button / Loading Spinner */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#08E6F9]" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-[#CCD2D9]/60 hover:text-white hover:bg-[#01213D] transition cursor-pointer"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            isHeader && (
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#CCD2D9]/50 bg-[#01213D] border border-[#0682F4]/20 rounded">
                /
              </kbd>
            )
          )}

          <button
            type="submit"
            className={`cursor-pointer rounded-lg font-bold text-white transition flex items-center justify-center ${
              isHero
                ? 'px-4 py-2 bg-[#0682F4] hover:bg-[#05A9F7] text-xs shadow-md shadow-[#0682F4]/30'
                : 'p-1.5 text-[#08E6F9] hover:bg-[#0682F4]/20'
            }`}
            aria-label="Submit search"
          >
            {isHero ? 'Search' : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Autocomplete / Recent Searches Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#011B33] border border-[#0682F4]/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Case 1: Suggestions available when typing */}
          {query.trim().length >= 2 ? (
            <div>
              <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#08E6F9] border-b border-[#0682F4]/20 flex items-center justify-between">
                <span>Ecosystem Suggestions</span>
                {suggestions.length > 0 && <span>{suggestions.length} matches</span>}
              </div>

              {suggestions.length === 0 && !isLoading ? (
                <div className="px-4 py-6 text-center text-xs text-[#CCD2D9]/60">
                  No instant suggestions for &quot;{query}&quot;. Press <span className="text-white font-bold">Enter</span> to search the full ecosystem.
                </div>
              ) : (
                <div className="divide-y divide-[#0682F4]/10 max-h-72 overflow-y-auto">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        saveRecentSearch(sug.text);
                        setIsOpen(false);
                        navigate(sug.destinationUrl);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs transition flex items-center justify-between gap-3 cursor-pointer ${
                        selectedIndex === idx
                          ? 'bg-[#0682F4]/20 text-white'
                          : 'hover:bg-[#01213D] text-[#CCD2D9] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {getTypeIcon(sug.type)}
                        <span className="font-semibold truncate text-white">{sug.text}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getTypeBadgeClass(
                            sug.type
                          )}`}
                        >
                          {sug.type}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#CCD2D9]/40" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* View all results button */}
              <button
                type="button"
                onClick={() => handleSubmit(query)}
                className="w-full px-4 py-3 bg-[#01213D] hover:bg-[#0682F4]/20 border-t border-[#0682F4]/20 text-xs font-bold text-[#08E6F9] hover:text-white transition flex items-center justify-between cursor-pointer"
              >
                <span>View all ecosystem results for &quot;{query}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Case 2: Query is empty / short — Show Recent Searches & Discover Categories */
            <div className="p-3 space-y-3">
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#CCD2D9]/60 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#08E6F9]" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[10px] text-[#CCD2D9]/50 hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      Clear
                    </button>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {recentSearches.map((term, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          handleSubmit(term);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition flex items-center justify-between cursor-pointer ${
                          selectedIndex === idx
                            ? 'bg-[#0682F4]/20 text-white'
                            : 'hover:bg-[#01213D] text-[#CCD2D9] hover:text-white'
                        }`}
                      >
                        <span className="truncate">{term}</span>
                        <ArrowRight className="w-3 h-3 text-[#CCD2D9]/40" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Discovery Shortcuts */}
              <div>
                <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#CCD2D9]/60 block">
                  Quick Discover
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1 px-1">
                  {[
                    { label: 'Smart TV', type: 'PRODUCT' },
                    { label: 'Web Development', type: 'SERVICE' },
                    { label: 'Cloud Engineering', type: 'COURSE' },
                    { label: 'UI UX Design', type: 'EXPERT' },
                    { label: 'Laptop', type: 'PRODUCT' },
                    { label: 'Cybersecurity', type: 'SERVICE' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(item.label);
                        handleSubmit(item.label);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/20 text-[#CCD2D9] hover:text-[#08E6F9] transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Search className="w-2.5 h-2.5 text-[#08E6F9]" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
