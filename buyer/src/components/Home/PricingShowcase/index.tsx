"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const PricingShowcase = () => {
  const [activeRegion, setActiveRegion] = useState('global');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const regions = [
    { id: 'global', name: 'Global', flag: '🌍', color: 'from-blue to-blue-dark' },
    { id: 'us', name: 'United States', flag: '🇺🇸', color: 'from-red to-red-600' },
    { id: 'eu', name: 'Europe', flag: '🇪🇺', color: 'from-green to-green-dark' },
    { id: 'asia', name: 'Asia Pacific', flag: '🌏', color: 'from-purple to-purple-600' }
  ];

  const products = {
    global: [
      { name: 'Steam Wallet $50', price: 45.99, originalPrice: 50.00, discount: 8, rating: 4.9, sales: '2.5K' },
      { name: 'PlayStation Plus Premium', price: 89.99, originalPrice: 99.99, discount: 10, rating: 4.8, sales: '1.8K' },
      { name: 'Xbox Game Pass Ultimate', price: 119.99, originalPrice: 129.99, discount: 8, rating: 4.9, sales: '3.2K' },
      { name: 'Netflix Gift Card $100', price: 95.99, originalPrice: 100.00, discount: 4, rating: 4.7, sales: '1.2K' }
    ],
    us: [
      { name: 'Steam Wallet $50', price: 47.99, originalPrice: 50.00, discount: 4, rating: 4.8, sales: '800' },
      { name: 'PlayStation Plus Premium', price: 94.99, originalPrice: 99.99, discount: 5, rating: 4.7, sales: '650' },
      { name: 'Xbox Game Pass Ultimate', price: 124.99, originalPrice: 129.99, discount: 4, rating: 4.8, sales: '1.1K' },
      { name: 'Netflix Gift Card $100', price: 98.99, originalPrice: 100.00, discount: 1, rating: 4.6, sales: '450' }
    ],
    eu: [
      { name: 'Steam Wallet €50', price: 43.99, originalPrice: 50.00, discount: 12, rating: 4.9, sales: '1.2K' },
      { name: 'PlayStation Plus Premium', price: 84.99, originalPrice: 99.99, discount: 15, rating: 4.8, sales: '900' },
      { name: 'Xbox Game Pass Ultimate', price: 114.99, originalPrice: 129.99, discount: 12, rating: 4.9, sales: '1.5K' },
      { name: 'Netflix Gift Card €100', price: 92.99, originalPrice: 100.00, discount: 7, rating: 4.7, sales: '680' }
    ],
    asia: [
      { name: 'Steam Wallet $50', price: 39.99, originalPrice: 50.00, discount: 20, rating: 4.9, sales: '3.5K' },
      { name: 'PlayStation Plus Premium', price: 79.99, originalPrice: 99.99, discount: 20, rating: 4.8, sales: '2.1K' },
      { name: 'Xbox Game Pass Ultimate', price: 109.99, originalPrice: 129.99, discount: 15, rating: 4.9, sales: '2.8K' },
      { name: 'Netflix Gift Card $100', price: 89.99, originalPrice: 100.00, discount: 10, rating: 4.7, sales: '1.5K' }
    ]
  };

  return (
    <section className="py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-white via-purple-50 to-blue-light-5 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-8 h-8 bg-gradient-to-br from-blue to-purple rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-2xl animate-bounce">💰</span>
            <span className="font-bold text-blue text-lg tracking-wider uppercase">
              Best Prices
            </span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎯</span>
          </div>
          <h2 className="text-2xl lg:text-heading-3 font-bold text-dark mb-6">
            Compare Prices by <span className="text-blue">Region</span>
          </h2>
          <p className="text-dark-4 text-lg max-w-[700px] mx-auto leading-relaxed">
            Get the best deals on digital codes with our regional pricing. 
            Our dynamic pricing ensures you always get the most competitive rates.
          </p>
        </div>

        {/* Region Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setActiveRegion(region.id)}
              className={`group relative px-6 py-3 rounded-2xl font-semibold transition-all duration-500 ${
                activeRegion === region.id
                  ? `bg-gradient-to-r ${region.color} text-white shadow-2xl scale-105`
                  : 'bg-white text-dark-3 hover:text-blue border-2 border-gray-3 hover:border-blue-light-3 hover:scale-105'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl group-hover:animate-bounce">{region.flag}</span>
                {region.name}
              </span>
            </button>
          ))}
        </div>

        {/* Price Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products[activeRegion as keyof typeof products].map((product, index) => (
            <div
              key={index}
              className={`group bg-gradient-to-br from-white to-gray-1 rounded-2xl p-6 border border-gray-3 hover:border-blue-light-3 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Discount Badge */}
              {product.discount > 0 && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red to-orange text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                  -{product.discount}%
                </div>
              )}

              {/* Product Info */}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-dark mb-2 group-hover:text-blue transition-colors">
                  {product.name}
                </h3>
                
                {/* Rating & Sales */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow text-lg">⭐</span>
                    <span className="text-sm font-semibold text-dark">{product.rating}</span>
                  </div>
                  <div className="bg-blue-light-5 text-blue px-2 py-1 rounded-full text-xs font-medium">
                    {product.sales} sold
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green">
                      ${product.price}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-dark-4 line-through text-lg">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-dark-4">
                    💳 Instant delivery • 🔒 Secure payment
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/shop-details/${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="w-full bg-gradient-to-r from-blue to-blue-dark text-white font-semibold py-3 rounded-xl hover:from-blue-dark hover:to-purple transition-all duration-300 hover:scale-105 text-center block shadow-lg hover:shadow-xl"
              >
                Buy Now
              </Link>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-light-5 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10"></div>
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-8 text-dark-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚀</span>
              <span className="font-medium">Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <span className="font-medium">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="font-medium">Verified Codes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💯</span>
              <span className="font-medium">Money Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default PricingShowcase;