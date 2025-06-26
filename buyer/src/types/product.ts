export type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  discountedPrice: number;
  originalPrice?: number;
  categoryId?: string;
  categoryName?: string;
  platform?: string;
  region?: string;
  isRegionLocked?: boolean;
  supportedLanguages?: string[];
  thumbnailUrl?: string;
  autoDelivery?: boolean;
  tags?: string[];
  status?: string;
  reviews?: number;
  quantityOfActiveCodes?: number;
  quantityOfAllCodes?: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  // Seller information
  sellerId?: string;
  sellerName?: string;
  sellerMarketName?: string;
  isSellerVerified?: boolean;
};
