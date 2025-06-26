import { Category } from "@/types/category";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const SingleItem = ({ item }: { item: Category }) => {
  const [imgError, setImgError] = useState(false);
  const fallbackImage = "/images/categories/categories-01.png";

  // Get the image URL - handle both 'img' and 'imageUrl' properties
  const getImageUrl = () => {
    if (imgError) return fallbackImage;
    return item.img || (item as any).imageUrl || fallbackImage;
  };

  // Get gradient colors based on category ID or title
  const getGradientClass = () => {
    const gradients = [
      "from-blue-light-4 to-blue-light-2",
      "from-green-light-4 to-green-light-2", 
      "from-orange/20 to-red/20",
      "from-purple-light to-purple/30",
      "from-teal/20 to-teal-light/30",
      "from-yellow-light-1 to-yellow/30"
    ];
    
    const index = typeof item.id === 'string' 
      ? item.id.length % gradients.length 
      : (item.id as number) % gradients.length;
    
    return gradients[index];
  };

  // Get icon based on category name/title
  const getCategoryIcon = () => {
    const title = item.title.toLowerCase();
    
    if (title.includes('game') || title.includes('gaming') || title.includes('console')) {
      return (
        <svg className="w-8 h-8 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-7-5h6m-3-3V3a1 1 0 011-1h4a1 1 0 011 1v3M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    } else if (title.includes('software') || title.includes('license')) {
      return (
        <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (title.includes('entertainment') || title.includes('streaming')) {
      return (
        <svg className="w-8 h-8 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (title.includes('gift') || title.includes('card')) {
      return (
        <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    } else if (title.includes('subscription') || title.includes('service')) {
      return (
        <svg className="w-8 h-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    } else if (title.includes('cloud')) {
      return (
        <svg className="w-8 h-8 text-blue-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      );
    }
    
    // Default icon
    return (
      <svg className="w-8 h-8 text-dark-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    );
  };

  return (
    <Link href={`/products?category=${encodeURIComponent(item.title)}`} className="group block">
      <div className="relative">
        {/* Main Card */}
        <div className={`relative w-full aspect-square bg-gradient-to-br ${getGradientClass()} rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden`}>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-12 h-12 rounded-full bg-white/30"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/20"></div>
          </div>

          {/* Image Container */}
          <div className="relative w-16 h-16 mb-4 z-10">
            {getImageUrl().startsWith('http') || getImageUrl().startsWith('/') ? (
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-white/20">
                <Image
                  src={getImageUrl()}
                  alt={item.title || "Category"}
                  fill
                  sizes="64px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={() => setImgError(true)}
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-xl bg-white/20 flex items-center justify-center">
                {getCategoryIcon()}
              </div>
            )}
          </div>

          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        </div>

        {/* Category Info */}
        <div className="mt-4 text-center">
          <h3 className="font-semibold text-dark text-sm lg:text-base mb-1 group-hover:text-blue transition-colors duration-300 line-clamp-2">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs text-dark-4 line-clamp-2 max-w-[140px] mx-auto">
              {item.description}
            </p>
          )}
        </div>

        {/* Hover Indicator */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default SingleItem;
