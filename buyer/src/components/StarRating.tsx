"use client";
import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  readonly = false,
  showValue = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const handleStarHover = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      setHoverRating(starIndex + 1);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly && onRatingChange) {
      setHoverRating(0);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5" onMouseLeave={handleMouseLeave}>
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const currentRating = hoverRating || rating;
          const isFilled = starIndex < Math.floor(currentRating);
          const isHalfFilled = starIndex === Math.floor(currentRating) && currentRating % 1 !== 0;
          
          return (
            <button
              key={starIndex}
              type="button"
              className={`
                ${sizeClasses[size]} 
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
                focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-1 rounded
              `}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              disabled={readonly}
              aria-label={`${starIndex + 1} star${starIndex + 1 === 1 ? '' : 's'}`}
            >
              {isHalfFilled ? (
                <div className="relative">
                  <svg
                    className={`${sizeClasses[size]} text-gray-3`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                  <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                    <svg
                      className={`${sizeClasses[size]} text-yellow`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <svg
                  className={`${sizeClasses[size]} ${
                    isFilled ? 'text-yellow' : 'text-gray-3'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-6 ml-2">
          {rating.toFixed(1)} out of 5
        </span>
      )}
    </div>
  );
};

export default StarRating;