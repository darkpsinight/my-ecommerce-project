import { useState, useEffect } from "react";
import { SearchSuggestion } from "../types/SearchTypes";
import { SearchService } from "../services/SearchService";

const DEBOUNCE_DELAY = 300;
const MIN_QUERY_LENGTH = 2;

export const useSearchSuggestions = (searchQuery: string) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const searchService = SearchService.getInstance();
        const response = await searchService.fetchSuggestions(searchQuery.trim(), 8);

        if (response.success) {
          setSuggestions(response.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Error in useSearchSuggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, DEBOUNCE_DELAY);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return {
    suggestions,
    isLoading,
    showSuggestions,
    setShowSuggestions,
  };
};