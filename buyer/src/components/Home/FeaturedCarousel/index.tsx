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
      title: 'Steam Wallet Code',
      price: 49.99,
      originalPrice: 59.99,
      region: 'Global',
      regionFlag: '🌍',
      platform: 'Steam',
      platformIcon: '🎮',
      tag: 'Bestseller',
      tagColor: 'bg-green text-white',
      discount: 17
    },
    {
      id: '2',
      title: 'PlayStation Plus Premium',
      price: 29.99,
      originalPrice: 39.99,
      region: 'US/EU',
      regionFlag: '🇺🇸',
      platform: 'PSN',
      platformIcon: '🎯',
      tag: 'New',
      tagColor: 'bg-blue text-white',
      discount: 25
    },
    {
      id: '3',
      title: 'Xbox Game Pass Ultimate',
      price: 14.99,
      region: 'Global',
      regionFlag: '🌍',
      platform: 'Xbox',
      platformIcon: '🎪',
      tag: 'Hot Deal',
      tagColor: 'bg-orange text-white'
    },
    {
      id: '4',
      title: 'Amazon Gift Card',
      price: 99.99,
      originalPrice: 100.00,
      region: 'US',
      regionFlag: '🇺🇸',
      platform: 'Amazon',
      platformIcon: '🎁',
      tag: 'Bestseller',
      tagColor: 'bg-green text-white',
      discount: 1
    },
    {
      id: '5',
      title: 'Google Play Gift Card',
      price: 24.99,
      region: 'Global',
      regionFlag: '🌍',
      platform: 'Google',
      platformIcon: '📱',
      tag: 'New',
      tagColor: 'bg-blue text-white'
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
    <section className="py-10 lg:py-12.5 xl:py-15">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="mb-8">
          <h2 className="text-2xl lg:text-heading-5 font-semibold text-dark mb-2">
            Player&apos;s Favorites
          </h2>
          <p className="text-dark-4">Top picks from our verified sellers</p>
        </div>

        <div className="relative">
          <Swiper
            modules={[Autoplay, Navigation]}
            slidesPerView={3}
            spaceBetween={24}
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
              768: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
            }}
            className="featured-products-carousel"
          >
            {featuredProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <div className="bg-white rounded-lg p-6 border border-gray-3 hover:border-blue-light-3 hover:shadow-xl transition-all duration-300 group h-[300px] flex flex-col justify-between relative overflow-hidden">
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-light-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 bg-gray-1 px-3 py-1.5 rounded-full">
                        <span className="text-lg">{product.regionFlag}</span>
                        <span className="text-sm text-dark-4 font-medium">
                          {product.region}
                        </span>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${product.tagColor} shadow-sm animate-pulse`}>
                        {product.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{product.platformIcon}</span>
                      <span className="text-sm bg-blue-light-5 text-blue px-3 py-1.5 rounded-full font-medium">
                        {product.platform}
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg text-dark group-hover:text-blue transition-colors mb-4 line-clamp-2">
                      {product.title}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-dark">
                          ${product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-lg text-dark-4 line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>
                      
                      {product.discount && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-red text-white px-2 py-1 rounded-full font-semibold">
                            {product.discount}% OFF
                          </span>
                          <span className="text-xs text-green font-semibold bg-green-light-6 px-2 py-1 rounded-full">
                            Save ${((product.originalPrice || 0) - product.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/shop-details/${product.id}`}
                    className="relative z-10 w-full bg-blue hover:bg-blue-dark text-white font-semibold py-3.5 rounded-lg transition-all duration-300 hover:scale-105 text-center mt-4 block shadow-lg hover:shadow-xl"
                  >
                    View Details
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons */}
          <button className="featured-prev absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 bg-white border border-gray-3 rounded-full flex items-center justify-center hover:border-blue hover:text-blue transition-all duration-300 z-10 shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button className="featured-next absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 bg-white border border-gray-3 rounded-full flex items-center justify-center hover:border-blue hover:text-blue transition-all duration-300 z-10 shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;