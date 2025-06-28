import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Eye, Star, ExternalLink } from 'lucide-react';
import { useViewedProducts } from '@/hooks/useViewedProducts';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/currency';
import { formatRelativeTime } from '@/utils/time';

interface RecentlyViewedProductsProps {
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
  showClearAll?: boolean;
  showViewAll?: boolean;
  compact?: boolean;
  onProductClick?: (product: Product) => void;
}

const RecentlyViewedProducts: React.FC<RecentlyViewedProductsProps> = memo(({
  className = '',
  maxItems = 8,
  showHeader = true,
  showClearAll = true,
  showViewAll = true,
  compact = false,
  onProductClick
}) => {
  const {
    viewedProducts,
    loading,
    error,
    removeViewedProduct,
    clearViewedProducts,
    getViewCount
  } = useViewedProducts({
    limit: maxItems,
    includeProductDetails: true,
    timeframe: '30d'
  });

  // Filter out products without details and limit results
  const productsWithDetails = viewedProducts
    .filter(item => item.product)
    .slice(0, maxItems);

  const totalCount = getViewCount();

  const handleRemoveProduct = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await removeViewedProduct(productId);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all recently viewed products?')) {
      await clearViewedProducts();
    }
  };

  const handleProductClick = (product: Product) => {
    onProductClick?.(product);
  };

  // Don't render if no products
  if (!loading && productsWithDetails.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recently Viewed
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {totalCount} {totalCount === 1 ? 'product' : 'products'} viewed
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showViewAll && totalCount > maxItems && (
                <Link 
                  href="/viewed-products"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </Link>
              )}
              
              {showClearAll && totalCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 dark:text-red-400 mb-2">
              <Eye className="w-8 h-8 mx-auto opacity-50" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            compact 
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            <AnimatePresence mode="popLayout">
              {productsWithDetails.map((viewedItem, index) => {
                const product = viewedItem.product!;
                
                return (
                  <motion.div
                    key={viewedItem.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.2,
                      delay: index * 0.05 
                    }}
                    className="group relative"
                  >
                    <Link 
                      href={`/product/${product.id}`}
                      onClick={() => handleProductClick(product)}
                      className="block"
                    >
                      <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 aspect-square mb-3 group-hover:shadow-lg transition-all duration-300">
                        {/* Remove button */}
                        <button
                          onClick={(e) => handleRemoveProduct(e, product.id)}
                          className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-900 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove from recently viewed"
                        >
                          <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Product image */}
                        <Image
                          src={product.thumbnailUrl || '/images/products/placeholder.png'}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes={compact ? "150px" : "250px"}
                        />

                        {/* View time badge */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md">
                          <p className="text-xs text-white font-medium">
                            {formatRelativeTime(viewedItem.viewedAt)}
                          </p>
                        </div>

                        {/* Discount badge */}
                        {product.originalPrice && product.originalPrice > product.discountedPrice && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-md">
                            -{Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)}%
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
                          compact ? 'text-sm' : 'text-base'
                        }`}>
                          {product.title}
                        </h4>
                        
                        {!compact && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{product.platform}</span>
                            {product.region && (
                              <>
                                <span>•</span>
                                <span>{product.region}</span>
                              </>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-blue-600 dark:text-blue-400 ${
                            compact ? 'text-sm' : 'text-lg'
                          }`}>
                            {formatPrice(product.discountedPrice)}
                          </span>
                          
                          {product.originalPrice && product.originalPrice > product.discountedPrice && (
                            <span className={`text-gray-500 dark:text-gray-400 line-through ${
                              compact ? 'text-xs' : 'text-sm'
                            }`}>
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>

                        {!compact && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {product.reviews || 0} reviews
                              </span>
                            </div>
                            
                            <span className="text-gray-400">•</span>
                            
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              product.quantityOfActiveCodes > 0
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {product.quantityOfActiveCodes > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!loading && !error && productsWithDetails.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Clock className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Recently Viewed Products
            </h4>
            <p className="text-gray-500 dark:text-gray-500 max-w-sm mx-auto">
              Start browsing products to see your viewing history here. Your recently viewed products will appear across all your devices when you&apos;re signed in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

RecentlyViewedProducts.displayName = 'RecentlyViewedProducts';

export default RecentlyViewedProducts;