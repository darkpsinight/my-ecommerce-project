"use client";
import { useEffect, useState } from "react";

const LoadingAnimation = () => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsVisible(false), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br from-blue via-purple to-blue-dark flex items-center justify-center transition-opacity duration-500 ${progress >= 100 ? 'opacity-0' : 'opacity-100'}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-white to-yellow rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <span className="text-3xl">🎮</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Digital<span className="text-yellow">Codes</span>
          </h1>
          <p className="text-blue-light-2 text-lg">
            Loading your marketplace...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 max-w-sm mx-auto">
          <div className="relative">
            <div className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow via-orange to-green rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 text-white font-semibold">
              {progress}%
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-8 text-blue-light-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;