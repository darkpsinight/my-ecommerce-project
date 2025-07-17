"use client";
import React from "react";

interface ErrorBoundaryProps {
  title: string;
  error?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

const ErrorBoundary = ({ title, error, onRetry, children }: ErrorBoundaryProps) => {
  if (!error) {
    return <>{children}</>;
  }

  return (
    <div className="bg-red-light-6 border border-red-light-4 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-red rounded-lg flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-red font-semibold">{title}</h3>
      </div>
      
      <div className="text-red-dark text-sm mb-4">
        {error || "An error occurred while loading data. Please try again."}
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-red hover:bg-red-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;