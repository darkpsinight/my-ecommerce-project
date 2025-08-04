import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid, Typography, Box, useTheme, alpha, Fade, Paper } from '@mui/material';
import Footer from 'src/components/Footer';
import AnalyticsNavigation from '../AnalyticsNavigation';

import KPICards from './KPICards';
import QuickInsights from './QuickInsights';
import { SellerProfileSetupModal, ProfileStatusBanner } from 'src/components/SellerProfileSetup';
import { useSellerProfile } from 'src/hooks/useSellerProfile';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';
import { RefreshIndicator } from '../components/RefreshIndicator';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { Assessment, TrendingUp } from '@mui/icons-material';

function AnalyticsOverview() {
  const theme = useTheme();
  const {
    profileData,
    loading: profileLoading,
    updateProfile,
    showProfileSetup,
    setShowProfileSetup,
    openProfileSetup
  } = useSellerProfile();

  const {
    analyticsData,
    chartData,
    loading: analyticsLoading,
    error,
    refetch,
    timeRange,
    setTimeRange,
    lastUpdated,
    isRefreshing
  } = useOptimizedAnalytics();

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as '7d' | '30d' | '90d' | '1y');
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  return (
    <>
      <Helmet>
        <title>Analytics Overview - VIP Analytics</title>
      </Helmet>
      
      {/* Enhanced Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: 4,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }
        }}
      >
        <Container maxWidth="lg">
          <Box position="relative" zIndex={1}>
            {/* Mobile-first responsive layout */}
            <Box 
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: { xs: 'flex-start', md: 'space-between' },
                gap: { xs: 3, md: 2 }
              }}
            >
              {/* Title Section */}
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    background: alpha(theme.palette.common.white, 0.2),
                    borderRadius: '50%',
                    p: { xs: 1, md: 1.5 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Assessment sx={{ fontSize: { xs: 24, md: 32 } }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom 
                    sx={{ 
                      mb: 0.5, 
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}
                  >
                    Analytics Dashboard
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.9, 
                      fontWeight: 400,
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Track your business performance and insights
                  </Typography>
                </Box>
              </Box>
              
              {/* Controls Section */}
              <Box 
                display="flex" 
                alignItems="center" 
                gap={2}
                sx={{
                  width: { xs: '100%', md: 'auto' },
                  justifyContent: { xs: 'space-between', md: 'flex-end' }
                }}
              >
                <Box
                  sx={{
                    '& .MuiButton-root': { 
                      color: 'white',
                      borderColor: alpha(theme.palette.common.white, 0.3),
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: alpha(theme.palette.common.white, 0.1)
                      }
                    }
                  }}
                >
                  <RefreshIndicator
                    lastUpdated={lastUpdated}
                    onRefresh={refetch}
                    isRefreshing={isRefreshing}
                    loading={analyticsLoading}
                  />
                </Box>
                
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: { xs: 120, md: 150 },
                    maxWidth: { xs: 150, md: 'none' }
                  }}
                >
                  <InputLabel 
                    sx={{ 
                      color: 'white', 
                      '&.Mui-focused': { color: 'white' },
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }}
                  >
                    Time Range
                  </InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={handleTimeRangeChange}
                    sx={{
                      color: 'white',
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.common.white, 0.3)
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white'
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'white'
                      }
                    }}
                  >
                    {timeRangeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <ProfileStatusBanner
          profileData={profileData}
          loading={profileLoading}
          onSetupProfile={openProfileSetup}
        />

        <AnalyticsNavigation />

        {/* Welcome Section */}
        <Paper 
          elevation={2}
          sx={{ 
            mb: 4,
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          <Box 
            display="flex" 
            alignItems="center" 
            gap={2}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            <TrendingUp 
              color="primary" 
              sx={{ 
                fontSize: { xs: 24, md: 28 },
                display: { xs: 'none', sm: 'block' }
              }} 
            />
            <Box>
              <Typography 
                variant="h5" 
                fontWeight={600} 
                gutterBottom
                sx={{
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                Welcome back! 👋
              </Typography>
              <Typography 
                variant="body1" 
                color="textSecondary"
                sx={{
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Here's what's happening with your business today. Your analytics are updated in real-time.
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Fade in={true} timeout={800}>
          <Grid container spacing={4}>
            {/* Enhanced KPI Cards */}
            <Grid item xs={12}>
              <KPICards 
                data={analyticsData} 
                loading={analyticsLoading}
                timeRange={timeRange}
              />
            </Grid>

            {/* Enhanced Quick Insights */}
            <Grid item xs={12}>
              <QuickInsights 
                data={analyticsData}
                chartData={chartData}
                loading={analyticsLoading}
                timeRange={timeRange}
              />
            </Grid>
          </Grid>
        </Fade>

        <SellerProfileSetupModal
          open={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
          onSubmit={updateProfile}
          loading={profileLoading}
        />
      </Container>
      <Footer />
    </>
  );
}

export default AnalyticsOverview;