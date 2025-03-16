import React from 'react';

interface AgeVerificationBadgeProps {
  age: number | null;
}

export const AgeVerificationBadge: React.FC<AgeVerificationBadgeProps> = ({ age }) => {
  if (age === null) return null;

  if (age >= 18) {
    return (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-3 flex items-center gap-1.5 bg-green-light-6 px-2 py-1 rounded-md">
        <svg 
          className="w-4 h-4 text-green" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
            clipRule="evenodd" 
          />
        </svg>
        <span className="text-sm font-semibold text-green">18+ verified</span>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-3 flex items-center gap-1.5 bg-red-light-6 px-2 py-1 rounded-md">
      <svg 
        className="w-4 h-4 text-red" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
          clipRule="evenodd" 
        />
      </svg>
      <span className="text-sm font-semibold text-red">Must be 18+</span>
    </div>
  );
}; 