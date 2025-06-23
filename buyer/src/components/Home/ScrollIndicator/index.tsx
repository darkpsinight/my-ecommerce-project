"use client";
import { useEffect, useState } from "react";

const ScrollIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / scrollHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", updateScrollProgress);
    updateScrollProgress(); // Initial call

    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-1 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue via-purple to-green transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* Progress Dots - Side Indicator */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-4">
        <div className="flex flex-col gap-2">
          {['Hero', 'Stats', 'Categories', 'Featured', 'Deals', 'Trust', 'Features', 'Interactive', 'Pricing', 'Inventory', 'Reviews', 'Newsletter'].map((section, index) => {
            const sectionProgress = (index + 1) * (100 / 12);
            const isActive = scrollProgress >= sectionProgress - (100/12) && scrollProgress < sectionProgress;
            const isPassed = scrollProgress >= sectionProgress;
            
            return (
              <div key={index} className="relative group">
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                    isPassed
                      ? 'bg-blue border-blue scale-125'
                      : isActive
                      ? 'bg-blue-light-3 border-blue scale-110 animate-pulse'
                      : 'bg-transparent border-gray-3 hover:border-blue-light-3'
                  }`}
                />
                
                {/* Tooltip */}
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-dark text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                    {section}
                  </div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-dark rotate-45"></div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Progress Text */}
        <div className="mt-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <span className="text-xs font-bold text-blue">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      </div>
    </>
  );
};

export default ScrollIndicator;