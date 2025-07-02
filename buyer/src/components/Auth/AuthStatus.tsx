'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

/**
 * Component to display current authentication status - useful for testing
 */
export default function AuthStatus() {
  const { isAuthenticated, loading, token } = useAuth();

  if (loading) {
    return (
      <div className="bg-yellow-light-2 border border-yellow text-yellow-dark-2 px-4 py-3 rounded mb-4">
        <span className="block sm:inline">Checking authentication status...</span>
      </div>
    );
  }

  return (
    <div className={`border px-4 py-3 rounded mb-4 ${
      isAuthenticated 
        ? 'bg-green-light-6 border-green text-green-dark' 
        : 'bg-red-light-6 border-red text-red-dark'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <strong>Authentication Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          {token && (
            <div className="text-sm mt-1">
              Token: {token.substring(0, 10)}...
            </div>
          )}
        </div>
        <div className="space-x-2">
          {!isAuthenticated ? (
            <>
              <Link 
                href="/signin" 
                className="bg-blue-default hover:bg-blue-dark text-white font-bold py-2 px-4 rounded text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-green-default hover:bg-green-dark text-white font-bold py-2 px-4 rounded text-sm transition-colors"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="text-sm">
              Try visiting <Link href="/signin" className="underline text-blue-default hover:text-blue-dark">/signin</Link> or <Link href="/signup" className="underline text-blue-default hover:text-blue-dark">/signup</Link> - you should be redirected!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}