"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const PricingShowcase = () => {
  const [activeCategory, setActiveCategory] = useState('platinum');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sellerCategories = [
    { id: 'platinum', name: 'Platinum Sellers', icon: '💎', color: 'from-blue to-blue-dark' },
    { id: 'gold', name: 'Gold Sellers', icon: '🥇', color: 'from-orange to-yellow' },
    { id: 'verified', name: 'Verified Pro', icon: '✅', color: 'from-green to-green-dark' },
    { id: 'rising', name: 'Rising Stars', icon: '🌟', color: 'from-purple to-purple-600' }
  ];

  const topSellers = {
    platinum: [
      { 
        id: 1,
        name: 'DigitalKing Pro', 
        avatar: '/images/sellers/seller1.jpg',
        rating: 4.9, 
        totalSales: '25.5K', 
        trustScore: 99,
        joinedDate: '2019',
        specialties: ['Gaming', 'Software'],
        responseTime: '< 1 hour',
        badges: ['Top Seller', 'Fast Delivery', 'Premium Support'],
        totalProducts: 250
      },
      { 
        id: 2,
        name: 'GameVault Elite', 
        avatar: '/images/sellers/seller2.jpg',
        rating: 4.8, 
        totalSales: '18.3K', 
        trustScore: 98,
        joinedDate: '2020',
        specialties: ['Gaming', 'Gift Cards'],
        responseTime: '< 2 hours',
        badges: ['Verified Pro', 'Quality Guarantee'],
        totalProducts: 180
      },
      { 
        id: 3,
        name: 'CodeMaster Pro', 
        avatar: '/images/sellers/seller3.jpg',
        rating: 4.9, 
        totalSales: '32.2K', 
        trustScore: 99,
        joinedDate: '2018',
        specialties: ['Software', 'Subscriptions'],
        responseTime: '< 30 mins',
        badges: ['Elite Seller', '24/7 Support', 'Instant Delivery'],
        totalProducts: 320
      },
      { 
        id: 4,
        name: 'MediaCodes Plus', 
        avatar: '/images/sellers/seller4.jpg',
        rating: 4.7, 
        totalSales: '14.2K', 
        trustScore: 97,
        joinedDate: '2020',
        specialties: ['Streaming', 'Entertainment'],
        responseTime: '< 1 hour',
        badges: ['Top Rated', 'Media Expert'],
        totalProducts: 95
      }
    ],
    gold: [
      { 
        id: 5,
        name: 'GameHub Gold', 
        avatar: '/images/sellers/seller5.jpg',
        rating: 4.8, 
        totalSales: '12.8K', 
        trustScore: 95,
        joinedDate: '2021',
        specialties: ['Gaming', 'Mobile'],
        responseTime: '< 2 hours',
        badges: ['Gold Seller', 'Quick Response'],
        totalProducts: 150
      },
      { 
        id: 6,
        name: 'PlayStore Gold', 
        avatar: '/images/sellers/seller6.jpg',
        rating: 4.7, 
        totalSales: '9.1K', 
        trustScore: 94,
        joinedDate: '2021',
        specialties: ['Gaming', 'Software'],
        responseTime: '< 3 hours',
        badges: ['Trusted Seller', 'Best Prices'],
        totalProducts: 120
      },
      { 
        id: 7,
        name: 'TechCodes Gold', 
        avatar: '/images/sellers/seller7.jpg',
        rating: 4.8, 
        totalSales: '11.5K', 
        trustScore: 96,
        joinedDate: '2020',
        specialties: ['Software', 'VPN'],
        responseTime: '< 1 hour',
        badges: ['Gold Badge', 'Tech Expert'],
        totalProducts: 200
      },
      { 
        id: 8,
        name: 'StreamCodes Gold', 
        avatar: '/images/sellers/seller8.jpg',
        rating: 4.6, 
        totalSales: '7.2K', 
        trustScore: 93,
        joinedDate: '2022',
        specialties: ['Streaming', 'Gift Cards'],
        responseTime: '< 2 hours',
        badges: ['Verified', 'Stream Specialist'],
        totalProducts: 85
      }
    ],
    verified: [
      { 
        id: 9,
        name: 'TrustCodes Verified', 
        avatar: '/images/sellers/seller9.jpg',
        rating: 4.7, 
        totalSales: '6.8K', 
        trustScore: 92,
        joinedDate: '2022',
        specialties: ['Gaming', 'Education'],
        responseTime: '< 4 hours',
        badges: ['Verified', 'Secure Deals'],
        totalProducts: 110
      },
      { 
        id: 10,
        name: 'SecureGaming Pro', 
        avatar: '/images/sellers/seller10.jpg',
        rating: 4.6, 
        totalSales: '5.9K', 
        trustScore: 91,
        joinedDate: '2022',
        specialties: ['Gaming', 'Security'],
        responseTime: '< 3 hours',
        badges: ['Pro Verified', 'Secure'],
        totalProducts: 95
      },
      { 
        id: 11,
        name: 'SafeStream Verified', 
        avatar: '/images/sellers/seller11.jpg',
        rating: 4.5, 
        totalSales: '4.5K', 
        trustScore: 90,
        joinedDate: '2023',
        specialties: ['Streaming', 'Mobile'],
        responseTime: '< 5 hours',
        badges: ['Verified', 'Safe Deals'],
        totalProducts: 75
      },
      { 
        id: 12,
        name: 'ProCodes Verified', 
        avatar: '/images/sellers/seller12.jpg',
        rating: 4.7, 
        totalSales: '8.5K', 
        trustScore: 93,
        joinedDate: '2021',
        specialties: ['Software', 'Subscriptions'],
        responseTime: '< 2 hours',
        badges: ['Pro Verified', 'Quality'],
        totalProducts: 130
      }
    ],
    rising: [
      { 
        id: 13,
        name: 'NewCoder Rising', 
        avatar: '/images/sellers/seller13.jpg',
        rating: 4.6, 
        totalSales: '1.8K', 
        trustScore: 88,
        joinedDate: '2023',
        specialties: ['Gaming', 'Software'],
        responseTime: '< 6 hours',
        badges: ['Rising Star', 'New Talent'],
        totalProducts: 45
      },
      { 
        id: 14,
        name: 'FreshGames Star', 
        avatar: '/images/sellers/seller14.jpg',
        rating: 4.5, 
        totalSales: '1.2K', 
        trustScore: 87,
        joinedDate: '2023',
        specialties: ['Gaming', 'Mobile'],
        responseTime: '< 8 hours',
        badges: ['Rising Star', 'Fresh'],
        totalProducts: 35
      },
      { 
        id: 15,
        name: 'StarCodes Rising', 
        avatar: '/images/sellers/seller15.jpg',
        rating: 4.6, 
        totalSales: '2.2K', 
        trustScore: 89,
        joinedDate: '2023',
        specialties: ['Gift Cards', 'Streaming'],
        responseTime: '< 4 hours',
        badges: ['Rising Star', 'Promising'],
        totalProducts: 60
      },
      { 
        id: 16,
        name: 'StreamStar Rising', 
        avatar: '/images/sellers/seller16.jpg',
        rating: 4.4, 
        totalSales: '950', 
        trustScore: 86,
        joinedDate: '2024',
        specialties: ['Streaming', 'Entertainment'],
        responseTime: '< 12 hours',
        badges: ['New Star', 'Entertainment'],
        totalProducts: 25
      }
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
            <span className="text-2xl">🏆</span>
            <span className="font-bold text-blue text-lg tracking-wider uppercase">
              Top Trusted
            </span>
            <span className="text-2xl">⭐</span>
          </div>
          <h2 className="text-2xl lg:text-heading-3 font-bold text-black mb-6">
            Best Sellers <span className="text-blue">Marketplace</span>
          </h2>
          <p className="text-black text-lg max-w-[700px] mx-auto leading-relaxed">
            Shop from our top-rated sellers with verified digital products. 
            These trusted merchants offer the best quality and customer service.
          </p>
        </div>

        {/* Seller Category Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {sellerCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`group relative px-6 py-3 rounded-2xl font-semibold transition-all duration-500 ${
                activeCategory === category.id
                  ? `bg-gradient-to-r ${category.color} text-white shadow-2xl scale-105`
                  : 'bg-white text-black border-2 border-gray-3 hover:border-blue-light-3 hover:scale-105'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl group-hover:animate-bounce">{category.icon}</span>
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* Top Sellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topSellers[activeCategory as keyof typeof topSellers].map((seller, index) => (
            <div
              key={seller.id}
              className={`group bg-gradient-to-br from-white to-gray-1 rounded-2xl p-6 border border-gray-3 hover:border-blue-light-3 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Category Badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue to-blue-dark text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                {sellerCategories.find(cat => cat.id === activeCategory)?.icon}
              </div>

              {/* Seller Profile */}
              <div className="text-center mb-4">
                {/* Avatar */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-3 group-hover:border-blue transition-colors">
                    <div className="w-full h-full bg-gradient-to-br from-blue-light-5 to-blue-light-3 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue">
                        {seller.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  {/* Online Status */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green rounded-full border-3 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-black mb-1 group-hover:text-blue transition-colors">
                  {seller.name}
                </h3>
                
                <div className="text-sm text-gray-6 mb-3">
                  Member since {seller.joinedDate}
                </div>
                
                {/* Rating & Sales */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow text-lg">⭐</span>
                    <span className="text-sm font-semibold text-black">{seller.rating}</span>
                  </div>
                  <div className="bg-blue-light-5 text-blue px-2 py-1 rounded-full text-xs font-medium">
                    {seller.totalSales} sales
                  </div>
                </div>
                
                {/* Trust Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-6">Trust Score</span>
                    <span className="text-sm font-semibold text-green">{seller.trustScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green to-green-dark rounded-full transition-all duration-500"
                      style={{ width: `${seller.trustScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {seller.specialties.map((specialty, idx) => (
                      <span key={idx} className="bg-blue-light-5 text-blue px-2 py-1 rounded-full text-xs font-medium">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex justify-between text-center mb-4">
                  <div>
                    <div className="text-sm font-bold text-black">{seller.totalProducts}</div>
                    <div className="text-xs text-gray-6">Products</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-black">{seller.responseTime}</div>
                    <div className="text-xs text-gray-6">Response</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link
                  href={`/seller/${seller.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="w-full bg-gradient-to-r from-blue to-blue-dark text-white font-semibold py-2 rounded-xl hover:from-blue-dark hover:to-purple transition-all duration-300 hover:scale-105 text-center block text-sm"
                >
                  View Store
                </Link>
                <button className="w-full bg-white text-blue border-2 border-blue font-semibold py-2 rounded-xl hover:bg-blue hover:text-white transition-all duration-300 text-sm">
                  Contact Seller
                </button>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-light-5 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10"></div>
            </div>
          ))}
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