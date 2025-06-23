"use client";
import { useState, useEffect } from "react";

const InteractiveStats = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statCategories = [
    {
      id: 'global',
      title: 'Global Reach',
      icon: '🌍',
      color: 'from-blue to-blue-dark',
      stats: [
        { label: 'Countries Served', value: '195', suffix: '+', icon: '🏳️' },
        { label: 'Languages Support', value: '25', suffix: '+', icon: '🗣️' },
        { label: 'Time Zones', value: '24', suffix: '/7', icon: '⏰' },
        { label: 'Global Partners', value: '500', suffix: '+', icon: '🤝' }
      ]
    },
    {
      id: 'security',
      title: 'Security & Trust',
      icon: '🔒',
      color: 'from-green to-green-dark',
      stats: [
        { label: 'SSL Encryption', value: '256', suffix: '-bit', icon: '🛡️' },
        { label: 'Fraud Detection', value: '99.9', suffix: '%', icon: '🎯' },
        { label: 'Verified Sellers', value: '10K', suffix: '+', icon: '✅' },
        { label: 'Safe Transactions', value: '99.8', suffix: '%', icon: '💳' }
      ]
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: '⚡',
      color: 'from-orange to-red',
      stats: [
        { label: 'Avg Delivery Time', value: '30', suffix: 's', icon: '🚀' },
        { label: 'Server Uptime', value: '99.99', suffix: '%', icon: '💪' },
        { label: 'API Response', value: '50', suffix: 'ms', icon: '⏱️' },
        { label: 'Success Rate', value: '99.7', suffix: '%', icon: '🎊' }
      ]
    },
    {
      id: 'community',
      title: 'Community',
      icon: '👥',
      color: 'from-purple to-pink-500',
      stats: [
        { label: 'Active Users', value: '50K', suffix: '+', icon: '👤' },
        { label: 'Daily Orders', value: '2.5K', suffix: '+', icon: '📦' },
        { label: 'Reviews Posted', value: '25K', suffix: '+', icon: '⭐' },
        { label: 'Support Rating', value: '4.9', suffix: '/5', icon: '💝' }
      ]
    }
  ];

  return (
    <section className="py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-gray-1 via-white to-blue-light-5 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-8 gap-4 h-full">
          {[...Array(64)].map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-blue to-purple rounded-full w-3 h-3 animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-gradient-to-r from-blue to-purple rounded-full animate-spin"></div>
            <span className="font-bold text-blue text-lg tracking-wider uppercase">
              Live Statistics
            </span>
            <div className="w-3 h-3 bg-gradient-to-r from-purple to-orange rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl lg:text-heading-3 font-bold text-dark mb-6">
            Real-time <span className="text-blue">Platform Metrics</span>
          </h2>
          <p className="text-dark-4 text-lg max-w-[700px] mx-auto leading-relaxed">
            Explore our platform&apos;s performance across different dimensions. 
            All data updates in real-time to show our commitment to excellence.
          </p>
        </div>

        {/* Interactive Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {statCategories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(index)}
              className={`group relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-500 ${
                activeTab === index
                  ? `bg-gradient-to-r ${category.color} text-white shadow-2xl scale-105`
                  : 'bg-white text-dark-3 hover:text-blue border-2 border-gray-3 hover:border-blue-light-3 hover:scale-105'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl group-hover:animate-bounce">{category.icon}</span>
                {category.title}
              </span>
              
              {activeTab === index && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-white to-gray-1 rotate-45"></div>
              )}
            </button>
          ))}
        </div>

        {/* Stats Display */}
        <div className="relative">
          {statCategories.map((category, categoryIndex) => (
            <div
              key={category.id}
              className={`transition-all duration-700 ${
                activeTab === categoryIndex
                  ? 'opacity-100 transform translate-y-0'
                  : 'opacity-0 transform translate-y-8 absolute inset-0 pointer-events-none'
              }`}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {category.stats.map((stat, statIndex) => (
                  <div
                    key={statIndex}
                    className={`group bg-gradient-to-br from-white to-gray-1 rounded-2xl p-8 border border-gray-3 hover:border-blue-light-3 hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-3 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: `${statIndex * 0.1}s` }}
                  >
                    {/* Background decoration */}
                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${category.color} opacity-10 rounded-full transform translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500`}></div>
                    
                    {/* Icon */}
                    <div className="text-4xl mb-4 group-hover:animate-bounce">
                      {stat.icon}
                    </div>
                    
                    {/* Value */}
                    <div className="mb-3">
                      <span className="text-3xl lg:text-4xl font-bold text-dark group-hover:scale-110 transition-transform duration-300 inline-block">
                        {stat.value}
                      </span>
                      <span className="text-2xl font-semibold text-blue ml-1">
                        {stat.suffix}
                      </span>
                    </div>
                    
                    {/* Label */}
                    <p className="text-dark-3 font-medium group-hover:text-dark-2 transition-colors">
                      {stat.label}
                    </p>

                    {/* Hover indicator */}
                    <div className={`absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl`}></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <button className="px-10 py-4 bg-gradient-to-r from-blue to-purple text-white font-bold rounded-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 text-lg">
              View Detailed Analytics
              <span className="ml-2">📊</span>
            </button>
            <button className="px-10 py-4 bg-white border-2 border-blue text-blue font-bold rounded-xl hover:bg-blue hover:text-white hover:scale-105 transition-all duration-300 text-lg">
              Join Our Community
              <span className="ml-2">🚀</span>
            </button>
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

export default InteractiveStats;