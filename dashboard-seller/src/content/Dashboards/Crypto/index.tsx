import { Helmet } from 'react-helmet-async';
import PageHeader from './PageHeader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from 'src/components/Footer';

import AccountBalance from './AccountBalance';
import Wallets from './Wallets';
import AccountSecurity from './AccountSecurity';
import WatchList from './WatchList';
import { SellerProfileSetupModal, ProfileStatusBanner } from 'src/components/SellerProfileSetup';
import { FinancialOnboardingModal, FinancialStatusBanner } from 'src/components/FinancialOnboarding';
import { useSellerProfile } from 'src/hooks/useSellerProfile';

function DashboardCrypto() {
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

  return (
    <>
      <Helmet>
        <title>Crypto Dashboard</title>
      </Helmet>
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
          onViewPaymentSettings={() => window.open('/management/payment-setup', '_blank')}
        />

        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            <AccountBalance />
          </Grid>
          <Grid item lg={8} xs={12}>
            <Wallets />
          </Grid>
          <Grid item lg={4} xs={12}>
            <AccountSecurity />
          </Grid>
          <Grid item xs={12}>
            <WatchList />
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

export default DashboardCrypto;
