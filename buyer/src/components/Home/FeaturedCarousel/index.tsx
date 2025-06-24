"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { useEffect, useState } from "react";
import Link from "next/link";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

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
    }
  ];

  if (!mounted) {
    return (
      <section className="py-10 lg:py-12.5 xl:py-15">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-heading-5 font-semibold text-dark mb-2">
              Player&apos;s Favorites
            </h2>
            <p className="text-dark-4">Top picks from our verified sellers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="bg-white rounded-lg p-6 h-[280px] border border-gray-3">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-6 bg-gray-3 rounded"></div>
                      <div className="w-8 h-8 bg-gray-3 rounded-full"></div>
                    </div>
                    <div className="h-4 bg-gray-3 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-3 rounded w-1/2"></div>
                    <div className="h-10 bg-gray-3 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
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

        <div className="relative">
          <Swiper
            modules={[Autoplay, Navigation]}
            slidesPerView={5}
            spaceBetween={20}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            navigation={{
              nextEl: '.featured-next',
              prevEl: '.featured-prev',
            }}
            breakpoints={{
              0: {
                slidesPerView: 1,
                spaceBetween: 16,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 18,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 5,
                spaceBetween: 20,
              },
            }}
            className="featured-products-carousel"
          >
            {featuredProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <Link href={`/shop-details/${product.id}`} className="block">
                  <div className="bg-white rounded-2xl border border-gray-3 hover:border-blue hover:shadow-2xl transition-all duration-500 group h-[300px] relative overflow-hidden hover:scale-105 hover:-translate-y-2 cursor-pointer">
                    {/* Top Tag */}
                    <div className="absolute top-3 left-3 z-20">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${product.tagColor} shadow-lg`}>
                        {product.tag}
                      </span>
                    </div>

                    {/* Region Tag */}
                    <div className="absolute top-3 right-3 z-20">
                      <div className="flex items-center gap-1 bg-white bg-opacity-90 px-2 py-1 rounded-full shadow-lg">
                        <span className="text-xs">{product.regionFlag}</span>
                        <span className="text-xs text-black font-medium">
                          {product.region}
                        </span>
                      </div>
                    </div>

                    {/* Image Placeholder */}
                    <div className="relative h-[180px] bg-gradient-to-br from-blue-light-5 to-purple-50 flex items-center justify-center group-hover:from-blue-light-4 group-hover:to-purple-100 transition-all duration-500">
                      <div className="text-6xl opacity-50 group-hover:opacity-70 transition-opacity">
                        {product.platformIcon}
                                  </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Platform Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm bg-blue-light-5 text-blue px-2 py-1 rounded-full font-medium">
                          {product.platform}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-base text-black group-hover:text-blue transition-colors mb-3 line-clamp-2">
                        {product.title}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-green">
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

          {/* Enhanced Navigation Buttons */}
          <button className="featured-prev absolute top-1/2 -left-6 -translate-y-1/2 w-14 h-14 bg-gradient-to-r from-blue to-blue-dark text-white rounded-full flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all duration-300 z-10 border-2 border-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button className="featured-next absolute top-1/2 -right-6 -translate-y-1/2 w-14 h-14 bg-gradient-to-r from-blue to-blue-dark text-white rounded-full flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all duration-300 z-10 border-2 border-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;