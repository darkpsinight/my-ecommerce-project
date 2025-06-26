"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface FeaturedProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  region: string;
  regionFlag: string;
  platform: string;
  platformIcon: string;
  tag: 'New' | 'Bestseller' | 'Hot Deal';
  tagColor: string;
  discount?: number;
  imageUrl?: string;
}

const FeaturedCarousel = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock featured products with global appeal
  const featuredProducts: FeaturedProduct[] = [
    {
      id: '1',
      title: 'Steam Wallet Code $50',
      price: 49.99,
      originalPrice: 59.99,
      region: 'Global',
      regionFlag: '🌍',
      platform: 'Steam',
      platformIcon: '🎮',
      tag: 'Bestseller',
      tagColor: 'bg-green text-white',
      discount: 17,
      imageUrl: '/images/products/steam-wallet.jpg'
    },
    {
      id: '2',
      title: 'PlayStation Plus Premium 1 Month',
      price: 29.99,
      originalPrice: 39.99,
      region: 'US/EU',
      regionFlag: '🇺🇸',
      platform: 'PSN',
      platformIcon: '🎯',
      tag: 'New',
      tagColor: 'bg-blue text-white',
      discount: 25,
      imageUrl: '/images/products/ps-plus.jpg'
    },
    {
      id: '3',
      title: 'Xbox Game Pass Ultimate 3 Months',
      price: 14.99,
      region: 'Global',
      regionFlag: '🌍',
      platform: 'Xbox',
      platformIcon: '🎪',
      tag: 'Hot Deal',
      tagColor: 'bg-orange text-white',
      imageUrl: '/images/products/xbox-gamepass.jpg'
    },
    {
      id: '4',
      title: 'Amazon Gift Card $100',
      price: 99.99,
      originalPrice: 100.00,
      region: 'US',
      regionFlag: '🇺🇸',
      platform: 'Amazon',
      platformIcon: '🎁',
      tag: 'Bestseller',
      tagColor: 'bg-green text-white',
      discount: 1,
      imageUrl: '/images/products/amazon-gift.jpg'
    },
    {
      id: '5',
      title: 'Netflix Gift Card $25',
      price: 23.99,
      originalPrice: 25.00,
      region: 'Global',
      regionFlag: '🌍',
      platform: 'Netflix',
      platformIcon: '🎬',
      tag: 'New',
      tagColor: 'bg-red text-white',
      discount: 4,
      imageUrl: '/images/products/netflix-gift.jpg'
    },
    {
      id: '6',
      title: 'Google Play Gift Card $50 - Instant Digital Delivery',
      price: 47.99,
      originalPrice: 50.00,
      region: 'US',
      regionFlag: '🇺🇸',
      platform: 'Google Play',
      platformIcon: '📱',
      tag: 'Hot Deal',
      tagColor: 'bg-orange text-white',
      discount: 4,
      imageUrl: '/images/products/google-play-gift.jpg'
    },
    {
      id: '7',
      title: 'Spotify Premium Gift Card 3 Months Subscription',
      price: 29.99,
      originalPrice: 35.97,
      region: 'Global',
      regionFlag: '🌍',
      platform: 'Spotify',
      platformIcon: '🎵',
      tag: 'Bestseller',
      tagColor: 'bg-green text-white',
      discount: 17,
      imageUrl: '/images/products/spotify-gift.jpg'
    },
    {
      id: '8',
      title: 'Apple App Store & iTunes Gift Card $100',
      price: 98.99,
      originalPrice: 100.00,
      region: 'US',
      regionFlag: '🇺🇸',
      platform: 'Apple',
      platformIcon: '🍎',
      tag: 'New',
      tagColor: 'bg-blue text-white',
      discount: 1,
      imageUrl: '/images/products/apple-gift.jpg'
    }
  ];

  if (!mounted) {
    return (
      <section className="py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-white via-blue-light-5 to-purple-50">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-2xl">⭐</span>
              <span className="font-bold text-blue text-lg tracking-wider uppercase">
                Featured Deals
              </span>
              <span className="text-2xl">⭐</span>
            </div>
            <h2 className="text-2xl lg:text-heading-4 font-bold text-dark mb-6">
              Top <span className="text-blue">Digital Codes</span> This Week
            </h2>
          </div>
          <div className="relative">
            <div className="flex gap-6 lg:gap-8 overflow-hidden">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse flex-shrink-0 w-[280px]">
                  <div className="bg-white rounded-2xl border border-gray-3 h-[380px] p-5">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-6 bg-gray-3 rounded-full"></div>
                        <div className="w-12 h-6 bg-gray-3 rounded-full"></div>
                      </div>
                      <div className="h-[220px] bg-gray-3 rounded-xl"></div>
                      <div className="space-y-3">
                        <div className="w-20 h-6 bg-gray-3 rounded-full"></div>
                        <div className="h-6 bg-gray-3 rounded w-4/5"></div>
                        <div className="h-8 bg-gray-3 rounded w-2/3"></div>
                      </div>
                      </div>
                </div>
                </div>
              ))}
            </div>
            {/* Loading Navigation Buttons */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 w-12 h-12 bg-gray-3 rounded-full flex items-center justify-center animate-pulse"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 w-12 h-12 bg-gray-3 rounded-full flex items-center justify-center animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-white via-blue-light-5 to-purple-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 bg-blue rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-2xl animate-bounce">⭐</span>
            <span className="font-bold text-blue text-lg tracking-wider uppercase">
              Featured Deals
            </span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>⭐</span>
          </div>
          <h2 className="text-2xl lg:text-heading-4 font-bold text-dark mb-6">
            Top <span className="text-blue">Digital Codes</span> This Week
          </h2>
          <p className="text-dark-4 text-lg max-w-[700px] mx-auto leading-relaxed">
            Discover the most popular digital codes, hand-picked by our team and loved by customers worldwide. 
            <span className="text-blue font-semibold"> Limited time offers!</span>
          </p>
        </div>

        {/* Products Swiper - Single Row */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            navigation={{
              nextEl: '.featured-swiper-button-next',
              prevEl: '.featured-swiper-button-prev',
            }}
            pagination={{
              el: '.featured-swiper-pagination',
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
              1200: {
                slidesPerView: 4,
                spaceBetween: 32,
              },
            }}
            className="featured-products-swiper"
          >
            {featuredProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <Link href={`/shop-details/${product.id}`} className="block">
                  <div className="bg-white rounded-2xl border border-gray-3 hover:border-blue hover:shadow-2xl transition-all duration-500 group h-[380px] relative overflow-hidden hover:scale-105 hover:-translate-y-2 cursor-pointer">
                    {/* Top Tag */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${product.tagColor} shadow-lg`}>
                        {product.tag}
                      </span>
                    </div>

                    {/* Region Tag */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="flex items-center gap-1 bg-white bg-opacity-90 px-2 py-1 rounded-full shadow-lg">
                        <span className="text-sm">{product.regionFlag}</span>
                        <span className="text-xs text-black font-medium">
                          {product.region}
                        </span>
                      </div>
                    </div>

                    {/* Image Placeholder */}
                    <div className="relative h-[220px] bg-gradient-to-br from-blue-light-5 to-purple-50 flex items-center justify-center group-hover:from-blue-light-4 group-hover:to-purple-100 transition-all duration-500">
                      <div className="text-8xl opacity-50 group-hover:opacity-70 transition-opacity">
                        {product.platformIcon}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Platform Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm bg-blue-light-5 text-blue px-3 py-1.5 rounded-full font-medium">
                          {product.platform}
                        </span>
                      </div>

                      {/* Title - Truncated for long titles */}
                      <h3 className="font-semibold text-lg text-black group-hover:text-blue transition-colors mb-4 leading-tight">
                        {product.title.length > 35 ? `${product.title.substring(0, 35)}...` : product.title}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl font-bold text-green">
                          ${product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-5 line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                        {product.discount && (
                          <span className="text-xs bg-red text-white px-2 py-1 rounded-full font-semibold">
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-light-5 to-purple-50 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons */}
          <div className="featured-swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 w-12 h-12 bg-white border border-gray-3 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue hover:text-white hover:border-blue transition-all duration-300 shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <div className="featured-swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 w-12 h-12 bg-white border border-gray-3 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue hover:text-white hover:border-blue transition-all duration-300 shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="featured-swiper-pagination flex justify-center mt-8"></div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link 
            href="/products" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue to-blue-dark text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-light-3"
          >
            <span>View All Digital Codes</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;