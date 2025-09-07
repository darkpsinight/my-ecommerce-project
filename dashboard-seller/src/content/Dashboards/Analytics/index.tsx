import { Helmet } from 'react-helmet-async';
import PageHeader from './PageHeader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from 'src/components/Footer';
import AnalyticsNavigation from './AnalyticsNavigation';

import RevenueOverview from './RevenueOverview';
import SalesMetrics from './SalesMetrics';
import InventoryStats from './InventoryStats';
import CustomerInsights from './CustomerInsights';
import RevenueChart from './RevenueChart';
import TopProducts from './TopProducts';
import PlatformDistribution from './PlatformDistribution';
import EngagementMetrics from './EngagementMetrics';
import WishlistAnalytics from './WishlistAnalytics';
import GeographicAnalytics from './GeographicAnalytics';
import CustomerGeographicAnalytics from './CustomerGeographicAnalytics';
import { SellerProfileSetupModal, ProfileStatusBanner } from 'src/components/SellerProfileSetup';
import { FinancialOnboardingModal, FinancialStatusBanner } from 'src/components/FinancialOnboarding';
import { useSellerProfile } from 'src/hooks/useSellerProfile';
import { useOptimizedAnalytics } from './hooks/useOptimizedAnalytics';
import { RefreshIndicator } from './components/RefreshIndicator';
import { useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

function DashboardAnalytics() {
  const {
    profileData,
    loading: profileLoading,
    updateProfile,
    showProfileSetup,
    setShowProfileSetup,
    openProfileSetup,
    // Financial onboarding
    financialData,
    showFinancialSetup,
    setShowFinancialSetup,
    openFinancialSetup,
    completeProfileAndShowFinancial
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
        <title>VIP Analytics Dashboard</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader 
          analyticsData={analyticsData}
          chartData={chartData}
          timeRange={timeRange}
          loading={analyticsLoading}
        />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        {/* Seller Profile Status Banner */}
        <ProfileStatusBanner
          profileData={profileData}
          loading={profileLoading}
          onSetupProfile={openProfileSetup}
          financialData={financialData}
          onSetupPayments={openFinancialSetup}
        />

        {/* Financial Status Banner */}
        <FinancialStatusBanner
          profileData={profileData}
          financialData={financialData}
          loading={profileLoading}
          onSetupPayments={openFinancialSetup}
          onViewPaymentSettings={() => window.open('/management/payment-setup', '_blank')}
        />

        <AnalyticsNavigation />

        {/* Time Range Selector and Refresh Indicator */}
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

        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          {/* Revenue Overview Cards */}
          <Grid item xs={12}>
            <RevenueOverview 
              data={analyticsData?.revenue} 
              loading={analyticsLoading}
              timeRange={timeRange}
            />
          </Grid>

          {/* Revenue Chart */}
          <Grid item xs={12} lg={8}>
            <RevenueChart 
              data={chartData} 
              loading={analyticsLoading}
              timeRange={timeRange}
            />
          </Grid>

          {/* Sales Metrics */}
          <Grid item xs={12} lg={4}>
            <SalesMetrics 
              data={analyticsData?.sales} 
              loading={analyticsLoading}
            />
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} lg={6}>
            <TopProducts 
              data={analyticsData?.sales?.bestSellers} 
              loading={analyticsLoading}
            />
          </Grid>

          {/* Platform Distribution */}
          <Grid item xs={12} lg={6}>
            <PlatformDistribution 
              data={analyticsData?.inventory?.platformDistribution} 
              loading={analyticsLoading}
            />
          </Grid>

          {/* Inventory Stats */}
          <Grid item xs={12} lg={6}>
            <InventoryStats 
              data={analyticsData?.inventory} 
              loading={analyticsLoading}
            />
          </Grid>

          {/* Customer Insights */}
          <Grid item xs={12} lg={6}>
            <CustomerInsights 
              data={analyticsData?.customers} 
              loading={analyticsLoading}
            />
          </Grid>

          {/* Engagement Metrics */}
          <Grid item xs={12} lg={8}>
            <EngagementMetrics 
              data={analyticsData?.engagement} 
              loading={analyticsLoading}
            />
          </Grid>

          {/* Wishlist Analytics */}
          <Grid item xs={12}>
            <WishlistAnalytics 
              data={analyticsData?.wishlist} 
              loading={analyticsLoading}
            />
          </Grid>

          {/* Geographic & Market Analytics */}
          <Grid item xs={12}>
            <GeographicAnalytics 
              data={analyticsData?.geographic} 
              loading={analyticsLoading}
            />
          </Grid>

          {/* Customer Geographic Analytics */}
          <Grid item xs={12}>
            <CustomerGeographicAnalytics 
              data={analyticsData?.customerGeographic} 
              loading={analyticsLoading}
            />
          </Grid>
        </Grid>

        {/* Seller Profile Setup Modal */}
        <SellerProfileSetupModal
          open={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
          onSubmit={updateProfile}
          onCompleteProfile={completeProfileAndShowFinancial}
          loading={profileLoading}
        />

        {/* Financial Onboarding Modal */}
        <FinancialOnboardingModal
          open={showFinancialSetup}
          onClose={() => setShowFinancialSetup(false)}
          onComplete={() => {
            setShowFinancialSetup(false);
            window.open('/management/payment-setup', '_blank');
          }}
          loading={profileLoading}
        />
      </Container>
      <Footer />
    </>
  );
}

export default DashboardAnalytics;