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
  categoryId?: { _id: string; name: string } | string;
  categoryName?: string;
  region?: string;
  quantity?: number;
  quantityOfActiveCodes?: number;
  quantityOfAllCodes?: number;
  expirationDate?: string | Date | null;
  // Additional properties from API response
  originalPrice?: number;
  isRegionLocked?: boolean;
  supportedLanguages?: string[];
  thumbnailUrl?: string;
  autoDelivery?: boolean;
  tags?: string[];
  sellerId?: string;
  updatedAt?: Date | string | null;
  sellerNotes?: string;
  __v?: number;
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
