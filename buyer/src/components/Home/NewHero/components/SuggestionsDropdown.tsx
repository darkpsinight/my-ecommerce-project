import React from "react";
import { createPortal } from "react-dom";
import { SearchSuggestion, DropdownPosition } from "../types/SearchTypes";
import { SuggestionItem } from "./SuggestionItem";

interface SuggestionsDropdownProps {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  searchQuery: string;
  selectedIndex: number;
  hoveredIndex: number;
  position: DropdownPosition;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
  suggestionsRef: React.RefObject<HTMLDivElement>;
}

export const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
  suggestions,
  isLoading,
  searchQuery,
  selectedIndex,
  hoveredIndex,
  position,
  onSuggestionClick,
  onMouseEnter,
  onMouseLeave,
  suggestionsRef,
}) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-500">Loading suggestions...</span>
        </div>
      );
    }

    if (suggestions.length > 0) {
      return (
        <div className="py-2">
          {suggestions.map((suggestion, index) => {
            const suggestionKey = `${suggestion.type}-${suggestion.text}-${suggestion.category}`;
            
            return (
              <SuggestionItem
                key={suggestionKey}
                suggestion={suggestion}
                index={index}
                isSelected={index === selectedIndex}
                isHovered={hoveredIndex === index}
                onClick={onSuggestionClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              />
            );
          })}
        </div>
      );
    }

    if (searchQuery.trim().length >= 2) {
      return (
        <div className="py-4 px-4 text-center text-gray-500">
          No suggestions found for &quot;{searchQuery}&quot;
        </div>
      );
    }

    return null;
  };

  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={suggestionsRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: "320px", // 5 items × 64px per item = 320px
        zIndex: 2147483647, // Maximum safe integer for z-index
      }}
    >
      {renderContent()}
    </div>,
    document.body
  );
};