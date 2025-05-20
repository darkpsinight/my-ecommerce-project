import { useState, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Card,
  Avatar,
  Button,
  IconButton,
  CircularProgress,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAppDispatch } from 'src/redux/hooks';
import { updateProfile, fetchSellerProfile } from 'src/redux/slices/sellerProfile';
import { SellerProfileData } from 'src/services/api/sellerProfile';
import { uploadImage } from 'src/services/api/imageUpload';
import { toast } from 'react-hot-toast';
import UploadTwoToneIcon from '@mui/icons-material/UploadTwoTone';
import MoreHorizTwoToneIcon from '@mui/icons-material/MoreHorizTwoTone';
import { ProfileCoverSkeleton } from './components/ProfileSkeletons';

// Define interface for component props
interface ProfileCoverProps {
  user: {
    name: string;
    coverImg: string;
    avatar: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
  profileData: SellerProfileData | null;
  isLoading: boolean;
}

const Input = styled('input')({
  display: 'none'
});

const AvatarWrapper = styled(Card)(
  ({ theme }) => `
    position: relative;
    overflow: visible;
    display: inline-block;
    margin-top: -${theme.spacing(5)}; /* Moved down to 20% of banner height */
    margin-left: ${theme.spacing(2)};
    z-index: 9;

    .MuiAvatar-root {
      width: ${theme.spacing(16)};
      height: ${theme.spacing(16)};
    }

    @media (max-width: ${theme.breakpoints.values.sm}px) {
      margin-top: -${theme.spacing(4)};
      margin-left: ${theme.spacing(2)};

      .MuiAvatar-root {
        width: ${theme.spacing(12)};
        height: ${theme.spacing(12)};
      }
    }

    @media (max-width: ${theme.breakpoints.values.xs}px) {
      margin-top: -${theme.spacing(3)};
      margin-left: ${theme.spacing(1.5)};

      .MuiAvatar-root {
        width: ${theme.spacing(10)};
        height: ${theme.spacing(10)};
      }
    }
`
);

const ButtonUploadWrapper = styled(Box)(
  ({ theme }) => `
    position: absolute;
    width: ${theme.spacing(4)};
    height: ${theme.spacing(4)};
    bottom: -${theme.spacing(1)};
    right: -${theme.spacing(1)};
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${theme.shadows[2]};
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 1);
    }

    .MuiIconButton-root {
      border-radius: 100%;
      background: ${theme.colors.primary.main};
      color: ${theme.palette.primary.contrastText};
      box-shadow: ${theme.colors.shadows.primary};
      width: ${theme.spacing(4)};
      height: ${theme.spacing(4)};
      padding: 0;

      &:hover {
        background: ${theme.colors.primary.dark};
      }
    }

    @media (max-width: ${theme.breakpoints.values.sm}px) {
      width: ${theme.spacing(3.5)};
      height: ${theme.spacing(3.5)};

      .MuiIconButton-root {
        width: ${theme.spacing(3.5)};
        height: ${theme.spacing(3.5)};
      }
    }

    @media (max-width: ${theme.breakpoints.values.xs}px) {
      width: ${theme.spacing(3)};
      height: ${theme.spacing(3)};

      .MuiIconButton-root {
        width: ${theme.spacing(3)};
        height: ${theme.spacing(3)};
      }
    }
`
);

const CardCover = styled(Card)(
  ({ theme }) => `
    position: relative;
    overflow: hidden;
    width: 100%;

    .MuiCardMedia-root {
      height: ${theme.spacing(30)}; /* Increased height to accommodate profile picture position */

      @media (max-width: ${theme.breakpoints.values.sm}px) {
        height: ${theme.spacing(24)};
      }

      @media (max-width: ${theme.breakpoints.values.xs}px) {
        height: ${theme.spacing(20)};
      }
    }
`
);

const CardCoverAction = styled(Box)(
  ({ theme }) => `
    position: absolute;
    right: ${theme.spacing(2)};
    bottom: ${theme.spacing(2)};
    padding: ${theme.spacing(1)};
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(4px);
    border-radius: ${theme.shape.borderRadius}px;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }

    .button-text {
      display: inline-flex;

      @media (max-width: ${theme.breakpoints.values.sm}px) {
        display: none;
      }
    }

    .button-icon-only {
      display: none;

      @media (max-width: ${theme.breakpoints.values.sm}px) {
        display: inline-flex;
      }
    }

    @media (max-width: ${theme.breakpoints.values.sm}px) {
      right: 0;
      bottom: 0;
      padding: 0;
      background-color: transparent;
      backdrop-filter: none;

      &:hover {
        background-color: transparent;
      }
    }
`
);

const ProfileCover: React.FC<ProfileCoverProps> = ({ user, profileData, isLoading }) => {
  const dispatch = useAppDispatch();
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Handle cover image upload
  const handleCoverImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      console.log('Starting cover image upload...');

      // Upload the image to ImageKit.io
      const imageUrl = await uploadImage(file);
      console.log('Cover image uploaded successfully to ImageKit:', imageUrl);

      // Always include the nickname field when updating the profile
      const updateData: Partial<SellerProfileData> = {
        bannerImageUrl: imageUrl
      };

      // If we have an existing profile, include its nickname
      if (profileData && profileData.nickname) {
        console.log('Using existing nickname:', profileData.nickname);
        updateData.nickname = profileData.nickname;
      } else {
        console.log('No existing profile found, using default nickname');
        updateData.nickname = user.name || 'Seller';
      }

      console.log('Updating profile with data:', updateData);
      await dispatch(updateProfile(updateData));

      toast.success('Cover image updated successfully');

      // Refresh profile data
      setTimeout(() => {
        dispatch(fetchSellerProfile());
      }, 1000);
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      console.log('Starting profile image upload...');

      // Upload the image to ImageKit.io
      const imageUrl = await uploadImage(file);
      console.log('Image uploaded successfully to ImageKit:', imageUrl);

      // Always include the nickname field when updating the profile
      const updateData: Partial<SellerProfileData> = {
        profileImageUrl: imageUrl
      };

      // If we have an existing profile, include its nickname
      if (profileData && profileData.nickname) {
        console.log('Using existing nickname:', profileData.nickname);
        updateData.nickname = profileData.nickname;
      } else {
        console.log('No existing profile found, using default nickname');
        updateData.nickname = user.name || 'Seller';
      }

      console.log('Updating profile with data:', updateData);
      await dispatch(updateProfile(updateData));

      toast.success('Profile image updated successfully');

      // Refresh profile data
      setTimeout(() => {
        dispatch(fetchSellerProfile());
      }, 1000);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Get the cover image URL from profile data or use default
  const coverImageUrl = profileData?.bannerImageUrl || user.coverImg;

  // Get the profile image URL from profile data or use default
  const profileImageUrl = profileData?.profileImageUrl || user.avatar;

  // Show skeleton loader during initial loading
  if (isLoading && !profileData) {
    return <ProfileCoverSkeleton />;
  }

  return (
    <>
      <Box display="flex" mb={3}>
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            Profile for {user.name}
          </Typography>
          <Typography variant="subtitle2">
            Manage your seller profile information and appearance
          </Typography>
        </Box>
      </Box>
      <Fade in={true} timeout={500}>
        <CardCover>
          {/* Only show the image when we have a valid URL (not the default placeholder) */}
          {(profileData?.bannerImageUrl || uploadingCover) ? (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'background.default'
              }}
            >
              <img
                src={coverImageUrl}
                alt="Profile Cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  display: 'block'
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                width: '100%',
                bgcolor: 'background.neutral',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="subtitle1" color="text.secondary">
                No cover image set
              </Typography>
            </Box>
          )}
          <CardCoverAction>
            <Input
              accept="image/*"
              id="change-cover"
              type="file"
              onChange={handleCoverImageUpload}
              disabled={uploadingCover || isLoading}
            />
            <label htmlFor="change-cover">
              {/* Button for larger screens */}
              <Box className="button-text">
                <Button
                  startIcon={uploadingCover ?
                    <CircularProgress size={16} color="inherit" sx={{ color: 'white' }} /> :
                    <UploadTwoToneIcon />
                  }
                  variant="contained"
                  component="span"
                  disabled={uploadingCover || isLoading}
                  sx={{
                    fontWeight: 'bold',
                    boxShadow: (theme) => theme.shadows[3],
                    '&:hover': {
                      boxShadow: (theme) => theme.shadows[5]
                    },
                    ...(uploadingCover && {
                      color: 'white',
                      backgroundColor: 'primary.main',
                      '&.Mui-disabled': {
                        color: 'white',
                        backgroundColor: 'primary.main',
                        opacity: 0.7
                      }
                    })
                  }}
                >
                  {uploadingCover ? 'Uploading...' : 'Change cover'}
                </Button>
              </Box>

              {/* Icon button for smaller screens */}
              <Box className="button-icon-only">
                {uploadingCover ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  <IconButton
                    component="span"
                    color="primary"
                    disabled={uploadingCover || isLoading}
                    sx={{
                      border: 'none',
                      borderRadius: '50%',
                      background: (theme) => theme.colors.primary.main,
                      color: (theme) => theme.palette.primary.contrastText,
                      boxShadow: (theme) => theme.colors.shadows.primary,
                      width: (theme) => theme.spacing(4),
                      height: (theme) => theme.spacing(4),
                      padding: 0,

                      '@media (max-width: 600px)': {
                        width: (theme) => theme.spacing(3.5),
                        height: (theme) => theme.spacing(3.5),
                      },

                      '@media (max-width: 400px)': {
                        width: (theme) => theme.spacing(3),
                        height: (theme) => theme.spacing(3),
                      },

                      '&:hover': {
                        background: (theme) => theme.colors.primary.dark,
                      },

                      ...(uploadingCover && {
                        color: 'white',
                        backgroundColor: 'primary.main',
                        '&.Mui-disabled': {
                          color: 'white',
                          backgroundColor: 'primary.main',
                          opacity: 0.7
                        }
                      })
                    }}
                  >
                    <UploadTwoToneIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </label>
          </CardCoverAction>
        </CardCover>
      </Fade>
      <AvatarWrapper>
        {/* Only show the avatar when we have a valid URL (not the default placeholder) */}
        {(profileData?.profileImageUrl || uploadingAvatar) ? (
          <Avatar variant="rounded" alt={user.name} src={profileImageUrl} />
        ) : (
          <Box
            sx={{
              height: '100%',
              width: '100%',
              bgcolor: 'background.neutral',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1
            }}
          >
            <Typography variant="h3" color="text.secondary">
              {user.name.charAt(0).toUpperCase()}
            </Typography>
          </Box>
        )}
        <ButtonUploadWrapper>
          <Input
            accept="image/*"
            id="icon-button-file"
            name="icon-button-file"
            type="file"
            onChange={handleProfileImageUpload}
            disabled={uploadingAvatar || isLoading}
          />
          <label htmlFor="icon-button-file">
            {uploadingAvatar ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              <IconButton
                component="span"
                color="primary"
                disabled={uploadingAvatar || isLoading}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: (theme) => theme.shadows[2],
                  '&:hover': {
                    bgcolor: 'background.paper',
                    boxShadow: (theme) => theme.shadows[4]
                  }
                }}
              >
                <UploadTwoToneIcon />
              </IconButton>
            )}
          </label>
        </ButtonUploadWrapper>
      </AvatarWrapper>
      <Box
        py={2}
        pl={{ xs: 1, sm: 2 }}
        mb={3}
        sx={{
          mt: { xs: 6, sm: 7, md: 8 } /* Increased top margin to account for profile picture position */
        }}
      >
        <Typography
          gutterBottom
          variant="h4"
          sx={{
            fontSize: { xs: '1.4rem', sm: '1.5rem', md: '1.75rem' }
          }}
        >
          {profileData?.nickname || user.name}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{
            fontSize: { xs: '0.875rem', sm: '0.9rem' }
          }}
        >
          {profileData?.marketName || 'Set your market name in the profile settings'}
        </Typography>
        <Typography
          sx={{
            py: { xs: 1, sm: 2 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
          variant="subtitle2"
          color="text.primary"
        >
          {user.role} | {user.email}
        </Typography>
        <Box
          display={{ xs: 'block', md: 'flex' }}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: { xs: 1, sm: 2 } }}
        >
          <Box>
            {profileData?.enterpriseDetails?.website && (
              <Button
                size="small"
                sx={{
                  mx: { xs: 0, sm: 1 },
                  mr: { xs: 1, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                }}
                variant="outlined"
                href={profileData.enterpriseDetails.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                View website
              </Button>
            )}
            <IconButton
              color="primary"
              sx={{
                p: { xs: 0.3, sm: 0.5 },
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 }
              }}
            >
              <MoreHorizTwoToneIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </>
  );
};

ProfileCover.defaultProps = {
  profileData: null,
  isLoading: false
};

export default ProfileCover;
