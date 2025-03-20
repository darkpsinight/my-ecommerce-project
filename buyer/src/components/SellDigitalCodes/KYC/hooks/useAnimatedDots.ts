import { useState, useEffect } from 'react';

/**
 * Custom hook for animating dots
 * @param active Whether the animation should be active
 * @param interval Animation interval in milliseconds
 * @returns Object with dotCount and getDots function
 */
export const useAnimatedDots = (active: boolean, interval = 500) => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    if (active) {
      const dotInterval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, interval);

      return () => clearInterval(dotInterval);
    }
  }, [active, interval]);

  const getDots = () => {
    return ".".repeat(dotCount);
  };

  return {
    dotCount,
    getDots
  };
}; 