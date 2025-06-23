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
    <section className="py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-white via-blue-light-5 to-purple-50">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="text-center mb-16">
          <h2 className="text-2xl lg:text-heading-4 font-bold text-dark mb-4">
            Why Choose <span className="text-blue">Our Platform</span>?
          </h2>
          <p className="text-dark-4 text-lg max-w-[600px] mx-auto">
            Join thousands of satisfied buyers who trust us for secure, instant digital code delivery worldwide
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustFeatures.map((feature, index) => (
            <div
              key={index}
              className={`${mounted ? 'animate-fade-in' : ''} bg-white border ${feature.borderColor} rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-2 group`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className={`w-20 h-20 mx-auto mb-6 ${feature.bgColor} rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              <h3 className={`font-bold text-xl ${feature.color} mb-3 group-hover:scale-105 transition-transform duration-300`}>
                {feature.title}
              </h3>
              
              <p className="text-dark-4 text-base font-medium group-hover:text-dark-3 transition-colors">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional trust indicators */}
        <div className="mt-16 pt-12 border-t border-gray-3">
          <div className="flex flex-wrap justify-center items-center gap-12 text-center">
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