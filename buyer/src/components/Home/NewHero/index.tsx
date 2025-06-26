"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import HeroSearchBar from "./HeroSearchBar";
import DynamicSearchDemo from "./DynamicSearchDemo";

const NewHero = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative h-screen max-h-[85vh] sm:max-h-[75vh] lg:max-h-[70vh] pt-[300px] sm:pt-[220px] lg:pt-[160px] overflow-hidden bg-gradient-to-br from-blue-light-5 via-purple-100 to-green-light-6 flex items-center justify-center">
      {/* Abstract Digital Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Animated digital pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3C50E0" />
              <stop offset="50%" stopColor="#22AD5C" />
              <stop offset="100%" stopColor="#F27430" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" stroke="url(#gridGradient)" />
          
          {/* Digital nodes */}
          <g className={`${mounted ? 'animate-pulse' : ''}`}>
            <circle cx="80" cy="60" r="3" fill="#3C50E0" opacity="0.6" />
            <circle cx="150" cy="40" r="2" fill="#22AD5C" opacity="0.8" />
            <circle cx="220" cy="80" r="4" fill="#F27430" opacity="0.5" />
            <circle cx="300" cy="30" r="2.5" fill="#8B5CF6" opacity="0.7" />
            <circle cx="350" cy="100" r="3" fill="#02AAA4" opacity="0.6" />
          </g>
          
          {/* Connecting lines */}
          <g className="opacity-30">
            <line x1="80" y1="60" x2="150" y2="40" stroke="#3C50E0" strokeWidth="1" />
            <line x1="150" y1="40" x2="220" y2="80" stroke="#22AD5C" strokeWidth="1" />
            <line x1="220" y1="80" x2="300" y2="30" stroke="#F27430" strokeWidth="1" />
            <line x1="300" y1="30" x2="350" y2="100" stroke="#8B5CF6" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-10 left-10 w-8 h-8 border-2 border-blue rotate-45 ${mounted ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }}></div>
        <div className={`absolute top-20 right-20 w-6 h-6 bg-green opacity-20 rounded-full ${mounted ? 'animate-bounce' : ''}`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute bottom-20 left-1/4 w-10 h-10 border-2 border-orange rotate-12 ${mounted ? 'animate-pulse' : ''}`}></div>
        <div className={`absolute bottom-10 right-1/3 w-4 h-4 bg-purple opacity-30 ${mounted ? 'animate-ping' : ''}`} style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 z-10 relative">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-heading-2 font-bold text-dark mb-6 leading-tight">
            Instant Digital Codes{" "}<span className="text-dark-4">∙</span>{" "}
            <span className="text-blue">Any Region</span>{" "}
            <span className="text-dark-4">∙</span>{" "}
            <span className="text-green">Verified Sellers</span>
          </h1>

          {/* Hero Search Bar */}
          <HeroSearchBar className="mb-8" />
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue hover:bg-blue-dark text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg shadow-lg"
            >
              Browse Collections
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link
              href="/sell-digital-codes"
              className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-1 text-blue border-2 border-blue font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg"
            >
              Start Selling
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green rounded-full animate-pulse"></div>
              <span className="text-dark-3 font-medium">Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span className="text-dark-3 font-medium">120+ Regions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <span className="text-dark-3 font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewHero;