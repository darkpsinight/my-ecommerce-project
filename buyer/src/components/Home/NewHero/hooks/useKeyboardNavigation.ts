import { useCallback } from "react";
import { SearchSuggestion } from "../types/SearchTypes";

interface UseKeyboardNavigationProps {
  showSuggestions: boolean;
  suggestions: SearchSuggestion[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  setShowSuggestions: (show: boolean) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const useKeyboardNavigation = ({
  showSuggestions,
  suggestions,
  selectedIndex,
  setSelectedIndex,
  setShowSuggestions,
  onSuggestionSelect,
  inputRef,
}: UseKeyboardNavigationProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(
            selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : selectedIndex
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : -1);
          break;

        case "Enter":
          if (selectedIndex >= 0) {
            e.preventDefault();
            onSuggestionSelect(suggestions[selectedIndex]);
          }
          break;

        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;

        default:
          break;
      }
    },
    [
      showSuggestions,
      suggestions,
      selectedIndex,
      setSelectedIndex,
      setShowSuggestions,
      onSuggestionSelect,
      inputRef,
    ]
  );

  return { handleKeyDown };
};