import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid, Typography, Box } from '@mui/material';
import Footer from 'src/components/Footer';
import AnalyticsNavigation from '../AnalyticsNavigation';

import KPICards from './KPICards';
import QuickInsights from './QuickInsights';
import { SellerProfileSetupModal, ProfileStatusBanner } from 'src/components/SellerProfileSetup';
import { useSellerProfile } from 'src/hooks/useSellerProfile';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';
import { RefreshIndicator } from '../components/RefreshIndicator';
import { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

function AnalyticsOverview() {
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
      <PageTitleWrapper>
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            Analytics Overview
          </Typography>
          <Typography variant="subtitle2">
            Your business performance at a glance
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

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RefreshIndicator
            lastUpdated={lastUpdated}
            onRefresh={refetch}
            isRefreshing={isRefreshing}
            loading={analyticsLoading}
          />
          
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
          {/* Top-Level KPI Cards */}
          <Grid item xs={12}>
            <KPICards 
              data={analyticsData} 
              loading={analyticsLoading}
              timeRange={timeRange}
            />
          </Grid>

          {/* Quick Insights Sections */}
          <Grid item xs={12}>
            <QuickInsights 
              data={analyticsData}
              chartData={chartData}
              loading={analyticsLoading}
              timeRange={timeRange}
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

export default AnalyticsOverview;