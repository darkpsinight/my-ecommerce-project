"use client";
import React from 'react';
import { Product } from '@/types/product';
import QuantityControl from '../../Cart/QuantityControl';
import ExpirationGroupSelector from '../ExpirationGroupSelector';

interface ProductActionsProps {
  product: Product;
  quantity: number;
  setQuantity: (quantity: number) => void;
  maxAddableQuantity: number;
  isOutOfStock: boolean;
  isItemBeingAdded: boolean;
  isInWishlist: boolean;
  isWishlistLoading: boolean;
  handleAddToCart: () => void;
  handleAddToWishlist: () => void;
  // Expiration groups props
  expirationGroups: any[];
  selectedExpirationGroups: any[];
  setSelectedExpirationGroups: (groups: any[]) => void;
  expirationGroupsLoading: boolean;
  useExpirationGroups: boolean;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  product,
  quantity,
  setQuantity,
  maxAddableQuantity,
  isOutOfStock,
  isItemBeingAdded,
  isInWishlist,
  isWishlistLoading,
  handleAddToCart,
  handleAddToWishlist,
  expirationGroups,
  selectedExpirationGroups,
  setSelectedExpirationGroups,
  expirationGroupsLoading,
  useExpirationGroups
}) => {
  return (
    <div className="space-y-6">
      {/* Price Section */}
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-gray-900">
          ${product.discountedPrice || product.price}
        </div>
        {product.price && product.price > product.discountedPrice && (
          <div className="text-xl text-gray-500 line-through">
            ${product.price}
          </div>
        )}
      </div>

      {/* Stock Information */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Stock:</span>
        <span className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
          {isOutOfStock ? 'Out of Stock' : `${product.quantityOfActiveCodes} available`}
        </span>
      </div>

      {/* Expiration Groups Selector */}
      {!expirationGroupsLoading && useExpirationGroups && (
        <ExpirationGroupSelector
          expirationGroups={expirationGroups}
          onSelectionChange={setSelectedExpirationGroups}
          disabled={isOutOfStock}
          maxTotalQuantity={maxAddableQuantity}
        />
      )}

      {/* Quantity Control - Only show if not using expiration groups */}
      {!useExpirationGroups && (
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">Quantity:</span>
          <QuantityControl
            quantity={quantity}
            onIncrease={() => {
              if (quantity < maxAddableQuantity) {
                setQuantity(quantity + 1);
              }
            }}
            onDecrease={() => {
              if (quantity > 1) {
                setQuantity(quantity - 1);
              }
            }}
            min={1}
            max={maxAddableQuantity}
            disabled={isOutOfStock}
            handleQuantityChange={(newQuantity) => {
              setQuantity(Math.min(Math.max(newQuantity, 1), maxAddableQuantity));
            }}
            showMaximumPulse={quantity >= maxAddableQuantity}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isItemBeingAdded}
          className="flex-1 bg-gradient-to-r from-blue to-blue-dark hover:from-blue-dark hover:to-blue-light disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isItemBeingAdded ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding to Cart...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </>
          )}
        </button>

        <button
          onClick={handleAddToWishlist}
          disabled={isWishlistLoading}
          className={`px-6 py-4 border-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isInWishlist
              ? 'border-red text-red hover:bg-red hover:text-white'
              : 'border-gray-300 text-gray-700 hover:border-blue hover:text-blue'
          }`}
        >
          {isWishlistLoading ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg
              className={`w-5 h-5 ${isInWishlist ? 'fill-current' : 'fill-none'}`}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
          {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </button>
      </div>


    </div>
  );
};

export default ProductActions;