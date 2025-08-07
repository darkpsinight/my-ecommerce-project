import React from "react";

interface PopularSearchesProps {
  onTermClick: (term: string) => void;
}

const POPULAR_TERMS = [
  "Steam Keys",
  "PlayStation",
  "Xbox Game Pass",
  "Netflix",
  "Spotify",
  "Google Play",
];

export const PopularSearches: React.FC<PopularSearchesProps> = ({ onTermClick }) => {
  return (
    <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
      <span className="text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-0">
        Popular:
      </span>
      {POPULAR_TERMS.map((term) => (
        <button
          key={term}
          type="button"
          onClick={() => onTermClick(term)}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-light-5 hover:bg-blue-light-4 text-blue-dark rounded-full transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          {term}
        </button>
      ))}
    </div>
  );
};