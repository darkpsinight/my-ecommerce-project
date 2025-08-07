export interface SearchSuggestion {
  text: string;
  type: string;
  category: string;
  imageUrl?: string | null;
}

export interface SearchSuggestionsResponse {
  success: boolean;
  data: SearchSuggestion[];
}

export interface HeroSearchBarProps {
  className?: string;
}

export interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

export interface ImageCacheEntry {
  loaded: boolean;
  error: boolean;
}