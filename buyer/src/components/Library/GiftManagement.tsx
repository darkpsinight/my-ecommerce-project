"use client";
import React from "react";
import Link from "next/link";

const GiftManagement: React.FC = () => {
  const upcomingFeatures = [
    {
      title: "Send Digital Gifts",
      description: "Send digital codes and game keys as gifts to friends and family with personalized messages.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 7h-3V6a3 3 0 00-6 0v1H8a1 1 0 00-1 1v11a3 3 0 003 3h8a3 3 0 003-3V8a1 1 0 00-1-1zM13 6v1h-2V6a1 1 0 012 0zm5 13a1 1 0 01-1 1h-8a1 1 0 01-1-1V9h2v1a1 1 0 002 0V9h2v1a1 1 0 002 0V9h2v10z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-yellow to-orange",
      delay: "0ms"
    },
    {
      title: "Gift Cards & Vouchers",
      description: "Purchase and manage gift cards for various platforms and services in one convenient location.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 7h-1V6a1 1 0 00-1-1H7a1 1 0 00-1 1v1H5a3 3 0 00-3 3v6a3 3 0 003 3h14a3 3 0 003-3v-6a3 3 0 00-3-3zM8 6h8v1H8V6zm12 13a1 1 0 01-1 1H5a1 1 0 01-1-1v-6a1 1 0 011-1h14a1 1 0 011 1v6z"
            fill="currentColor"
          />
          <circle cx="12" cy="15" r="2" fill="currentColor"/>
        </svg>
      ),
      gradient: "from-green to-teal",
      delay: "100ms"
    },
    {
      title: "Gift History & Tracking",
      description: "Track sent and received gifts with detailed delivery status and recipient confirmations.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
            fill="currentColor"
          />
          <path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586V7z" fill="currentColor"/>
        </svg>
      ),
      gradient: "from-blue to-blue-light",
      delay: "200ms"
    },
    {
      title: "Scheduled Gifts",
      description: "Schedule gifts to be delivered automatically on special dates, birthdays, and anniversaries.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-red to-red-light",
      delay: "300ms"
    },
    {
      title: "Gift Wrapping & Messages",
      description: "Add custom messages, digital gift wrapping, and themed templates to make gifts special.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-teal to-blue",
      delay: "400ms"
    },
    {
      title: "Group Gifting",
      description: "Collaborate with others to pool money together for larger gifts like premium game editions.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.996 1.996 0 0018.06 7H16c-.8 0-1.54.37-2.01.95L12 10l-1.99-2.05A2.498 2.498 0 008 7H5.94c-.8 0-1.53.37-2.01.95L1.39 12H4v10h3v-3h2v3h3v-6h2v6h4z"
            fill="currentColor"
          />
        </svg>
      ),
      gradient: "from-yellow-dark to-orange",
      delay: "500ms"
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow to-orange rounded-2xl mb-6 shadow-lg animate-pulse">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none">
            <path
              fillRule="evenodd"
              d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z"
              clipRule="evenodd"
              fill="currentColor"
            />
            <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" fill="currentColor" />
          </svg>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-dark to-orange bg-clip-text text-transparent mb-4">
          Gift Management
        </h2>
        <p className="text-lg text-gray-6 max-w-2xl mx-auto">
          Advanced gift management features are coming soon! Send, receive, and manage digital gifts with style.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-yellow/10 via-orange/10 to-red/10 border border-yellow/20 rounded-2xl p-6 mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow to-orange rounded-full flex items-center justify-center animate-spin-slow">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2v20M17 7l-5 5-5-5M12 17l-5-5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-orange-dark">Under Development</h3>
            <p className="text-sm text-gray-6">We&apos;re working hard to bring you amazing gift features</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-light-2 to-orange/20 rounded-lg p-4">
          <p className="text-sm text-gray-7">
            <strong>Expected Launch:</strong> Q2 2024 • 
            <strong className="ml-2">Features:</strong> 6+ exciting gift management tools
          </p>
        </div>
      </div>

      {/* Upcoming Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {upcomingFeatures.map((feature, index) => (
          <div
            key={index}
            className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 group opacity-0 animate-fade-in-up`}
            style={{ animationDelay: feature.delay }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark mb-2">{feature.title}</h3>
              </div>
            </div>
            <p className="text-gray-6 text-sm leading-relaxed">{feature.description}</p>
            
            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-5">Development Progress</span>
                <span className="text-xs font-medium text-gray-6">
                  {Math.floor(Math.random() * 30) + 20}%
                </span>
              </div>
              <div className="w-full bg-gray-2 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${feature.gradient} rounded-full h-2 transition-all duration-1000`}
                  style={{ width: `${Math.floor(Math.random() * 30) + 20}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Signup */}
      <div className="bg-gradient-to-br from-blue/5 to-teal/5 border border-blue/20 rounded-2xl p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-dark mb-4">Get Notified When Gift Features Launch</h3>
          <p className="text-gray-6 mb-6">
            Be the first to know when our comprehensive gift management system goes live. 
            We&apos;ll send you early access and exclusive features.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 border border-gray-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue to-teal text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap">
              Notify Me
            </button>
          </div>
          
          <p className="text-xs text-gray-5 mt-3">
            We&apos;ll only email you about gift feature updates. Unsubscribe anytime.
          </p>
        </div>
      </div>

      {/* Current Alternative */}
      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold text-dark mb-4">In the Meantime...</h3>
        <p className="text-gray-6 mb-6">
          While we build these amazing gift features, you can still share your purchased codes manually 
          or explore our current marketplace offerings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/shop-with-sidebar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal to-blue text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Browse Products
          </Link>
          <Link
            href="/library?section=codes"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-7 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Back to My Codes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GiftManagement;