import React, { useState, useEffect } from "react";

const SEARCH_TERMS = [
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

const ANIMATION_INTERVAL = 3000; // 3 seconds

export const AnimatedPlaceholder: React.FC = () => {
  const [currentTermIndex, setCurrentTermIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTermIndex((prevIndex) =>
        prevIndex === SEARCH_TERMS.length - 1 ? 0 : prevIndex + 1
      );
    }, ANIMATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center text-sm sm:text-base lg:text-lg text-gray-400 whitespace-nowrap">
      <span className="flex-shrink-0">Search for&nbsp;</span>
      <div className="relative h-5 sm:h-6 lg:h-7 overflow-hidden min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
        <div
          key={currentTermIndex}
          className="absolute left-0 top-0 whitespace-nowrap animate-slideUp text-sm sm:text-base lg:text-lg"
        >
          {SEARCH_TERMS[currentTermIndex]}
        </div>
      </div>
    </div>
  );
};