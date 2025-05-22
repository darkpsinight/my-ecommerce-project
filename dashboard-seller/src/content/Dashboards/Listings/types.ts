// Listing status enum
export enum ListingStatus {
  ACTIVE = 'active', // 'active' value remains the same in the backend, only UI display changes
  SOLD = 'sold',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  DRAFT = 'draft'
}

// String literal type for status values
export type ListingStatusType = 'active' | 'sold' | 'expired' | 'suspended' | 'draft';

// Interface for a product code
export interface ListingCode {
  codeId?: string; // UUID for the code
  code: string;
  soldStatus: string;
  soldAt?: string | Date;
  expirationDate?: string | Date | null;
}

// Main Listing interface
export interface Listing {
  _id?: string;
  externalId: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string | { _id: string; name: string }; // Can be string ID or populated object
  platform: string;
  region: string;
  isRegionLocked: boolean;
  expirationDate?: Date | string;
  supportedLanguages: string[];
  thumbnailUrl?: string;
  autoDelivery: boolean;
  tags: string[];
  sellerNotes?: string;
  status: ListingStatusType;
  sellerId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  codes?: ListingCode[];
  // Additional properties for API responses
  quantityOfActiveCodes?: number;
  quantityOfAllCodes?: number;
  categoryName?: string;
}

// API response pagination
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// API response for listings
export interface ListingsResponse {
  success: boolean;
  message?: string;
  data?: {
    listings: Listing[];
    pagination: Pagination;
  };
  listings?: Listing[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

// Props for the ListingsTable component
export interface ListingsTableProps {
  selected: string[];
  setSelected: (selected: string[]) => void;
}

// Bulk action menu item interface
export interface BulkActionMenuItem {
  action: string;
  label: string;
  icon: React.ReactNode;
  onClick?: (selected: string[]) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info';
  disabled?: boolean;
}
