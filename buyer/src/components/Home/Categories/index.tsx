"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { useCallback, useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useCategories } from "@/hooks/useCategories";
import { Autoplay, Navigation } from 'swiper/modules';

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import SingleItem from "./SingleItem";

const Categories = () => {
  const sliderRef = useRef(null);
  const { categories, loading, error, refetch } = useCategories();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrev = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slideNext();
  }, []);

  // Fallback data for when API fails or returns empty
  const getFallbackData = () => {
    return [
      {
        id: 1,
        title: "Gaming Codes",
        img: "/images/categories/categories-01.png",
        description: "Digital game codes and in-game currencies"
      },
      {
        id: 2,
        title: "Software Licenses",
        img: "/images/categories/categories-02.png",
        description: "Professional software and productivity tools"
      },
      {
        id: 3,
        title: "Entertainment",
        img: "/images/categories/categories-03.png",
        description: "Streaming services and media content"
      },
      {
        id: 4,
        title: "Gift Cards",
        img: "/images/categories/categories-04.png",
        description: "Digital gift cards for various platforms"
      },
      {
        id: 5,
        title: "Subscriptions",
        img: "/images/categories/categories-05.png",
        description: "Monthly and yearly service subscriptions"
      },
      {
        id: 6,
        title: "Cloud Services",
        img: "/images/categories/categories-06.png",
        description: "Cloud storage and computing services"
      }
    ];
  };

  // Get categories to display - either from API or fallback
  const getCategoriesToDisplay = () => {
    if (categories && categories.length > 0) {
      return categories;
    }
    return getFallbackData();
  };

  return (
    <section className="overflow-hidden pt-17.5 relative bg-gradient-to-br from-blue-light-5/30 via-purple-100/50 to-green-light-6/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-blue/20 animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-green/20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 rounded-full bg-orange/20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 pb-15 relative z-10">
        <div className="swiper categories-carousel common-carousel">
          {/* Section Title */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-light-5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue to-blue-dark rounded-full flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <g clipPath="url(#clip0_834_7356)">
                    <path
                      d="M3.94024 13.4474C2.6523 12.1595 2.00832 11.5155 1.7687 10.68C1.52908 9.84449 1.73387 8.9571 2.14343 7.18231L2.37962 6.15883C2.72419 4.66569 2.89648 3.91912 3.40771 3.40789C3.91894 2.89666 4.66551 2.72437 6.15865 2.3798L7.18213 2.14361C8.95692 1.73405 9.84431 1.52927 10.6798 1.76889C11.5153 2.00851 12.1593 2.65248 13.4472 3.94042L14.9719 5.46512C17.2128 7.70594 18.3332 8.82635 18.3332 10.2186C18.3332 11.6109 17.2128 12.7313 14.9719 14.9721C12.7311 17.2129 11.6107 18.3334 10.2184 18.3334C8.82617 18.3334 7.70576 17.2129 5.46494 14.9721L3.94024 13.4474Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="7.17245"
                      cy="7.39917"
                      r="1.66667"
                      transform="rotate(-45 7.17245 7.39917)"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M9.61837 15.4164L15.4342 9.6004"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_834_7356">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <span className="font-semibold text-blue">Popular Categories</span>
            </div>
            
            <h2 className="font-bold text-2xl lg:text-heading-5 text-dark mb-3">
              Explore Digital <span className="text-blue">Marketplaces</span>
            </h2>
            <p className="text-dark-4 max-w-2xl mx-auto text-lg">
              Discover thousands of digital codes, software licenses, and gaming content from verified sellers worldwide
            </p>
          </div>

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

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-3 to-gray-4 rounded-2xl mb-4 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-4 bg-gray-3 rounded-full w-24 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-4 rounded-full w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col justify-center items-center min-h-[300px] text-center bg-white/50 backdrop-blur-sm rounded-2xl border border-red-light-3 mb-8">
              <div className="w-16 h-16 bg-red-light-5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">Unable to Load Categories</h3>
              <p className="text-dark-4 mb-4">We&apos;re having trouble connecting to our servers</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue hover:bg-blue-dark text-white rounded-xl transition-colors duration-300 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Categories Carousel */}
          {(!loading || categories) && (
            <Swiper
              ref={sliderRef}
              modules={[Autoplay, Navigation]}
              slidesPerView={6}
              spaceBetween={20}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={getCategoriesToDisplay().length > 6}
              breakpoints={{
                0: {
                  slidesPerView: 2,
                  spaceBetween: 15,
                },
                640: {
                  slidesPerView: 3,
                  spaceBetween: 20,
                },
                1000: {
                  slidesPerView: 4,
                  spaceBetween: 20,
                },
                1200: {
                  slidesPerView: 6,
                  spaceBetween: 20,
                },
              }}
              className="categories-swiper pb-2"
            >
              {getCategoriesToDisplay().map((item, key) => (
                <SwiperSlide key={key}>
                  <SingleItem item={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {/* Stats Section */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-3/30">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue to-blue-dark rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-dark">Instant</p>
              <p className="text-sm text-dark-4">Delivery</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green to-green-dark rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-dark">100%</p>
              <p className="text-sm text-dark-4">Verified</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange to-red rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-dark">120+</p>
              <p className="text-sm text-dark-4">Regions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple to-purple-dark rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-dark">24/7</p>
              <p className="text-sm text-dark-4">Support</p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </section>
  );
};

export default Categories;
