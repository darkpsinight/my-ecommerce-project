import { Box } from '@mui/material';
import HeaderSearch from './Search';
import HeaderNotifications from './Notifications';
import ThemeToggler from 'src/components/ThemeToggler';

function HeaderButtons() {
  return (
    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
      <HeaderSearch />
      <Box sx={{ mx: 0.5 }} component="span">
        <HeaderNotifications />
      </Box>
      <ThemeToggler />
    </Box>
  );
}

export default HeaderButtons;
