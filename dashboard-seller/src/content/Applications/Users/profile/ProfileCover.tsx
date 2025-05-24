import { useState, ChangeEvent, useCallback, useRef } from 'react';
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
import { uploadImage, IMAGE_FOLDERS } from 'src/services/api/imageUpload';
import { toast } from 'react-hot-toast';
import UploadTwoToneIcon from '@mui/icons-material/UploadTwoTone';
import MoreHorizTwoToneIcon from '@mui/icons-material/MoreHorizTwoTone';
import { ProfileCoverSkeleton } from './components/ProfileSkeletons';
import SimpleBannerCropper from './components/SimpleBannerCropper';

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
    margin-top: -${theme.spacing(7)}; /* Adjusted for new banner height */
    margin-left: ${theme.spacing(2)};
    z-index: 9;

    @media (max-width: ${theme.breakpoints.values.sm}px) {
      margin-top: -${theme.spacing(6)}; /* Adjusted for smaller banner height on small screens */
      margin-left: ${theme.spacing(2)};
    }

    @media (max-width: ${theme.breakpoints.values.xs}px) {
      margin-top: -${theme.spacing(5)}; /* Adjusted for even smaller banner height on extra small screens */
      margin-left: ${theme.spacing(1.5)};
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
    /* Use a fixed aspect ratio of 3:1 (width:height) to match the cropper */
    aspect-ratio: 3 / 1;
    /* Fallback for browsers that don't support aspect-ratio */
    height: calc(100% / 3);
    border-radius: ${theme.shape.borderRadius}px;
    box-shadow: ${theme.shadows[3]};

    /* Ensure the aspect ratio is maintained on all screen sizes */
    @media (max-width: ${theme.breakpoints.values.sm}px) {
      aspect-ratio: 3 / 1;
    }

    @media (max-width: ${theme.breakpoints.values.xs}px) {
      aspect-ratio: 3 / 1;
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
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [showCropperModal, setShowCropperModal] = useState(false);

  // Create refs for file inputs to reset them after upload
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Calculate the aspect ratio based on the banner dimensions
  // This should match the fixed height we've set for the banner
  const bannerAspectRatio = 3; // Width:Height ratio (e.g., 3:1 means width is 3x the height)

  // Handle cover image selection
  const handleCoverImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store the selected file and show the cropper modal
    setSelectedCoverFile(file);
    setShowCropperModal(true);
  };

  // Handle cropped image upload
  const handleCroppedImageUpload = async (croppedBlob: Blob) => {
    if (!croppedBlob) return;

    try {
      setUploadingCover(true);
      setShowCropperModal(false);
      console.log('Starting cropped cover image upload...');

      // Create a File object from the Blob
      const croppedFile = new File([croppedBlob], selectedCoverFile?.name || 'banner.jpg', {
        type: 'image/jpeg'
      });

      // Upload the cropped image to ImageKit.io with the correct folder
      const imageUrl = await uploadImage(croppedFile, IMAGE_FOLDERS.SELLER_BANNER_IMAGES);
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
      // Reset the file input value so the same file can be selected again
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }

      setUploadingCover(false);
      setSelectedCoverFile(null);
    }
  };

  // Handle closing the cropper modal without saving
  const handleCloseCropper = useCallback(() => {
    setShowCropperModal(false);
    setSelectedCoverFile(null);

    // Reset the file input value so the same file can be selected again
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
  }, []);

  // Handle profile image upload
  const handleProfileImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      console.log('Starting profile image upload...');

      // Upload the image to ImageKit.io with the correct folder
      const imageUrl = await uploadImage(file, IMAGE_FOLDERS.SELLER_PROFILE_IMAGES);
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
      // Reset the file input value so the same file can be selected again
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }

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
      {/* Banner Image Cropper Modal */}
      <SimpleBannerCropper
        open={showCropperModal}
        onClose={handleCloseCropper}
        imageFile={selectedCoverFile}
        onCropComplete={handleCroppedImageUpload}
        aspectRatio={bannerAspectRatio}
        isProcessing={uploadingCover}
      />

      <Box display="flex" mb={3}>
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            Profile for {user.name}
          </Typography>
          <Typography variant="subtitle2">
            Manage your profile information and appearance
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
                backgroundColor: 'background.default'
              }}
            >
              <Box
                component="img"
                src={coverImageUrl}
                alt="Profile Cover"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', /* Fill container while maintaining aspect ratio */
                  objectPosition: 'center', /* Center the image */
                  display: 'block',
                  /* Ensure the image is displayed at the exact dimensions of the container */
                  /* This is critical to match what the user sees in the cropper */
                  maxWidth: '100%',
                  maxHeight: '100%'
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
              onChange={handleCoverImageSelect}
              disabled={uploadingCover || isLoading}
              ref={coverFileInputRef}
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
                  {uploadingCover ? 'Uploading...' : 'Change banner'}
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
          <Avatar
            variant="rounded"
            alt={user.name}
            src={profileImageUrl}
            imgProps={{
              style: {
                objectFit: 'cover',
                width: '100%',
                height: '100%'
              },
              onLoad: (e) => {
                // Ensure the image is displayed at full size when loaded
                const img = e.target as HTMLImageElement;
                img.style.width = '100%';
                img.style.height = '100%';
              }
            }}
            sx={{
              width: (theme) => ({
                xs: theme.spacing(10),
                sm: theme.spacing(12),
                md: theme.spacing(14)
              }),
              height: (theme) => ({
                xs: theme.spacing(10),
                sm: theme.spacing(12),
                md: theme.spacing(14)
              }),
              // Ensure consistent sizing during all states
              minWidth: (theme) => ({
                xs: theme.spacing(10),
                sm: theme.spacing(12),
                md: theme.spacing(14)
              }),
              minHeight: (theme) => ({
                xs: theme.spacing(10),
                sm: theme.spacing(12),
                md: theme.spacing(14)
              }),
              // Ensure the image maintains aspect ratio and fills the avatar
              '& img': {
                objectFit: 'cover',
                width: '100%',
                height: '100%'
              }
            }}
          />
        ) : (
          <Box
            sx={{
              width: (theme) => ({
                xs: theme.spacing(10),
                sm: theme.spacing(12),
                md: theme.spacing(14)
              }),
              height: (theme) => ({
                xs: theme.spacing(10),
                sm: theme.spacing(12),
                md: theme.spacing(14)
              }),
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
            ref={avatarFileInputRef}
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
    </>
  );
};

ProfileCover.defaultProps = {
  profileData: null,
  isLoading: false
};

export default ProfileCover;
