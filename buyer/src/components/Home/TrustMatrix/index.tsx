"use client";
import { useEffect, useState } from "react";

const TrustMatrix = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const trustFeatures = [
    {
      icon: '⚡',
      title: 'Instant Delivery',
      description: 'Receive in <60s',
      color: 'text-yellow',
      bgColor: 'bg-yellow-light-4',
      borderColor: 'border-yellow-light-2'
    },
    {
      icon: '✅',
      title: 'Verified Sellers',
      description: 'ID-Checked Partners',
      color: 'text-green',
      bgColor: 'bg-green-light-6',
      borderColor: 'border-green-light-4'
    },
    {
      icon: '🌎',
      title: 'Global Codes',
      description: '120+ Regions',
      color: 'text-blue',
      bgColor: 'bg-blue-light-5',
      borderColor: 'border-blue-light-3'
    },
    {
      icon: '🛡️',
      title: 'Secure Payments',
      description: '256-bit Encryption',
      color: 'text-purple',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <section className="py-10 lg:py-12.5 xl:py-15 bg-white">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-heading-5 font-semibold text-dark mb-2">
            Why Choose Our Platform?
          </h2>
          <p className="text-dark-4">Trusted by thousands of buyers worldwide</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {trustFeatures.map((feature, index) => (
            <div
              key={index}
              className={`${mounted ? 'animate-fade-in' : ''} bg-white border ${feature.borderColor} rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 mx-auto mb-4 ${feature.bgColor} rounded-full flex items-center justify-center text-2xl`}>
                {feature.icon}
              </div>
              
              <h3 className={`font-semibold text-lg ${feature.color} mb-2`}>
                {feature.title}
              </h3>
              
              <p className="text-dark-4 text-sm font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional trust indicators */}
        <div className="mt-12 pt-8 border-t border-gray-3">
          <div className="flex flex-wrap justify-center items-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green rounded-full animate-pulse"></div>
              <span className="text-sm text-dark-4 font-medium">24/7 Live Support</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span className="text-sm text-dark-4 font-medium">SSL Secured</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <span className="text-sm text-dark-4 font-medium">Money Back Guarantee</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              <span className="text-sm text-dark-4 font-medium">Trusted Worldwide</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default TrustMatrix;