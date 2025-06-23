"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface DynamicInventoryProps {
  totalProducts?: number;
}

const DynamicInventory = ({ totalProducts = 0 }: DynamicInventoryProps) => {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubscribed(true);
    setEmail("");
    setIsLoading(false);
  };

  // If inventory is low (< 15), show "Coming Soon" section
  if (totalProducts < 15) {
    return (
      <section className="py-10 lg:py-12.5 xl:py-15 bg-gradient-to-br from-blue-light-5 to-blue-light-4">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="text-center">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-light-3 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl lg:text-heading-5 font-semibold text-dark mb-4">
                  Coming Soon
                </h2>
                
                <p className="text-lg text-dark-4 mb-6">
                  New Steam Keys Arriving Friday!
                </p>
                
                <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                    <span className="text-2xl">🎮</span>
                    <span className="text-sm font-medium text-dark">Premium Games</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                    <span className="text-2xl">🌍</span>
                    <span className="text-sm font-medium text-dark">Global Codes</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                    <span className="text-2xl">⚡</span>
                    <span className="text-sm font-medium text-dark">Instant Delivery</span>
                  </div>
                </div>
              </div>

              {!isSubscribed ? (
                <form onSubmit={handleNotifyMe} className="max-w-md mx-auto">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 border border-gray-3 rounded-lg focus:outline-none focus:border-blue text-dark"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue hover:bg-blue-dark text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Notifying...</span>
                        </div>
                      ) : (
                        'Notify Me'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="max-w-md mx-auto bg-green-light-6 border border-green-light-4 rounded-lg p-6">
                  <div className="flex items-center justify-center gap-2 text-green mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">You&apos;re all set!</span>
                  </div>
                  <p className="text-dark-4 text-sm">
                    We&apos;ll notify you when new codes arrive.
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-blue-light-3">
                <p className="text-sm text-dark-4 mb-4">
                  Meanwhile, explore our current collection:
                </p>
                <Link
                  href="/shop-without-sidebar"
                  className="inline-flex items-center gap-2 text-blue hover:text-blue-dark font-medium transition-colors"
                >
                  Browse Available Codes
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If inventory is good (> 15), show "Deal of the Day" banner
  return (
    <section className="py-6 bg-gradient-to-r from-orange to-red">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="flex flex-col sm:flex-row items-center justify-between text-white">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Deal of the Day</h3>
              <p className="text-white text-opacity-90 text-sm">
                Up to 50% off on selected digital codes - Limited time!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-white text-opacity-90">Ends in</div>
              <div className="font-bold text-lg">
                {mounted && (
                  <span className="countdown">
                    23:59:45
                  </span>
                )}
              </div>
            </div>
            
            <Link
              href="/shop-without-sidebar?deal=today"
              className="bg-white text-orange font-medium px-6 py-3 rounded-lg hover:bg-gray-1 transition-all duration-300 hover:scale-105"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DynamicInventory;