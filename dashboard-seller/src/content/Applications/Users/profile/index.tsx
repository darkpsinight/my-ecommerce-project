import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Footer from 'src/components/Footer';

import { Grid, Container, Alert, CircularProgress, Box, Button, Fade } from '@mui/material';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import { fetchSellerProfile } from 'src/redux/slices/sellerProfile';

import ProfileCover from './ProfileCover';
import RecentActivity from './RecentActivity';
import Feed from './Feed';
import PopularTags from './PopularTags';
import MyCards from './MyCards';
import Addresses from './Addresses';
import SellerInfo from './SellerInfo';
import EnterpriseDetails from './EnterpriseDetails';
import { ProfileContentSkeleton } from './components/ProfileSkeletons';

function ManagementUserProfile() {
  const dispatch = useAppDispatch();
  const { userData, profileData, loading, error } = useAppSelector((state) => state.sellerProfile);

  // Default user data in case API data is not available yet
  const defaultUser = {
    savedCards: 0,
    name: 'Seller',
    coverImg: '', // No default cover image
    avatar: '', // No default avatar
    description: 'Loading profile information...',
    jobtitle: 'Seller',
    location: '',
    followers: '0'
  };

  // Fetch seller profile data when component mounts
  useEffect(() => {
    dispatch(fetchSellerProfile());
  }, [dispatch]);

  // Log profile data for debugging
  useEffect(() => {
    console.log('Current profile data:', profileData);
    console.log('Current user data:', userData);
  }, [profileData, userData]);

  // Combine API data with default data
  const user = userData ? {
    ...defaultUser,
    name: userData.name,
    email: userData.email,
    role: userData.role
  } : defaultUser;

  return (
    <>
      <Helmet>
        <title>Seller Profile - Management</title>
      </Helmet>
      <Container sx={{ mt: 3 }} maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Debug button to manually refresh profile data */}
        <Box display="flex" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => dispatch(fetchSellerProfile())}
            disabled={loading}
          >
            Refresh Profile Data
          </Button>
        </Box>

        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={3}
        >
          <Grid item xs={12} md={8}>
            <ProfileCover
              user={user}
              profileData={profileData}
              isLoading={loading}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {loading && !userData ? (
              <Fade in={true} timeout={800}>
                <Box>
                  <ProfileContentSkeleton />
                </Box>
              </Fade>
            ) : (
              <RecentActivity />
            )}
          </Grid>
          {/* Only show SellerInfo and EnterpriseDetails if seller has enterprise details */}
          {(profileData?.enterpriseDetails && (
            profileData.enterpriseDetails.companyName ||
            profileData.enterpriseDetails.website ||
            (profileData.enterpriseDetails.socialMedia && profileData.enterpriseDetails.socialMedia.length > 0)
          )) && (
            <>
              <Grid item xs={12} md={8}>
                {loading && !userData ? (
                  <Fade in={true} timeout={900}>
                    <Box>
                      <ProfileContentSkeleton />
                    </Box>
                  </Fade>
                ) : (
                  <SellerInfo profileData={profileData} userData={userData} />
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                {loading && !userData ? (
                  <Fade in={true} timeout={950}>
                    <Box>
                      <ProfileContentSkeleton />
                    </Box>
                  </Fade>
                ) : (
                  <EnterpriseDetails profileData={profileData} />
                )}
              </Grid>
            </>
          )}
          <Grid item xs={12} md={8}>
            {loading && !userData ? (
              <Fade in={true} timeout={1000}>
                <Box>
                  <ProfileContentSkeleton />
                </Box>
              </Fade>
            ) : (
              <Feed />
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            {loading && !userData ? (
              <Fade in={true} timeout={1200}>
                <Box>
                  <ProfileContentSkeleton />
                </Box>
              </Fade>
            ) : (
              <PopularTags />
            )}
          </Grid>

          <Grid item xs={12} md={7}>
            {loading && !userData ? (
              <Fade in={true} timeout={1400}>
                <Box>
                  <ProfileContentSkeleton />
                </Box>
              </Fade>
            ) : (
              <MyCards />
            )}
          </Grid>
          <Grid item xs={12} md={5}>
            {loading && !userData ? (
              <Fade in={true} timeout={1600}>
                <Box>
                  <ProfileContentSkeleton />
                </Box>
              </Fade>
            ) : (
              <Addresses />
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

export default ManagementUserProfile;
