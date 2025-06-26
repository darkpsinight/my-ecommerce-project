"use client";
import { useState, useEffect, FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface FlexibleSearchBarProps {
  className?: string;
  rightContent?: ReactNode;
  placeholder?: string;
  redirectUrl?: string;
  useAnimatedPlaceholder?: boolean;
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
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTermIndex((prevIndex) => 
          prevIndex === searchTerms.length - 1 ? 0 : prevIndex + 1
        );
        setIsAnimating(false);
      }, 300); // Half of animation duration
    }, 2500); // Change term every 2.5 seconds

    return () => clearInterval(interval);
  }, [searchTerms.length]);

  return (
    <div className="relative inline-block h-6 overflow-hidden">
      <span className="text-gray-400">Search for </span>
      <div className="relative inline-block w-32 h-6 overflow-hidden">
        <span 
          className={`absolute left-0 top-0 text-gray-400 transition-transform duration-600 ease-in-out ${
            isAnimating ? 'transform -translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'
          }`}
        >
          {searchTerms[currentTermIndex]}
        </span>
        <span 
          className={`absolute left-0 top-0 text-gray-400 transition-transform duration-600 ease-in-out ${
            isAnimating ? 'transform translate-y-0 opacity-100' : 'transform translate-y-full opacity-0'
          }`}
        >
          {searchTerms[currentTermIndex === searchTerms.length - 1 ? 0 : currentTermIndex + 1]}
        </span>
      </div>
      <span className="text-gray-400">...</span>
    </div>
  );
};

const FlexibleSearchBar: React.FC<FlexibleSearchBarProps> = ({ 
  className = "",
  rightContent,
  placeholder = "Search for Steam keys, PlayStation codes, Xbox Game Pass, gift cards...",
  redirectUrl = "http://localhost:3001/products",
  useAnimatedPlaceholder = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // Navigate to the specified URL with search query
    const searchParams = new URLSearchParams();
    searchParams.set('q', searchQuery.trim());
    
    router.push(`${redirectUrl}?${searchParams.toString()}`);
    
    // Reset loading state after a short delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-4 w-full">
        {/* Search bar container - takes all available space */}
        <div className="flex-1 min-w-0">
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
                {useAnimatedPlaceholder && !isFocused && !searchQuery && (
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
                  placeholder={useAnimatedPlaceholder ? "" : placeholder}
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
          </form>
        </div>
        
        {/* Right content - appears when provided and causes search bar to shrink */}
        {rightContent && (
          <div className="flex-shrink-0 transition-all duration-300 ease-in-out">
            {rightContent}
          </div>
        )}
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
              const event = { preventDefault: () => {} } as FormEvent;
              handleSearch(event);
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

export default FlexibleSearchBar;