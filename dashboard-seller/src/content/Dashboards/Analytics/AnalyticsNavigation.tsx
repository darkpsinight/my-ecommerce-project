import { Box, Tabs, Tab, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Analytics as AnalyticsIcon,
  TrendingUp,
  Inventory,
  People,
  Public,
  Favorite
} from '@mui/icons-material';

function AnalyticsNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg')); // Changed to lg for better tablet support
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

  const tabs = [
    { 
      label: 'Overview', 
      shortLabel: 'Overview',
      value: '/dashboards/analytics/overview', 
      icon: <AnalyticsIcon /> 
    },
    { 
      label: 'Sales Performance', 
      shortLabel: 'Sales',
      value: '/dashboards/analytics/sales', 
      icon: <TrendingUp /> 
    },
    { 
      label: 'Product Analytics', 
      shortLabel: 'Products',
      value: '/dashboards/analytics/products', 
      icon: <Inventory /> 
    },
    { 
      label: 'Customer Intelligence', 
      shortLabel: 'Customers',
      value: '/dashboards/analytics/customers', 
      icon: <People /> 
    },
    { 
      label: 'Market Insights', 
      shortLabel: 'Market',
      value: '/dashboards/analytics/market', 
      icon: <Public /> 
    },
    { 
      label: 'Engagement & Growth', 
      shortLabel: 'Engagement',
      value: '/dashboards/analytics/engagement', 
      icon: <Favorite /> 
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      {isSmall ? (
        // Ultra-compact horizontal scroll for mobile
        <Box
          sx={{
            display: 'flex',
            overflowX: 'auto',
            gap: 1,
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          {tabs.map((tab) => (
            <Box
              key={tab.value}
              onClick={() => navigate(tab.value)}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                cursor: 'pointer',
                backgroundColor: location.pathname === tab.value ? 'primary.main' : 'transparent',
                color: location.pathname === tab.value ? 'primary.contrastText' : 'text.secondary',
                '&:hover': {
                  backgroundColor: location.pathname === tab.value ? 'primary.dark' : 'action.hover'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '18px'
                }
              }}
            >
              {tab.icon}
            </Box>
          ))}
        </Box>
      ) : (
        <Tabs
          value={location.pathname}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={true}
          allowScrollButtonsMobile={true}
          sx={{
            '& .MuiTab-root': {
              minWidth: isMobile ? 100 : 140,
              padding: isMobile ? '8px 12px' : '12px 16px',
              whiteSpace: 'nowrap'
            },
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': {
                opacity: 0.3
              }
            }
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={isMobile ? tab.shortLabel : tab.label}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          ))}
        </Tabs>
      )}
    </Box>
  );
}

export default AnalyticsNavigation;