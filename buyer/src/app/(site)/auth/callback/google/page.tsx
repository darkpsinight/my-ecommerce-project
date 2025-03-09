'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setTokens } from '@/redux/features/auth-slice';

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        
        if (!code) {
          setError('Authorization code not found');
          return;
        }

        // Send the code to your backend API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
          credentials: 'include',
        });

        // Check if we have cookies set, which would indicate successful authentication
        // even if the response contains an error
        const cookies = document.cookie;
        const hasRefreshToken = cookies.includes('refreshToken');
        const hasCsrfToken = cookies.includes('_csrf');
        const isLikelyAuthenticated = hasRefreshToken && hasCsrfToken;
        
        if (isLikelyAuthenticated) {
          setIsAuthenticated(true);
          setStatus('Authentication successful! Redirecting...');
          
          const data = await response.json();
          
          // Update Redux store with tokens
          if (data.token && data.verifyToken) {
            dispatch(setTokens({
              token: data.token,
              verifyToken: data.verifyToken
            }));
          }
          
          setTimeout(() => {
            router.push('/');
          }, 1500);
          return;
        }
        
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Authentication failed');
        }

        // Update Redux store with tokens
        if (data.token && data.verifyToken) {
          dispatch(setTokens({
            token: data.token,
            verifyToken: data.verifyToken
          }));
        }

        // Store tokens or user data in localStorage or state management
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Redirect to home page or dashboard
        setIsAuthenticated(true);
        setStatus('Authentication successful! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (err) {
        console.error('Authentication error:', err);
        
        // Check if we have cookies set despite the error
        const cookies = document.cookie;
        const hasRefreshToken = cookies.includes('refreshToken');
        const hasCsrfToken = cookies.includes('_csrf');
        
        if (hasRefreshToken && hasCsrfToken) {
          // We likely have a successful authentication despite the error
          setIsAuthenticated(true);
          setStatus('Authentication successful! Redirecting...');
          
          // Try to get tokens from the error response if available
          if (err.response?.data?.token && err.response?.data?.verifyToken) {
            dispatch(setTokens({
              token: err.response.data.token,
              verifyToken: err.response.data.verifyToken
            }));
          }
          
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          setError(err instanceof Error ? err.message : 'Authentication failed');
        }
      }
    };

    handleCallback();
  }, [router, searchParams, dispatch]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center">Google Authentication</h1>
        
        {isAuthenticated ? (
          <div className="text-center">
            <p className="mb-4">{status}</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full animate-pulse bg-blue-600" style={{ width: '100%' }}></div>
            </div>
          </div>
        ) : error ? (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
            <p>{error}</p>
            <button 
              onClick={() => router.push('/signin')} 
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">{status}</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full animate-pulse bg-blue-600" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 