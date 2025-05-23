import { useContext } from 'react';
import { ThemeContext } from 'src/contexts/ThemeContext';

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider');
  }
  
  return context;
};

export default useThemeMode;
