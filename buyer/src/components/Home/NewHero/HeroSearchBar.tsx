"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface HeroSearchBarProps {
  className?: string;
}

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
    "Minecraft codes"
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
    <div className="flex items-center text-base sm:text-lg text-gray-400">
      <span>Search for&nbsp;</span>
      <div className="relative h-6 sm:h-7 overflow-hidden min-w-[160px]">
        <div 
          key={currentTermIndex}
          className="absolute left-0 top-0 whitespace-nowrap animate-slideUp"
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
  const router = useRouter();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // For now, navigate to shop-with-sidebar page (fake implementation)
    // Later this will be replaced with dynamic search functionality
    const searchParams = new URLSearchParams();
    searchParams.set('q', searchQuery.trim());
    
    router.push(`http://localhost:3001/shop-with-sidebar?${searchParams.toString()}`);
    
    // Reset loading state after a short delay to prevent flickering
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <form onSubmit={handleSearch} className="relative">
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
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                <AnimatedPlaceholder />
              </div>
            )}
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
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
                <span className="hidden sm:inline text-sm sm:text-base">Searching...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm sm:text-base">Search</span>
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

        {/* Popular Searches */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
          <span className="text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-0">Popular:</span>
          {[
            "Steam Keys",
            "PlayStation", 
            "Xbox Game Pass",
            "Netflix",
            "Spotify",
            "Google Play"
          ].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setSearchQuery(term);
                const event = new Event('submit') as any;
                handleSearch(event);
              }}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-light-5 hover:bg-blue-light-4 text-blue-dark rounded-full transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              {term}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default HeroSearchBar;