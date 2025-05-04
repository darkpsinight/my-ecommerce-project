import React from 'react';

// Define types locally to avoid import issues
export type ListingStatusType = 'active' | 'sold' | 'expired' | 'suspended' | 'draft';

// Interface for a product code
export interface ListingCode {
  code: string;
  soldStatus: string;
  soldAt?: string | Date;
}

// Main Listing interface for local use
export interface Listing {
  _id?: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string | { _id: string; name: string };
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
  quantityOfActiveCodes?: number;
  quantityOfAllCodes?: number;
  categoryName?: string;
}

export interface ListingFormProps {
  listing: Listing;
  onSubmit: (updatedListing: Partial<Listing>) => void;
  isSubmitting: boolean;
  section?: 'general' | 'codes' | 'tagsLanguages' | 'images';
  hideSubmitButton?: boolean;
  onCodesChange?: (codesCount: number) => void;
  categories?: any[];
  availablePlatforms?: string[];
}

export interface FormData {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  platform: string;
  region: string;
  isRegionLocked: boolean;
  expirationDate: Date | null;
  categoryId: string | { _id: string; name: string };
  status: ListingStatusType;
  autoDelivery: boolean;
  thumbnailUrl: string;
  tags: string[];
  supportedLanguages: string[];
  sellerNotes: string;
  codes:
    | Array<{ code: string; soldStatus: string; soldAt?: string | Date }>
    | undefined;
  newCode: string;
}

export interface FormErrors {
  title: string;
  description: string;
  price: string;
  platform: string;
  region: string;
  thumbnailUrl: string;
  codes: string;
  newCode: string;
}

export interface FormRef {
  validateForm: () => boolean;
  getFormData: () => Partial<Listing>;
}

export interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

export interface CodeItemProps {
  code: string;
  soldStatus: string;
  soldAt?: string | Date;
  onDelete: (code: string) => void;
}
