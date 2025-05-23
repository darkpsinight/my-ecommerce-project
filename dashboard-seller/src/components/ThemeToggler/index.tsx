import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeContext } from 'src/contexts/ThemeContext';

const ThemeToggleButton = styled(IconButton)(
  ({ theme }) => `
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease-in-out;
    margin-left: ${theme.spacing(1)};
    margin-right: ${theme.spacing(1)};
    background: ${theme.palette.mode === 'dark' ? theme.colors.alpha.trueWhite[10] : theme.colors.alpha.black[5]};
    color: ${theme.palette.mode === 'dark' ? theme.colors.alpha.trueWhite[70] : theme.colors.alpha.black[70]};
    
    &:hover {
      background: ${theme.palette.mode === 'dark' ? theme.colors.alpha.trueWhite[20] : theme.colors.alpha.black[10]};
      color: ${theme.palette.mode === 'dark' ? theme.colors.alpha.trueWhite[100] : theme.colors.alpha.black[100]};
    }
`
);

const ThemeToggler: React.FC = () => {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const theme = useTheme();

  return (
    <Tooltip
      arrow
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <ThemeToggleButton
        onClick={toggleTheme}
        aria-label={isDarkMode ? 'Toggle light mode' : 'Toggle dark mode'}
        aria-pressed={isDarkMode}
      >
        {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </ThemeToggleButton>
    </Tooltip>
  );
};

export default ThemeToggler;
