import React, { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material';
import { themeCreator } from './base';
import { StylesProvider } from '@mui/styles';
import { useThemeContext, ThemeContextProvider } from 'src/contexts/ThemeContext';

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

const ThemeProviderContent: React.FC<ThemeProviderWrapperProps> = ({ children }) => {
  const { theme } = useThemeContext();
  const currentTheme = themeCreator(theme);

  return (
    <StylesProvider injectFirst>
      <ThemeProvider theme={currentTheme}>{children}</ThemeProvider>
    </StylesProvider>
  );
};

const ThemeProviderWrapper: React.FC<ThemeProviderWrapperProps> = ({ children }) => {
  return (
    <ThemeContextProvider>
      <ThemeProviderContent>{children}</ThemeProviderContent>
    </ThemeContextProvider>
  );
};

export default ThemeProviderWrapper;
