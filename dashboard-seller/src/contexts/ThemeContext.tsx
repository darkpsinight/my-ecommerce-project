import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type ThemeContextType = {
  theme: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: string) => void;
};

const defaultContext: ThemeContextType = {
  theme: 'PureLightTheme',
  isDarkMode: false,
  toggleTheme: () => {},
  setTheme: () => {}
};

export const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get initial theme from localStorage or use system preference
  const getInitialTheme = (): string => {
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem('dashboard-seller-theme-preference');
    if (storedTheme) {
      return storedTheme;
    }

    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'PureDarkTheme';
      }
    }

    // Default to light theme
    return 'PureLightTheme';
  };

  const [theme, setTheme] = useState<string>(getInitialTheme);
  const isDarkMode = theme === 'PureDarkTheme';

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('dashboard-seller-theme-preference', theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Only update if user hasn't explicitly set a preference
        if (!localStorage.getItem('dashboard-seller-theme-preference')) {
          setTheme(e.matches ? 'PureDarkTheme' : 'PureLightTheme');
        }
      };

      // Add listener for changes
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.addListener(handleChange);
      }

      // Cleanup
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          // For older browsers
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'PureLightTheme' : 'PureDarkTheme');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
