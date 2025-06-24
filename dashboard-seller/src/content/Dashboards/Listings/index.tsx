import { Helmet } from 'react-helmet-async';
import PageHeader from './PageHeader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid, Box } from '@mui/material';
import Footer from 'src/components/Footer';

import ListingsTable from './ListingsTable';
import ListingsSummary from './ListingsSummary';
import ListingsActions from './ListingsActions';
import { ListingsProvider } from './context/ListingsContext';
import { SellerProfileSetupModal, ProfileStatusBanner } from 'src/components/SellerProfileSetup';
import { useSellerProfile } from 'src/hooks/useSellerProfile';

import { useState } from 'react';

// Import Listings specific styles
import './styles.css';

function DashboardListings() {
  const [selected, setSelected] = useState<string[]>([]);
  const {
    profileData,
    loading: profileLoading,
    hasProfile,
    updateProfile,
    showProfileSetup,
    setShowProfileSetup,
    openProfileSetup
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
          loading={profileLoading}
        />
      </ListingsProvider>
      <Footer />
    </>
  );
}

export default DashboardListings;
