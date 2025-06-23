"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const DigitalPromoBanner = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="overflow-hidden py-16 lg:py-20 bg-gradient-to-br from-gray-1 via-blue-light-5 to-purple-100">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Main Featured Banner */}
        <div className="relative z-10 overflow-hidden rounded-2xl bg-gradient-to-r from-blue to-blue-dark py-16 lg:py-20 xl:py-24 px-6 sm:px-10 lg:px-16 xl:px-20 mb-8 shadow-2xl">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className={`absolute top-10 left-10 w-32 h-32 bg-white rounded-full ${mounted ? 'animate-ping' : ''}`} style={{ animationDuration: '3s' }}></div>
            <div className={`absolute bottom-10 right-10 w-24 h-24 bg-yellow rounded-full ${mounted ? 'animate-pulse' : ''}`} style={{ animationDelay: '1s' }}></div>
            <div className={`absolute top-1/2 left-1/3 w-16 h-16 bg-green rounded-full ${mounted ? 'animate-bounce' : ''}`} style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative z-10 max-w-[600px] w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-2 bg-yellow text-dark font-semibold rounded-full text-sm">
                🔥 HOT DEAL
              </span>
              <span className="px-4 py-2 bg-white bg-opacity-20 text-white font-medium rounded-full text-sm">
                Limited Time
              </span>
            </div>

            <h2 className="font-bold text-2xl lg:text-heading-3 xl:text-heading-2 text-white mb-6 leading-tight">
              <span className="text-yellow">Steam Winter Sale</span><br />
              Up to <span className="text-green-light-2">75% OFF</span><br />
              Top Game Keys
            </h2>

            <p className="text-blue-light-2 text-lg mb-8 max-w-[500px]">
              Discover amazing deals on the latest and greatest games. From AAA titles to indie gems, 
              get instant delivery on verified game keys with our winter sale.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop-without-sidebar?category=steam"
                className="inline-flex items-center justify-center font-semibold text-lg text-blue bg-white py-4 px-8 rounded-xl hover:bg-gray-1 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Shop Now
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link
                href="/shop-without-sidebar"
                className="inline-flex items-center justify-center font-semibold text-lg text-white border-2 border-white py-4 px-8 rounded-xl hover:bg-white hover:text-blue transition-all duration-300"
              >
                View All Deals
              </Link>
            </div>
          </div>

          {/* Floating Icons */}
          <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
            <div className={`absolute top-20 right-20 text-6xl ${mounted ? 'animate-float' : ''}`}>🎮</div>
            <div className={`absolute top-40 right-40 text-4xl ${mounted ? 'animate-float' : ''}`} style={{ animationDelay: '1s' }}>🎯</div>
            <div className={`absolute bottom-32 right-16 text-5xl ${mounted ? 'animate-float' : ''}`} style={{ animationDelay: '2s' }}>🏆</div>
            <div className={`absolute bottom-20 right-32 text-3xl ${mounted ? 'animate-float' : ''}`} style={{ animationDelay: '3s' }}>⚡</div>
          </div>
        </div>

        {/* Secondary Banners */}
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {/* PlayStation Banner */}
          <div className="relative z-10 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-light-4 to-purple-100 py-12 xl:py-16 px-6 sm:px-8 xl:px-10 group hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue opacity-10 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">🎯</span>
                <span className="px-3 py-1 bg-blue text-white font-medium rounded-full text-sm">
                  PlayStation
                </span>
              </div>

              <h3 className="font-bold text-xl lg:text-2xl text-dark mb-3">
                PSN Gift Cards &<br />
                <span className="text-blue">Game Codes</span>
              </h3>

              <p className="text-dark-4 mb-6 max-w-[280px]">
                Instant delivery for all regions. Get your PlayStation codes in seconds.
              </p>

              <Link
                href="/shop-without-sidebar?category=playstation"
                className="inline-flex items-center font-semibold text-white bg-blue py-3 px-6 rounded-lg hover:bg-blue-dark transition-all duration-300 hover:scale-105"
              >
                Explore
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Xbox Banner */}
          <div className="relative z-10 overflow-hidden rounded-2xl bg-gradient-to-br from-green-light-6 to-yellow-light-4 py-12 xl:py-16 px-6 sm:px-8 xl:px-10 group hover:shadow-xl transition-all duration-500">
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-green opacity-10 rounded-full transform -translate-x-8 translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative z-10 text-right">
              <div className="flex items-center justify-end gap-2 mb-3">
                <span className="px-3 py-1 bg-green text-white font-medium rounded-full text-sm">
                  Xbox
                </span>
                <span className="text-3xl">🎪</span>
              </div>

              <h3 className="font-bold text-xl lg:text-2xl text-dark mb-3">
                <span className="text-green">Game Pass Ultimate</span><br />
                & Xbox Live Gold
              </h3>

              <p className="text-dark-4 mb-6 max-w-[280px] ml-auto">
                Access hundreds of games with Xbox Game Pass. Instant activation worldwide.
              </p>

              <Link
                href="/shop-without-sidebar?category=xbox"
                className="inline-flex items-center font-semibold text-white bg-green py-3 px-6 rounded-lg hover:bg-green-dark transition-all duration-300 hover:scale-105"
              >
                Shop Xbox
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default DigitalPromoBanner;