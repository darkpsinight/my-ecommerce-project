import { useEffect, useRef } from 'react';

interface UseTabVisibilityOptions {
  onVisible?: () => void;
  onHidden?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Hook to detect tab visibility changes and window focus/blur events
 * Useful for refreshing authentication tokens when user returns to tab
 */
export const useTabVisibility = (options: UseTabVisibilityOptions = {}) => {
  const { onVisible, onHidden, onFocus, onBlur } = options;
  
  // Use refs to ensure we have the latest callback functions
  const onVisibleRef = useRef(onVisible);
  const onHiddenRef = useRef(onHidden);
  const onFocusRef = useRef(onFocus);
  const onBlurRef = useRef(onBlur);

  // Update refs when callbacks change
  useEffect(() => {
    onVisibleRef.current = onVisible;
    onHiddenRef.current = onHidden;
    onFocusRef.current = onFocus;
    onBlurRef.current = onBlur;
  }, [onVisible, onHidden, onFocus, onBlur]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onHiddenRef.current?.();
      } else {
        onVisibleRef.current?.();
      }
    };

    // Handle window focus/blur (switching between applications)
    const handleFocus = () => {
      onFocusRef.current?.();
    };

    const handleBlur = () => {
      onBlurRef.current?.();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Return current visibility state
  const isVisible = typeof window !== 'undefined' ? !document.hidden : true;
  const isFocused = typeof window !== 'undefined' ? document.hasFocus() : true;

  return {
    isVisible,
    isFocused,
    isActive: isVisible && isFocused
  };
};