import React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, multiplyCurrency } from "@/utils/currency";

interface CartItem {
  id: string;
  listingId: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  sellerId: string;
  listingSnapshot?: {
    category?: string;
    subcategory?: string;
    platform?: string;
    region?: string;
  };
}

interface DigitalOrderSummaryProps {
  cartItems: CartItem[];
  totalPrice: number;
}

const DigitalOrderSummary: React.FC<DigitalOrderSummaryProps> = ({
  cartItems,
  totalPrice,
}) => {
  // Debug logging (can be removed in production)
  console.log('DigitalOrderSummary - Cart Items:', cartItems);

  return (
    <div className="bg-white shadow-1 rounded-[10px]">
      <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
        <h3 className="font-medium text-xl text-dark">Order Summary</h3>
      </div>

      <div className="pt-2.5 pb-6 sm:pb-8.5 px-4 sm:px-6 lg:px-8.5">
        {/* Header */}
        <div className="flex items-center justify-between py-4 sm:py-5 border-b border-gray-3">
          <div>
            <h4 className="font-medium text-dark text-sm sm:text-base">Digital Code</h4>
          </div>
          <div>
            <h4 className="font-medium text-dark text-right text-sm sm:text-base">Price</h4>
          </div>
        </div>

        {/* Cart Items */}
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-5 border-b border-gray-3 gap-3 sm:gap-0"
          >
            <div className="flex items-center gap-3 flex-1">
              {/* Product Image */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                {item.imgs?.thumbnails?.[0] || item.imgs?.previews?.[0] ? (
                  <Image
                    src={item.imgs.thumbnails?.[0] || item.imgs.previews?.[0] || 'https://via.placeholder.com/48x48/f3f4f6/6b7280?text=IMG'}
                    alt={item.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Image failed to load:', e.currentTarget.src);
                      console.log('Item images:', item.imgs);
                      // Fallback to placeholder
                      e.currentTarget.src = 'https://via.placeholder.com/48x48/f3f4f6/6b7280?text=IMG';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10a1 1 0 01-1 1H8a1 1 0 01-1-1V4m0 0H5a1 1 0 00-1 1v10a1 1 0 001 1h2m0 0v2a1 1 0 001 1h8a1 1 0 001-1v-2m0 0H9a1 1 0 01-1-1V8a1 1 0 011-1h6a1 1 0 011 1v5a1 1 0 01-1 1z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <p className="text-dark font-medium text-xs sm:text-sm leading-tight">
                  <span className="block sm:hidden">
                    {item.title.length > 25 ? `${item.title.substring(0, 25)}...` : item.title}
                  </span>
                  <span className="hidden sm:block">
                    {item.title.length > 30 ? `${item.title.substring(0, 30)}...` : item.title}
                  </span>
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Qty: {item.quantity} × {formatPrice(item.discountedPrice)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Instant Delivery</span>
                    <span className="sm:hidden">Instant</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="text-left sm:text-right">
              <p className="text-dark font-medium text-sm sm:text-base">
                {formatPrice(multiplyCurrency(item.discountedPrice, item.quantity))}
              </p>
              {item.price !== item.discountedPrice && (
                <p className="text-gray-500 text-xs sm:text-sm line-through">
                  {formatPrice(multiplyCurrency(item.price, item.quantity))}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-5 gap-2 sm:gap-0">
          <div>
            <p className="font-semibold text-base sm:text-lg text-dark">Total</p>
            <p className="text-xs sm:text-sm text-gray-500">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} digital code(s)
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-semibold text-base sm:text-lg text-dark">
              {formatPrice(totalPrice)}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">USD</p>
          </div>
        </div>

        {/* Digital Delivery Info */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-light-6 border border-green-light-4 rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-dark text-xs sm:text-sm mb-1">
                Instant Digital Delivery
              </h4>
              <p className="text-green-dark text-xs leading-relaxed">
                Your codes will be available immediately after payment confirmation. 
                Access them from your{" "}
                <Link href="/library" className="font-bold text-green-dark hover:text-green-600 underline">
                  Digital library
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalOrderSummary;
