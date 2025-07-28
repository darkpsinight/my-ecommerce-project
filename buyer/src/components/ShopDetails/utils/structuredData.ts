import { Product } from '@/types/product';

export const generateProductStructuredData = (product: Product) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.title || "Digital Product",
    description: product?.description || "High-quality digital product",
    image:
      product?.imgs?.previews?.[0] ||
      product?.thumbnailUrl ||
      "/images/products/placeholder.png",
    sku: product?.id?.toString() || "unknown",
    category: product?.categoryName || "Digital Products",
    brand: {
      "@type": "Organization",
      name: "Digital Marketplace",
    },
    offers: {
      "@type": "Offer",
      price: product?.discountedPrice || product?.price || 0,
      priceCurrency: "USD",
      availability:
        product?.quantityOfActiveCodes > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: product?.sellerMarketName || "Verified Seller",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "12",
    },
  };
};