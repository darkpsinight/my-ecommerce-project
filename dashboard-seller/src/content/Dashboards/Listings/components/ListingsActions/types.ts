// Define interfaces for type safety
export interface FilterValues {
  category?: string;
  platform?: string;
  status?: string;
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
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
