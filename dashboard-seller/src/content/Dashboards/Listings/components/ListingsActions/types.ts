// Define interfaces for type safety
export interface FilterValues {
  category?: string;
  platform?: string;
  status?: string;
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string; // Kept as string for API compatibility
  endDate?: string; // Kept as string for API compatibility
  [key: string]: any;
}

export interface ActiveFilterDisplay {
  category?: string;
  platform?: string;
  status?: string;
  title?: string;
  minPrice?: string;
  maxPrice?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | undefined;
}

export interface ListingsActionsProps {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}
