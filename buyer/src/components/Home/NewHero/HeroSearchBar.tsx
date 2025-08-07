"use client";
import React, { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";

// Types
import { HeroSearchBarProps, SearchSuggestion } from "./types/SearchTypes";

// Components
import {
  AnimatedPlaceholder,
  SuggestionsDropdown,
  PopularSearches,
} from "./components";

// Hooks
import {
  useSearchSuggestions,
  useKeyboardNavigation,
  useDropdownPosition,
} from "./hooks";

const HeroSearchBar: React.FC<HeroSearchBarProps> = ({ className = "" }) => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  // Refs
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Custom hooks
  const {
    suggestions,
    isLoading: isLoadingSuggestions,
    showSuggestions,
    setShowSuggestions,
  } = useSearchSuggestions(searchQuery);

  const { dropdownPosition, updateDropdownPosition } = useDropdownPosition(
    showSuggestions,
    formRef
  );

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);

    const searchParams = new URLSearchParams();
    searchParams.set("q", suggestion.text);
    router.push(`/products?${searchParams.toString()}`);
  };

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation({
    showSuggestions,
    suggestions,
    selectedIndex: selectedSuggestionIndex,
    setSelectedIndex: setSelectedSuggestionIndex,
    setShowSuggestions,
    onSuggestionSelect: handleSuggestionClick,
    inputRef,
  });

  // Handle form submission
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    const searchParams = new URLSearchParams();
    searchParams.set("q", searchQuery.trim());
    router.push(`/products?${searchParams.toString()}`);

    setTimeout(() => setIsLoading(false), 500);
  };

  // Handle popular search term click
  const handlePopularTermClick = (term: string) => {
    setSearchQuery(term);
    setShowSuggestions(false);

    const searchParams = new URLSearchParams();
    searchParams.set("q", term);
    router.push(`/products?${searchParams.toString()}`);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0 && searchQuery.trim().length >= 2) {
      updateDropdownPosition();
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        formRef.current &&
        !formRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`} ref={containerRef}>
      <div className="relative" style={{ zIndex: 1 }}>
        <form onSubmit={handleSearch} className="relative" ref={formRef}>
          <div className="flex items-stretch bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-3xl focus-within:shadow-3xl focus-within:border-blue-light min-w-0">
            {/* Search Icon */}
            <div className="flex items-center justify-center px-4 sm:px-6 text-gray-400 flex-shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Search Input - Takes all available space */}
            <div className="flex-1 min-w-0 relative">
              {!isFocused && !searchQuery && (
                <div className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 max-w-[calc(100%-2rem)]">
                  <AnimatedPlaceholder />
                </div>
              )}
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder=""
                className="w-full px-2 py-3 sm:py-4 text-base sm:text-lg placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 leading-normal"
                autoComplete="off"
              />
            </div>

            {/* Search Button - Fixed width */}
            <button
              type="submit"
              disabled={!searchQuery.trim() || isLoading}
              className="flex items-center justify-center px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue to-blue-dark text-white font-semibold transition-all duration-300 hover:from-blue-dark hover:to-blue disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex-shrink-0"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline text-sm sm:text-base">
                    Searching...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm sm:text-base">
                    Search
                  </span>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && (
          <SuggestionsDropdown
            suggestions={suggestions}
            isLoading={isLoadingSuggestions}
            searchQuery={searchQuery}
            selectedIndex={selectedSuggestionIndex}
            hoveredIndex={hoveredIndex}
            position={dropdownPosition}
            onSuggestionClick={handleSuggestionClick}
            onMouseEnter={setHoveredIndex}
            onMouseLeave={() => setHoveredIndex(-1)}
            suggestionsRef={suggestionsRef}
          />
        )}
      </div>

      {/* Popular Searches */}
      <PopularSearches onTermClick={handlePopularTermClick} />
    </div>
  );
};

export default HeroSearchBar;
