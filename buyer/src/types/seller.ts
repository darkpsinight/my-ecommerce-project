export interface SocialMediaLink {
  platform: string;
  url: string;
}

export interface Badge {
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface EnterpriseDetails {
  companyName?: string;
  website?: string;
  socialMedia: SocialMediaLink[];
}

export interface Seller {
  _id?: string;
  nickname: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  marketName?: string;
  about?: string;
  badges: Badge[];
  enterpriseDetails: EnterpriseDetails;
  externalId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SellersResponse {
  sellers: Seller[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SellerFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'newest' | 'oldest' | 'name';
}