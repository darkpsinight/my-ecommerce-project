import { Helmet } from 'react-helmet-async';
import PageHeader from './PageHeader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Footer from 'src/components/Footer';

import ListingsTable from './ListingsTable';
import ListingsSummary from './ListingsSummary';
import ListingsActions from './ListingsActions';
import { ListingsProvider } from './context/ListingsContext';
import { SellerProfileSetupModal, ProfileStatusBanner } from 'src/components/SellerProfileSetup';
import { FinancialOnboardingModal, FinancialStatusBanner } from 'src/components/FinancialOnboarding';
import { useSellerProfile } from 'src/hooks/useSellerProfile';

import { useState } from 'react';

// Import Listings specific styles
import './styles.css';

function DashboardListings() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const {
    profileData,
    loading: profileLoading,
    hasProfile,
    updateProfile,
    showProfileSetup,
    setShowProfileSetup,
    openProfileSetup,
    // Financial onboarding
    financialData,
    showFinancialSetup,
    setShowFinancialSetup,
    openFinancialSetup,
    needsFinancialSetup,
    completeProfileAndShowFinancial
  } = useSellerProfile();

  return (
    <>
      <Helmet>
        <title>Listings Management</title>
      </Helmet>
      <ListingsProvider>
        <PageTitleWrapper>
          <PageHeader />
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
            onViewPaymentSettings={() => navigate('/management/payment-setup')}
          />

          <Grid
            container
            direction="row"
            justifyContent="center"
            alignItems="stretch"
            spacing={4}
          >
            <Grid item xs={12}>
              <ListingsSummary />
            </Grid>
            <Grid item xs={12}>
              <ListingsActions selected={selected} setSelected={setSelected} />
            </Grid>
            <Grid item xs={12}>
              <ListingsTable selected={selected} setSelected={setSelected} />
            </Grid>
          </Grid>
        </Container>

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
            // Optionally redirect to payment setup page
            window.open('/management/payment-setup', '_blank');
          }}
          loading={profileLoading}
        />
      </ListingsProvider>
      <Footer />
    </>
  );
}

export default DashboardListings;
