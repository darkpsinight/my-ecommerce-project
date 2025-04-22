// Common types for the Listings module

export interface Listing {
  _id: string;
  title: string;
  platform: string;
  codes?: Array<ListingCode>;
  price: number;
  status: ListingStatus;
  createdAt: Date | string | null;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  region?: string;
  quantity?: number;
  expirationDate?: string | Date | null;
}

export interface ListingCode {
  code: string;
  soldStatus: string;
  soldAt?: string | Date;
}

export type ListingStatus = 'active' | 'draft' | 'sold' | 'expired' | 'paused';

export interface ListingsTableProps {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface ListingsPaginationParams {
  page: number;
  limit: number;
}

export interface ListingsPaginationResponse {
  total: number;
  page: number;
  limit: number;
}

export interface ListingsResponse {
  success: boolean;
  message?: string;
  data?: {
    listings: Listing[];
    pagination?: ListingsPaginationResponse;
  };
}

export interface BulkActionMenuItem {
  action: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}
