"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const FeatureHighlights = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: "🚀",
      title: "Lightning Fast",
      description: "Get your digital codes in under 60 seconds",
      color: "text-blue",
      bgGradient: "from-blue-light-5 to-blue-light-4",
      borderColor: "border-blue-light-3",
      hoverBg: "hover:from-blue-light-4 hover:to-blue-light-3"
    },
    {
      icon: "🔒",
      title: "100% Secure",
      description: "Bank-level security with 256-bit encryption",
      color: "text-green",
      bgGradient: "from-green-light-6 to-green-light-5",
      borderColor: "border-green-light-4",
      hoverBg: "hover:from-green-light-5 hover:to-green-light-4"
    },
    {
      icon: "🌍",
      title: "Global Reach",
      description: "Serving customers in 120+ countries worldwide",
      color: "text-purple",
      bgGradient: "from-purple-100 to-purple-50",
      borderColor: "border-purple-200",
      hoverBg: "hover:from-purple-50 hover:to-white"
    },
    {
      icon: "💎",
      title: "Premium Quality",
      description: "Only verified codes from trusted sources",
      color: "text-orange",
      bgGradient: "from-yellow-light-4 to-yellow-light-2",
      borderColor: "border-yellow-light-1",
      hoverBg: "hover:from-yellow-light-2 hover:to-yellow-light-1"
    }
  ];

  return (
    <section className="py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-white via-gray-1 to-blue-light-5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="grid grid-cols-12 gap-4 h-full">
            {[...Array(36)].map((_, i) => (
              <div key={i} className="bg-blue rounded-full w-2 h-2 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-1 bg-gradient-to-r from-blue to-purple rounded-full"></div>
            <span className="font-bold text-blue text-lg tracking-wider uppercase">
              Why Choose Us
            </span>
            <div className="w-12 h-1 bg-gradient-to-r from-purple to-orange rounded-full"></div>
          </div>
          <h2 className="font-bold text-2xl lg:text-heading-3 text-dark mb-6">
            Experience the <span className="text-blue">Ultimate</span> Digital Marketplace
          </h2>
          <p className="text-dark-4 text-lg max-w-[700px] mx-auto leading-relaxed">
            Discover what makes us the preferred choice for millions of digital code buyers worldwide. 
            Quality, speed, and security - all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative bg-gradient-to-br ${feature.bgGradient} ${feature.hoverBg} border ${feature.borderColor} rounded-2xl p-8 text-center transition-all duration-500 hover:scale-110 hover:-translate-y-3 hover:shadow-2xl ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-16 h-16 opacity-10 transform rotate-12 group-hover:rotate-45 transition-transform duration-500">
                <div className={`w-full h-full bg-gradient-to-br ${feature.bgGradient} rounded-lg`}></div>
              </div>

              {/* Icon */}
              <div className="text-5xl mb-6 group-hover:animate-bounce">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className={`font-bold text-xl ${feature.color} mb-4 group-hover:scale-105 transition-transform duration-300`}>
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-dark-3 leading-relaxed group-hover:text-dark-2 transition-colors duration-300">
                {feature.description}
              </p>

              {/* Hover indicator */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop-without-sidebar"
              className="inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-blue to-blue-dark text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg"
            >
              Start Shopping
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-10 py-4 bg-white hover:bg-gray-1 text-blue border-2 border-blue font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg"
            >
              Contact Support
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default FeatureHighlights;