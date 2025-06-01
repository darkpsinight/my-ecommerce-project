import React from "react";
import Image from "next/image";

interface CartItem {
  id: number;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
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
  return (
    <div className="bg-white shadow-1 rounded-[10px]">
      <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
        <h3 className="font-medium text-xl text-dark">Order Summary</h3>
      </div>

      <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
        {/* Header */}
        <div className="flex items-center justify-between py-5 border-b border-gray-3">
          <div>
            <h4 className="font-medium text-dark">Digital Code</h4>
          </div>
          <div>
            <h4 className="font-medium text-dark text-right">Price</h4>
          </div>
        </div>

        {/* Cart Items */}
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-5 border-b border-gray-3"
          >
            <div className="flex items-center gap-3 flex-1">
              {/* Product Image */}
              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                {item.imgs?.thumbnails?.[0] ? (
                  <Image
                    src={item.imgs.thumbnails[0]}
                    alt={item.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
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
                <p className="text-dark font-medium text-sm leading-tight">
                  {item.title.length > 30
                    ? `${item.title.substring(0, 30)}...`
                    : item.title}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Qty: {item.quantity} × ${item.discountedPrice.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Instant Delivery
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="text-dark font-medium">
                ${(item.discountedPrice * item.quantity).toFixed(2)}
              </p>
              {item.price !== item.discountedPrice && (
                <p className="text-gray-500 text-sm line-through">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="flex items-center justify-between pt-5">
          <div>
            <p className="font-semibold text-lg text-dark">Total</p>
            <p className="text-sm text-gray-500">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} digital code(s)
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg text-dark">
              ${totalPrice.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">USD</p>
          </div>
        </div>

        {/* Digital Delivery Info */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-900 text-sm mb-1">
                Instant Digital Delivery
              </h4>
              <p className="text-green-800 text-xs">
                Your codes will be available immediately after payment confirmation. 
                Access them from your account dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalOrderSummary;
