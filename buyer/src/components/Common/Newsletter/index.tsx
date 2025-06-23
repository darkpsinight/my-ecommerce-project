"use client";
import { useState } from "react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setEmail("");
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <section className="py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-blue via-blue-dark to-purple-600 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-6 h-6 bg-white rounded-full animate-pulse"
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

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-yellow to-orange rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-gradient-to-br from-green to-blue-light-2 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-purple-100 to-white rounded-full opacity-30 animate-ping"></div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 relative z-10">
        <div className="text-center max-w-[800px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-3 mb-4">
              <span className="text-3xl animate-bounce">📧</span>
              <span className="font-bold text-yellow text-lg tracking-wider uppercase">
                Stay Updated
              </span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>🔔</span>
            </span>
            
            <h2 className="text-2xl lg:text-heading-3 font-bold text-white mb-6 leading-tight">
              Never Miss a <span className="text-yellow">Great Deal</span> Again
            </h2>
            
            <p className="text-blue-light-2 text-lg leading-relaxed max-w-[600px] mx-auto">
              Subscribe to our newsletter and be the first to know about exclusive discounts, 
              new arrivals, and special promotions on digital codes worldwide.
            </p>
          </div>

          {/* Newsletter Form */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
            {isSuccess ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green rounded-full mb-4 animate-bounce">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Successfully Subscribed!</h3>
                <p className="text-blue-light-2">Thank you for joining our community. Check your email for confirmation.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-6 py-4 rounded-xl border-2 border-transparent bg-white focus:border-yellow focus:outline-none text-dark placeholder-dark-4 font-medium text-lg transition-all duration-300"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-4 bg-gradient-to-r from-yellow to-orange text-dark font-bold rounded-xl hover:from-orange hover:to-yellow transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-lg whitespace-nowrap"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
                        Subscribing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Subscribe Now
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-blue-light-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Exclusive Deals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Weekly Updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>No Spam Promise</span>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-8 text-blue-light-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="font-medium">25K+ Subscribers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span className="font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <span className="font-medium">Exclusive Offers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;