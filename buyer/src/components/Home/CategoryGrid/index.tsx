"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from 'swiper/modules';

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

const CategoryGrid = () => {
  const { categories, loading, error } = useCategories();
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  const sliderRef = useRef(null);

  const handlePrev = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slideNext();
  }, []);

  // Digital marketplace category mappings with better icons and gradients
  const digitalCategories = [
    {
      id: 'gaming',
      title: 'Gaming',
      count: '100+ Games',
      icon: (
        <svg className="w-8 h-8 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8" />
        </svg>
      ),
      description: 'Game Keys & Digital Games',
      gradient: 'from-blue-light-5 via-blue-light-4 to-blue-light-3',
      href: '/shop-without-sidebar?category=gaming',
      bgColor: 'bg-blue/10',
      textColor: 'text-blue'
    },
    {
      id: 'software',
      title: 'Software',
      count: '50+ Programs',
      icon: (
        <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Professional Software',
      gradient: 'from-green-light-6 via-green-light-5 to-green-light-4',
      href: '/shop-without-sidebar?category=software',
      bgColor: 'bg-green/10',
      textColor: 'text-green'
    },
    {
      id: 'streaming',
      title: 'Streaming',
      count: '25+ Services',
      icon: (
        <svg className="w-8 h-8 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Streaming & Media',
      gradient: 'from-purple-100 via-purple-light to-purple/30',
      href: '/shop-without-sidebar?category=streaming',
      bgColor: 'bg-purple/10',
      textColor: 'text-purple'
    },
    {
      id: 'giftcards',
      title: 'Gift Cards',
      count: '30+ Brands',
      icon: (
        <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      description: 'All Major Brands',
      gradient: 'from-orange/20 via-yellow-light-2 to-yellow-light-1',
      href: '/shop-without-sidebar?category=giftcards',
      bgColor: 'bg-orange/10',
      textColor: 'text-orange'
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions',
      count: '20+ Services',
      icon: (
        <svg className="w-8 h-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      description: 'Monthly Subscriptions',
      gradient: 'from-teal/20 via-teal-light/30 to-teal/10',
      href: '/shop-without-sidebar?category=subscriptions',
      bgColor: 'bg-teal/10',
      textColor: 'text-teal'
    },
    {
      id: 'mobile',
      title: 'Mobile',
      count: '15+ Apps',
      icon: (
        <svg className="w-8 h-8 text-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Mobile Apps & Games',
      gradient: 'from-pink/20 via-pink-light/30 to-pink/10',
      href: '/shop-without-sidebar?category=mobile',
      bgColor: 'bg-pink/10',
      textColor: 'text-pink'
    },
    {
      id: 'vpn',
      title: 'VPN & Security',
      count: '10+ Tools',
      icon: (
        <svg className="w-8 h-8 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      description: 'Security & Privacy',
      gradient: 'from-red/20 via-red-light/30 to-red/10',
      href: '/shop-without-sidebar?category=vpn',
      bgColor: 'bg-red/10',
      textColor: 'text-red'
    },
    {
      id: 'education',
      title: 'Education',
      count: '12+ Courses',
      icon: (
        <svg className="w-8 h-8 text-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      description: 'Online Courses',
      gradient: 'from-indigo/20 via-indigo-light/30 to-indigo/10',
      href: '/shop-without-sidebar?category=education',
      bgColor: 'bg-indigo/10',
      textColor: 'text-indigo'
    }
  ];

  const handleImageError = (categoryId: string) => {
    setImageErrors(prev => ({ ...prev, [categoryId]: true }));
  };

  // Get actual categories if available, otherwise use digital categories
  const getDisplayCategories = () => {
    if (categories && categories.length > 0) {
      // Use API categories and map them to our enhanced format
      return categories.slice(0, 8).map((cat, index) => {
        const defaultCategory = digitalCategories[index % digitalCategories.length];
        // Get the image URL from API - use imageUrl field from API response
        const apiImageUrl = (cat as any).imageUrl || cat.img;
        
        return {
          id: cat.id,
          title: cat.title,
          description: cat.description || defaultCategory.description,
          count: 'Available Now',
          icon: defaultCategory.icon,
          gradient: defaultCategory.gradient,
          bgColor: defaultCategory.bgColor,
          textColor: defaultCategory.textColor,
          href: `/shop-without-sidebar?category=${encodeURIComponent(cat.title)}`,
          imageUrl: apiImageUrl,
          hasImage: !!(apiImageUrl && apiImageUrl.trim() !== '')
        };
      });
    }
    return digitalCategories.map(cat => ({
      ...cat,
      hasImage: false
    }));
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-20 xl:py-24 bg-white">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-3 rounded w-64 mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-3 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Navigation Buttons Skeleton */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gray-3 rounded-full animate-pulse"></div>
            <div className="w-12 h-12 bg-gray-3 rounded-full animate-pulse"></div>
          </div>

          <div className="flex gap-6 md:gap-8 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="animate-pulse flex flex-col items-center space-y-4 flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-gray-3 rounded-full"></div>
                <div className="h-4 bg-gray-3 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 lg:py-16 xl:py-20 bg-white overflow-hidden">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl lg:text-heading-5 font-bold text-black mb-3">
            Shop by <span className="text-blue">Category</span>
          </h2>
          <p className="text-black text-base md:text-lg max-w-[600px] mx-auto">
            Browse our marketplace of digital products from trusted sellers
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">Unable to load categories from server. Showing default categories.</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button 
            onClick={handlePrev} 
            className="group w-12 h-12 bg-white hover:bg-blue border-2 border-blue hover:border-blue-dark rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
          >
            <svg
              className="fill-current text-blue group-hover:text-white transition-colors duration-300"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.4881 4.43057C15.8026 4.70014 15.839 5.17361 15.5694 5.48811L9.98781 12L15.5694 18.5119C15.839 18.8264 15.8026 19.2999 15.4881 19.5695C15.1736 19.839 14.7001 19.8026 14.4306 19.4881L8.43056 12.4881C8.18981 12.2072 8.18981 11.7928 8.43056 11.5119L14.4306 4.51192C14.7001 4.19743 15.1736 4.161 15.4881 4.43057Z"
                fill=""
              />
            </svg>
          </button>

          <button 
            onClick={handleNext} 
            className="group w-12 h-12 bg-white hover:bg-blue border-2 border-blue hover:border-blue-dark rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
          >
            <svg
              className="fill-current text-blue group-hover:text-white transition-colors duration-300"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.51192 4.43057C8.82641 4.161 9.29989 4.19743 9.56946 4.51192L15.5695 11.5119C15.8102 11.7928 15.8102 12.2072 15.5695 12.4881L9.56946 19.4881C9.29989 19.8026 8.82641 19.839 8.51192 19.5695C8.19743 19.2999 8.161 18.8264 8.43057 18.5119L14.0122 12L8.43057 5.48811C8.161 5.17361 8.19743 4.70014 8.51192 4.43057Z"
                fill=""
              />
            </svg>
          </button>
        </div>

        {/* Categories Swiper */}
        <Swiper
          ref={sliderRef}
          modules={[Autoplay, Navigation]}
          slidesPerView={8}
          spaceBetween={20}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={getDisplayCategories().length > 8}
          breakpoints={{
            0: {
              slidesPerView: 2,
              spaceBetween: 15,
            },
            640: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 6,
              spaceBetween: 20,
            },
            1200: {
              slidesPerView: 8,
              spaceBetween: 20,
            },
          }}
          className="categories-swiper pb-2"
        >
          {getDisplayCategories().map((category, index) => (
            <SwiperSlide key={category.id}>
              <Link
                href={category.href}
                className="group block text-center"
              >
                <div className="flex flex-col items-center space-y-4">
                  {/* Circular Image/Icon */}
                  <div className="relative">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-1 border-4 border-gray-3 group-hover:border-blue transition-all duration-300 group-hover:shadow-lg">
                      {category.hasImage && category.imageUrl && !imageErrors[category.id] ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={category.imageUrl}
                            alt={category.title}
                            fill
                            sizes="(max-width: 768px) 80px, 96px"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={() => handleImageError(String(category.id))}
                            priority={index < 6}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-light-5 to-blue-light-3">
                          {category.icon}
                        </div>
                      )}
                    </div>
                    
                    {/* Hover ring effect */}
                    <div className="absolute inset-0 w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-blue scale-0 group-hover:scale-110 transition-transform duration-300 opacity-0 group-hover:opacity-100"></div>
                  </div>

                  {/* Category Title with animated underline */}
                  <div className="relative">
                    <h3 className="font-semibold text-sm md:text-base text-black group-hover:text-blue transition-colors duration-300">
                      {category.title}
                    </h3>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

      </div>
    </section>
  );
};

export default CategoryGrid;