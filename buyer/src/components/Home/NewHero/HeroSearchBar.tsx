"use client";
import React, {
  useState,
  useEffect,
  FormEvent,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import axios from "axios";
import Image from "next/image";

interface HeroSearchBarProps {
  className?: string;
}

interface SearchSuggestion {
  text: string;
  type: string;
  category: string;
  imageUrl?: string | null;
}

interface SearchSuggestionsResponse {
  success: boolean;
  data: SearchSuggestion[];
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Global image cache to maintain image states across re-renders
const imageCache = new Map<string, { loaded: boolean; error: boolean }>();

// Animated Placeholder Component
const AnimatedPlaceholder = () => {
  const searchTerms = [
    "Steam keys",
    "PlayStation codes",
    "Xbox Game Pass",
    "Netflix cards",
    "Spotify codes",
    "Google Play cards",
    "iTunes gift cards",
    "Amazon vouchers",
    "Discord Nitro",
    "Minecraft codes",
  ];

  const [currentTermIndex, setCurrentTermIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTermIndex((prevIndex) =>
        prevIndex === searchTerms.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change term every 3 seconds

    return () => clearInterval(interval);
  }, [searchTerms.length]);

  return (
    <div className="flex items-center text-sm sm:text-base lg:text-lg text-gray-400 whitespace-nowrap">
      <span className="flex-shrink-0">Search for&nbsp;</span>
      <div className="relative h-5 sm:h-6 lg:h-7 overflow-hidden min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
        <div
          key={currentTermIndex}
          className="absolute left-0 top-0 whitespace-nowrap animate-slideUp text-sm sm:text-base lg:text-lg"
        >
          {searchTerms[currentTermIndex]}
        </div>
      </div>
    </div>
  );
};

const HeroSearchBar: React.FC<HeroSearchBarProps> = ({ className = "" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Function to calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (formRef.current) {
      const rect = formRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Update position when showing suggestions
  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();

      // Update position on scroll and resize
      const handleUpdate = () => updateDropdownPosition();
      window.addEventListener("scroll", handleUpdate);
      window.addEventListener("resize", handleUpdate);

      return () => {
        window.removeEventListener("scroll", handleUpdate);
        window.removeEventListener("resize", handleUpdate);
      };
    }
  }, [showSuggestions, updateDropdownPosition]);

  // Debounced function to fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setHoveredIndex(-1);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await axios.get<SearchSuggestionsResponse>(
          `${API_URL}/public/search-suggestions`,
          {
            params: { q: searchQuery.trim(), limit: 8 },
          }
        );

        if (response.data.success) {
          setSuggestions(response.data.data);
          setShowSuggestions(true);
          setHoveredIndex(-1);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);

    // Navigate to products page with selected suggestion
    const searchParams = new URLSearchParams();
    searchParams.set("q", suggestion.text);
    router.push(`/products?${searchParams.toString()}`);
  };

  // Handle form submission
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    // Navigate to products page with search query
    const searchParams = new URLSearchParams();
    searchParams.set("q", searchQuery.trim());

    router.push(`/products?${searchParams.toString()}`);

    // Reset loading state after a short delay to prevent flickering
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
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
    // Delay hiding suggestions to allow for clicks
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

  // Optimize ImageKit.io URLs for faster loading - memoized to prevent recreation
  const optimizeImageUrl = useCallback(
    (url: string | null | undefined): string | null => {
      if (!url) return null;

      // Check if it's an ImageKit.io URL
      if (url.includes("imagekit.io")) {
        // Add ImageKit transformations for small thumbnails
        // tr=f-webp,q-80 means:
        // - format: webp (smaller file size)
        // - quality: 80 (good balance of quality/size)
        // No width/height constraints to avoid zoom
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}tr=f-webp,q-80`;
      }

      return url;
    },
    []
  );

  // Component for suggestion image with fallback - Using global cache
  const SuggestionImage = React.memo(
    ({ suggestion }: { suggestion: SearchSuggestion }) => {
      const optimizedImageUrl = optimizeImageUrl(suggestion.imageUrl);
      const cacheKey = `${suggestion.text}-${optimizedImageUrl}`;

      // Initialize cache entry if it doesn't exist
      if (!imageCache.has(cacheKey)) {
        imageCache.set(cacheKey, { loaded: false, error: false });
      }

      const cachedState = imageCache.get(cacheKey)!;
      const [imageError, setImageError] = useState(cachedState.error);
      const [imageLoaded, setImageLoaded] = useState(cachedState.loaded);

      // Fallback component
      const FallbackImage = React.memo(() => {
        const getInitials = (text: string) => {
          return text
            .split(" ")
            .map((word) => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
        };

        const getBackgroundStyle = (type: string) => {
          switch (type) {
            case "title":
              return { backgroundColor: "#3C50E0", color: "#FFFFFF" }; // blue
            case "platform":
              return { backgroundColor: "#22AD5C", color: "#FFFFFF" }; // green
            case "tag":
              return { backgroundColor: "#8B5CF6", color: "#FFFFFF" }; // purple
            case "seller":
              return { backgroundColor: "#F27430", color: "#FFFFFF" }; // orange
            case "description":
              return { backgroundColor: "#6B7280", color: "#FFFFFF" }; // gray-6
            default:
              return { backgroundColor: "#3C50E0", color: "#FFFFFF" }; // blue
          }
        };

        return (
          <div
            style={{
              ...getBackgroundStyle(suggestion.type),
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              minWidth: "40px",
              minHeight: "40px",
            }}
          >
            {getInitials(suggestion.text)}
          </div>
        );
      });

      FallbackImage.displayName = "FallbackImage";

      if (!optimizedImageUrl || imageError) {
        return <FallbackImage />;
      }

      return (
        <div className="relative w-10 h-10">
          {/* Show fallback while loading */}
          {!imageLoaded && <FallbackImage />}

          {/* Actual image */}
          <Image
            src={optimizedImageUrl}
            alt={suggestion.text}
            width={40}
            height={40}
            className={`absolute inset-0 object-contain transition-opacity duration-200 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => {
              imageCache.set(cacheKey, { loaded: true, error: false });
              setImageLoaded(true);
            }}
            onError={() => {
              imageCache.set(cacheKey, { loaded: false, error: true });
              setImageError(true);
            }}
            unoptimized={true}
            priority={false}
          />
        </div>
      );
    }
  );

  SuggestionImage.displayName = "SuggestionImage";

  // Custom comparison function for SuggestionImage memo
  const arePropsEqual = (
    prevProps: { suggestion: SearchSuggestion },
    nextProps: { suggestion: SearchSuggestion }
  ) => {
    const isEqual =
      prevProps.suggestion.text === nextProps.suggestion.text &&
      prevProps.suggestion.type === nextProps.suggestion.type &&
      prevProps.suggestion.category === nextProps.suggestion.category &&
      prevProps.suggestion.imageUrl === nextProps.suggestion.imageUrl;

    return isEqual;
  };

  // Apply custom comparison to SuggestionImage
  const MemoizedSuggestionImage = React.memo(SuggestionImage, arePropsEqual);

  // Render suggestions directly without memoization to avoid recreation issues
  const renderSuggestions = () => {
    return suggestions.map((suggestion, index) => {
      const suggestionKey = `${suggestion.type}-${suggestion.text}-${suggestion.category}`;

      return (
        <button
          key={suggestionKey}
          type="button"
          onClick={() => handleSuggestionClick(suggestion)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(-1)}
          className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center gap-3 border-l-4 ${
            index === selectedSuggestionIndex
              ? "bg-blue-50 border-l-blue shadow-sm"
              : hoveredIndex === index
              ? "bg-gray-1 border-l-gray-200"
              : "bg-transparent border-l-transparent hover:bg-gray-1 hover:border-l-gray-200"
          }`}
        >
          <div className="flex-shrink-0" style={{ isolation: "isolate" }}>
            <MemoizedSuggestionImage suggestion={suggestion} />
          </div>
          <div className="flex-1 min-w-0 ml-3">
            <div className="text-gray-900 font-medium truncate">
              {suggestion.text}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {suggestion.category}
            </div>
          </div>
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      );
    });
  };

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

        {/* Autocomplete Suggestions Dropdown - Rendered as portal */}
        {showSuggestions &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              ref={suggestionsRef}
              className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 overflow-y-auto"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: "320px", // 5 items × 64px per item = 320px
                zIndex: 2147483647, // Maximum safe integer for z-index
              }}
            >
              {isLoadingSuggestions ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-500">
                    Loading suggestions...
                  </span>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">{renderSuggestions()}</div>
              ) : searchQuery.trim().length >= 2 ? (
                <div className="py-4 px-4 text-center text-gray-500">
                  No suggestions found for &quot;{searchQuery}&quot;
                </div>
              ) : null}
            </div>,
            document.body
          )}
      </div>

      {/* Popular Searches - Moved outside the relative container */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
        <span className="text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-0">
          Popular:
        </span>
        {[
          "Steam Keys",
          "PlayStation",
          "Xbox Game Pass",
          "Netflix",
          "Spotify",
          "Google Play",
        ].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setSearchQuery(term);
              setShowSuggestions(false);
              // Navigate immediately
              const searchParams = new URLSearchParams();
              searchParams.set("q", term);
              router.push(`/products?${searchParams.toString()}`);
            }}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-light-5 hover:bg-blue-light-4 text-blue-dark rounded-full transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroSearchBar;
