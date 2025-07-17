import { useContext } from 'react';
import Scrollbar from 'src/components/Scrollbar';
import { SidebarContext } from 'src/contexts/SidebarContext';

import {
  Box,
  Drawer,
  alpha,
  styled,
  Divider,
  useTheme,
  Button,
  lighten,
  darken,
  Tooltip
} from '@mui/material';

import SidebarMenu from './SidebarMenu';
import Logo from 'src/components/LogoSign';

const SidebarWrapper = styled(Box)(
  ({ theme }) => `
        width: ${theme.sidebar.width};
        min-width: ${theme.sidebar.width};
        color: ${theme.colors.alpha.trueWhite[70]};
        position: relative;
        z-index: 7;
        height: 100%;
        padding-bottom: 16px;
        display: flex;
        flex-direction: column;
`
);

function Sidebar() {
  const { sidebarToggle, toggleSidebar } = useContext(SidebarContext);
  const closeSidebar = () => toggleSidebar();
  const theme = useTheme();

  return (
    <>
      <SidebarWrapper
        sx={{
          display: {
            xs: 'none',
            lg: 'inline-block'
          },
          position: 'fixed',
          left: 0,
          top: 0,
          background:
            theme.palette.mode === 'dark'
              ? alpha(lighten(theme.header.background, 0.1), 0.5)
              : darken(theme.colors.alpha.black[100], 0.5),
          boxShadow:
            theme.palette.mode === 'dark' ? theme.sidebar.boxShadow : 'none'
        }}
      >
        <Box
          sx={{
            height: 'calc(100vh - 80px)', // Full height minus bottom button area
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: '4px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.colors.alpha.trueWhite[30],
              borderRadius: '2px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: theme.colors.alpha.trueWhite[50]
            }
          }}
        >
          {/* Logo Section */}
          <Box mt={2} mb={1}>
            <Box
              mx={2}
              sx={{
                width: 52
              }}
            >
              <Logo />
            </Box>
          </Box>
          <Divider
            sx={{
              mx: theme.spacing(2),
              background: theme.colors.alpha.trueWhite[10]
            }}
          />
          
          {/* Menu Section */}
          <SidebarMenu />
        </Box>
        
        {/* Fixed Bottom Section */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'inherit'
          }}
        >
          <Divider
            sx={{
              background: theme.colors.alpha.trueWhite[10]
            }}
          />
          <Box p={1.5}>
            <Button
              href="https://bloomui.com"
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              color="warning"
              size="small"
              fullWidth
            >
              Upgrade to PRO
            </Button>
          </Box>
        </Box>
      </SidebarWrapper>
      <Drawer
        sx={{
          boxShadow: `${theme.sidebar.boxShadow}`,
          '& .MuiDrawer-paper': {
            background: theme.palette.mode === 'dark'
              ? alpha(lighten(theme.header.background, 0.1), 0.5)
              : darken(theme.colors.alpha.black[100], 0.5),
            color: theme.colors.alpha.trueWhite[70]
          }
        }}
        anchor={theme.direction === 'rtl' ? 'right' : 'left'}
        open={sidebarToggle}
        onClose={closeSidebar}
        variant="temporary"
        elevation={9}
      >
        <SidebarWrapper
          sx={{
            background: theme.palette.mode === 'dark'
              ? alpha(lighten(theme.header.background, 0.1), 0.5)
              : darken(theme.colors.alpha.black[100], 0.5),
            color: theme.colors.alpha.trueWhite[70]
          }}
        >
          {/* Logo Section - Fixed at top */}
          <Box mt={2} mb={1}>
            <Box
              mx={2}
              sx={{
                width: 52
              }}
            >
              <Logo />
            </Box>
          </Box>
          <Divider
            sx={{
              mx: theme.spacing(2),
              background: theme.colors.alpha.trueWhite[10]
            }}
          />
          
          {/* Scrollable Menu Section */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Scrollbar>
              <SidebarMenu />
            </Scrollbar>
          </Box>
          
          {/* Fixed Bottom Section */}
          <Divider
            sx={{
              background: theme.colors.alpha.trueWhite[10]
            }}
          />
          <Box p={1.5}>
            <Button
              href="https://bloomui.com"
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              color="warning"
              size="small"
              fullWidth
            >
              Upgrade to PRO
            </Button>
          </Box>
        </SidebarWrapper>
      </Drawer>
    </>
  );
}

export default Sidebar;
