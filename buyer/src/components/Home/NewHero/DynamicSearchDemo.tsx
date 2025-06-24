"use client";
import { useState, useEffect } from "react";
import HeroSearchBar from "./HeroSearchBar";

interface DynamicSearchDemoProps {
  showDemo?: boolean;
}

const DynamicSearchDemo: React.FC<DynamicSearchDemoProps> = ({ showDemo = false }) => {
  const [showExtraText, setShowExtraText] = useState(false);
  const [extraContent, setExtraContent] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (showDemo) {
      // Simulate dynamic content appearing
      const timer1 = setTimeout(() => {
        setExtraContent(["🔥 Hot Deal!"]);
      }, 2000);

      const timer2 = setTimeout(() => {
        setExtraContent(["🔥 Hot Deal!", "⚡ Flash Sale"]);
      }, 4000);

      const timer3 = setTimeout(() => {
        setExtraContent(["🔥 Hot Deal!", "⚡ Flash Sale", "🎯 50% Off"]);
      }, 6000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [showDemo]);

  if (!mounted) return null;

  return (
    <div className="w-full">
      {/* Container that demonstrates dynamic width behavior */}
      <div className="flex items-center gap-2 sm:gap-4 w-full">
        {/* Search bar takes available space */}
        <div className="flex-1 min-w-0">
          <HeroSearchBar />
        </div>
        
        {/* Dynamic content that appears and affects search bar width */}
        {(showExtraText || extraContent.length > 0) && (
          <div className="flex gap-2 transition-all duration-500 ease-in-out">
            {extraContent.map((content, index) => (
              <div
                key={content}
                className="bg-gradient-to-r from-green to-green-light text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg shadow-lg animate-pulse flex-shrink-0"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                  {content}
                </span>
              </div>
            ))}
            {showExtraText && (
              <div className="bg-gradient-to-r from-blue to-blue-light text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg shadow-lg animate-pulse flex-shrink-0">
                <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                  🚀 New!
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Demo controls */}
      {showDemo && (
        <div className="mt-4 text-center space-y-2">
          <button
            onClick={() => setShowExtraText(!showExtraText)}
            className="px-4 py-2 bg-blue-light-5 hover:bg-blue-light-4 text-blue-dark rounded-lg transition-colors duration-200 text-sm font-medium mr-2"
          >
            {showExtraText ? "Hide Manual Content" : "Add Manual Content"}
          </button>
          <button
            onClick={() => setExtraContent([])}
            className="px-4 py-2 bg-red-light-5 hover:bg-red-light-4 text-red-dark rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            Clear All
          </button>
          <div className="text-xs text-gray-500 mt-2">
            Watch how the search bar dynamically adjusts its width as content appears
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicSearchDemo;