import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid, Typography, Box } from '@mui/material';
import Footer from 'src/components/Footer';
import AnalyticsNavigation from '../AnalyticsNavigation';

import RevenueOverview from '../RevenueOverview';
import RevenueChart from '../RevenueChart';
import SalesMetrics from '../SalesMetrics';
import PlatformDistribution from '../PlatformDistribution';
import { SellerProfileSetupModal, ProfileStatusBanner } from 'src/components/SellerProfileSetup';
import { useSellerProfile } from 'src/hooks/useSellerProfile';
import { useAnalytics } from '../hooks/useAnalytics';
import { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

function SalesPerformance() {
  const {
    profileData,
    loading: profileLoading,
    updateProfile,
    showProfileSetup,
    setShowProfileSetup,
    openProfileSetup
  } = useSellerProfile();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  const {
    analyticsData,
    chartData,
    loading: analyticsLoading,
    error,
    refetch
  } = useAnalytics(timeRange);

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
        <title>Sales Performance - VIP Analytics</title>
      </Helmet>
      <PageTitleWrapper>
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            Sales Performance
          </Typography>
          <Typography variant="subtitle2">
            Track your revenue, sales trends, and platform performance
          </Typography>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <ProfileStatusBanner
          profileData={profileData}
          loading={profileLoading}
          onSetupProfile={openProfileSetup}
        />

        <AnalyticsNavigation />

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              {timeRangeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <RevenueOverview 
              data={analyticsData?.revenue} 
              loading={analyticsLoading}
              timeRange={timeRange}
            />
          </Grid>

          <Grid item xs={12} lg={8}>
            <RevenueChart 
              data={chartData} 
              loading={analyticsLoading}
              timeRange={timeRange}
            />
          </Grid>

          <Grid item xs={12} lg={4}>
            <SalesMetrics 
              data={analyticsData?.sales} 
              loading={analyticsLoading}
            />
          </Grid>

          <Grid item xs={12} lg={6}>
            <PlatformDistribution 
              data={analyticsData?.inventory?.platformDistribution} 
              loading={analyticsLoading}
            />
          </Grid>
        </Grid>

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

export default SalesPerformance;