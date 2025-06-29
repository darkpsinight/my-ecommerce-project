"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Filter, 
  Grid3X3, 
  List, 
  Search, 
  Trash2, 
  Calendar,
  Eye,
  ArrowUpDown,
  Download,
  Settings
} from 'lucide-react';
import { useViewedProducts } from '@/hooks/useViewedProducts';
import { Product } from '@/types/product';
import ProductItem from '@/components/Common/ProductItem';
import { formatRelativeTime, formatDate } from '@/utils/time';
import { formatPrice } from '@/utils/currency';

type ViewMode = 'grid' | 'list';
type SortBy = 'recent' | 'oldest' | 'title' | 'price';
type TimeFilter = '7d' | '30d' | '90d' | 'all';

const ViewedProductsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('90d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const {
    viewedProducts,
    loading,
    error,
    removeViewedProduct,
    clearViewedProducts,
    getViewCount
  } = useViewedProducts({
    limit: 100,
    includeProductDetails: true,
    timeframe: timeFilter
  });

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = viewedProducts.filter(item => 
      item.product && 
      item.product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime();
        case 'oldest':
          return new Date(a.viewedAt).getTime() - new Date(b.viewedAt).getTime();
        case 'title':
          return (a.product?.title || '').localeCompare(b.product?.title || '');
        case 'price':
          return (a.product?.discountedPrice || 0) - (b.product?.discountedPrice || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [viewedProducts, searchQuery, sortBy]);

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedProducts.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedProducts.map(item => item.productId)));
    }
  };

  const handleSelectItem = (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedItems.size} selected items from your viewing history?`
    );
    
    if (confirmed) {
      const productIds = Array.from(selectedItems);
      for (const productId of productIds) {
        await removeViewedProduct(productId);
      }
      setSelectedItems(new Set());
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all your viewing history? This action cannot be undone.'
    );
    
    if (confirmed) {
      await clearViewedProducts();
      setSelectedItems(new Set());
    }
  };

  const handleExportData = () => {
    const exportData = filteredAndSortedProducts.map(item => ({
      product_title: item.product?.title,
      product_id: item.productId,
      viewed_at: item.viewedAt,
      price: item.product?.discountedPrice,
      platform: item.product?.platform,
      region: item.product?.region
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `viewed-products-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Recently Viewed Products
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {getViewCount()} products in your viewing history
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search viewed products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Time Filter */}
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Product Name</option>
                  <option value="price">Price</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Selection Actions */}
                {selectedItems.size > 0 && (
                  <>
                    <button
                      onClick={handleRemoveSelected}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove ({selectedItems.size})
                    </button>
                  </>
                )}

                {/* Utility Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExportData}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Export viewing data"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleClearAll}
                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Clear all viewing history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {filteredAndSortedProducts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Select all {filteredAndSortedProducts.length} items
                    </span>
                  </label>
                  
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {selectedItems.size} selected
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <Eye className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Viewed Products
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Clock className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No products found' : 'No viewed products yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery 
                ? `No products match "${searchQuery}". Try adjusting your search or filters.`
                : 'Start browsing products to build your viewing history. Your recently viewed products will appear here.'
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            <AnimatePresence mode="popLayout">
              {filteredAndSortedProducts.map((viewedItem, index) => {
                const product = viewedItem.product!;
                const isSelected = selectedItems.has(viewedItem.productId);
                
                return (
                  <motion.div
                    key={viewedItem.productId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.2,
                      delay: index * 0.02 
                    }}
                    className={`relative ${
                      viewMode === 'list' ? 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700' : ''
                    }`}
                  >
                    {/* Selection checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(viewedItem.productId)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 shadow-sm"
                      />
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="group relative">
                        <ProductItem item={product} />
                        
                        {/* Viewed time overlay */}
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md z-10">
                          <p className="text-xs text-white font-medium">
                            {formatRelativeTime(viewedItem.viewedAt)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-6">
                        <div className="flex-shrink-0 w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                          <Image
                            src={product.thumbnailUrl || '/images/products/placeholder.png'}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {product.title}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span>{product.platform}</span>
                            <span>•</span>
                            <span>{product.region}</span>
                            <span>•</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              ${product.discountedPrice}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Viewed {formatRelativeTime(viewedItem.viewedAt)}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {formatDate(viewedItem.viewedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewedProductsPage;