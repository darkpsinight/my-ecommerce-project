import React from "react";
import { SearchSuggestion } from "../types/SearchTypes";
import { SuggestionImage } from "./SuggestionImage";

interface SuggestionItemProps {
  suggestion: SearchSuggestion;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (suggestion: SearchSuggestion) => void;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
}

export const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  index,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const getButtonClassName = (): string => {
    const baseClasses = "w-full px-4 py-3 text-left transition-all duration-200 flex items-center gap-3 border-l-4";
    
    if (isSelected) {
      return `${baseClasses} bg-blue-50 border-l-blue shadow-sm`;
    }
    
    if (isHovered) {
      return `${baseClasses} bg-gray-1 border-l-gray-200`;
    }
    
    return `${baseClasses} bg-transparent border-l-transparent hover:bg-gray-1 hover:border-l-gray-200`;
  };

  return (
    <button
      type="button"
      onClick={() => onClick(suggestion)}
      onMouseEnter={() => onMouseEnter(index)}
      onMouseLeave={onMouseLeave}
      className={getButtonClassName()}
    >
      <div className="flex-shrink-0" style={{ isolation: "isolate" }}>
        <SuggestionImage suggestion={suggestion} />
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
};