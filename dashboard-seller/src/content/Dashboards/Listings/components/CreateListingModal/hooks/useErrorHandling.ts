import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook to handle error states and notifications
 */
export const useErrorHandling = () => {
  const [error, setError] = useState<string | null>(null);
  const bottomErrorRef = useRef<HTMLDivElement | null>(null);

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      // Use toast.error instead of custom toast with JSX
      toast.error(error, { duration: 10000 });
      setError(null);
    }
  }, [error]);

  // Scroll to error when it appears
  useEffect(() => {
    if (error && bottomErrorRef.current) {
      bottomErrorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [error]);

  return {
    error,
    setError,
    bottomErrorRef
  };
};
