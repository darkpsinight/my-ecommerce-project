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
import AboutSection from './AboutSection';
import BadgesSection from './BadgesSection';
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
      <Container
        sx={{
          mt: { xs: 1, sm: 2, md: 3 },
          px: { xs: 1, sm: 2, md: 3 }
        }}
        maxWidth="lg"
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Debug button to manually refresh profile data */}
        <Box
          display="flex"
          justifyContent={{ xs: 'center', sm: 'flex-end' }}
          sx={{ mb: { xs: 1, sm: 2 } }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() => dispatch(fetchSellerProfile())}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              px: { xs: 1.5, sm: 2 }
            }}
          >
            {loading ? (
              <>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Refreshing...
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Loading...
                </Box>
              </>
            ) : (
              <>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Refresh Profile Data
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Refresh
                </Box>
              </>
            )}
          </Button>
        </Box>

        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={{ xs: 1, sm: 2, md: 3 }}
        >
          {/* Profile Cover and Badges Section */}
          <Grid item xs={12} lg={8}>
            <ProfileCover
              user={user}
              profileData={profileData}
              isLoading={loading}
            />
            {/* Badges Section - positioned right below the profile cover */}
            <Box mt={{ xs: 1, sm: 2 }}>
              {loading && !userData ? (
                <Fade in={true} timeout={850}>
                  <Box>
                    <ProfileContentSkeleton />
                  </Box>
                </Fade>
              ) : (
                <BadgesSection profileData={profileData} />
              )}
            </Box>
            {/* About Section - moved here to fill space */}
            <Box mt={{ xs: 1, sm: 2 }}>
              {loading && !userData ? (
                <Fade in={true} timeout={800}>
                  <Box>
                    <ProfileContentSkeleton />
                  </Box>
                </Fade>
              ) : (
                <AboutSection profileData={profileData} />
              )}
            </Box>
          </Grid>

          {/* Right Column - Recent Activity and Enterprise Details */}
          <Grid item xs={12} lg={4}>
            {loading && !userData ? (
              <Fade in={true} timeout={800}>
                <Box>
                  <ProfileContentSkeleton />
                </Box>
              </Fade>
            ) : (
              <RecentActivity />
            )}

            {/* Enterprise Details - moved here if available */}
            {(profileData?.enterpriseDetails && (
              profileData.enterpriseDetails.companyName ||
              profileData.enterpriseDetails.website ||
              (profileData.enterpriseDetails.socialMedia && profileData.enterpriseDetails.socialMedia.length > 0)
            )) && (
              <Box mt={{ xs: 1, sm: 2 }}>
                {loading && !userData ? (
                  <Fade in={true} timeout={950}>
                    <Box>
                      <ProfileContentSkeleton />
                    </Box>
                  </Fade>
                ) : (
                  <EnterpriseDetails profileData={profileData} />
                )}
              </Box>
            )}
          </Grid>

          {/* Seller Information - Full Width */}
          {(profileData?.enterpriseDetails && (
            profileData.enterpriseDetails.companyName ||
            profileData.enterpriseDetails.website ||
            (profileData.enterpriseDetails.socialMedia && profileData.enterpriseDetails.socialMedia.length > 0)
          )) && (
            <Grid item xs={12}>
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
          )}

          {/* Feed and Popular Tags */}
          <Grid item xs={12} lg={8}>
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
          <Grid item xs={12} lg={4}>
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

          {/* Cards and Addresses */}
          <Grid item xs={12} md={6} lg={7}>
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
          <Grid item xs={12} md={6} lg={5}>
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
