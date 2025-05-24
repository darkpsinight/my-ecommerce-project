import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  Divider,
  Avatar,
  Button,
  Chip,
  useTheme,
  styled,
  IconButton,
  Grid,
  Tooltip,
  TextField,
  Collapse
} from '@mui/material';

import BusinessTwoToneIcon from '@mui/icons-material/BusinessTwoTone';
import LanguageTwoToneIcon from '@mui/icons-material/LanguageTwoTone';
import ShareTwoToneIcon from '@mui/icons-material/ShareTwoTone';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LaunchTwoToneIcon from '@mui/icons-material/LaunchTwoTone';
import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import RedditIcon from '@mui/icons-material/Reddit';
import PinterestIcon from '@mui/icons-material/Pinterest';
import GitHubIcon from '@mui/icons-material/GitHub';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import { SellerProfileData } from 'src/services/api/sellerProfile';
import { useAppDispatch } from 'src/redux/hooks';
import { updateProfile } from 'src/redux/slices/sellerProfile';
import { toast } from 'react-hot-toast';

const AvatarPrimary = styled(Avatar)(
  ({ theme }) => `
      background: ${theme.colors.primary.lighter};
      color: ${theme.colors.primary.main};
      width: ${theme.spacing(7)};
      height: ${theme.spacing(7)};
`
);

const AvatarSuccess = styled(Avatar)(
  ({ theme }) => `
      background: ${theme.colors.success.lighter};
      color: ${theme.colors.success.main};
      width: ${theme.spacing(7)};
      height: ${theme.spacing(7)};
`
);

interface EnterpriseDetailsProps {
  profileData: SellerProfileData | null;
}

function EnterpriseDetails({ profileData }: EnterpriseDetailsProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: profileData?.enterpriseDetails?.companyName || '',
    website: profileData?.enterpriseDetails?.website || '',
    socialMedia: profileData?.enterpriseDetails?.socialMedia || []
  });

  const handleEdit = () => {
    setFormData({
      companyName: profileData?.enterpriseDetails?.companyName || '',
      website: profileData?.enterpriseDetails?.website || '',
      socialMedia: profileData?.enterpriseDetails?.socialMedia || []
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      companyName: profileData?.enterpriseDetails?.companyName || '',
      website: profileData?.enterpriseDetails?.website || '',
      socialMedia: profileData?.enterpriseDetails?.socialMedia || []
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profileData) return;

    setIsLoading(true);
    try {
      await dispatch(updateProfile({
        ...profileData,
        enterpriseDetails: {
          companyName: formData.companyName.trim(),
          website: formData.website.trim(),
          socialMedia: formData.socialMedia.filter(social =>
            social.platform.trim() && social.url.trim()
          )
        }
      })).unwrap();

      setIsEditing(false);
      toast.success('Enterprise details updated successfully');
    } catch (error) {
      toast.error('Failed to update enterprise details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.map((social, i) =>
        i === index ? { ...social, [field]: value } : social
      )
    }));
  };

  const addSocialMedia = () => {
    setFormData(prev => ({
      ...prev,
      socialMedia: [...prev.socialMedia, { platform: '', url: '' }]
    }));
  };

  const removeSocialMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index)
    }));
  };

  const getSocialMediaIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case 'twitter':
      case 'x':
        return <TwitterIcon />;
      case 'facebook':
      case 'fb':
        return <FacebookIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'instagram':
      case 'ig':
        return <InstagramIcon />;
      case 'youtube':
      case 'yt':
        return <YouTubeIcon />;
      case 'telegram':
        return <TelegramIcon />;
      case 'whatsapp':
      case 'wa':
        return <WhatsAppIcon />;
      case 'reddit':
        return <RedditIcon />;
      case 'pinterest':
        return <PinterestIcon />;
      case 'github':
        return <GitHubIcon />;
      case 'tiktok':
      case 'snapchat':
      case 'discord':
      case 'twitch':
      case 'website':
      case 'blog':
        return <ShareTwoToneIcon />;
      default:
        return <ShareTwoToneIcon />;
    }
  };

  const hasEnterpriseDetails = profileData?.enterpriseDetails && (
    profileData.enterpriseDetails.companyName ||
    profileData.enterpriseDetails.website ||
    (profileData.enterpriseDetails.socialMedia && profileData.enterpriseDetails.socialMedia.length > 0)
  );

  return (
    <Card>
      <CardHeader
        title="Enterprise Details"
        action={
          !isEditing && (
            <IconButton
              size="small"
              onClick={handleEdit}
              sx={{
                '&:hover': {
                  background: theme.colors.primary.lighter
                }
              }}
            >
              <EditTwoToneIcon fontSize="small" />
            </IconButton>
          )
        }
      />
      <Divider />

      {!hasEnterpriseDetails ? (
        <Box px={2} py={4} textAlign="center">
          <AvatarPrimary sx={{ mx: 'auto', mb: 2 }}>
            <BusinessTwoToneIcon />
          </AvatarPrimary>
          <Typography variant="h4" gutterBottom color="text.secondary">
            No Enterprise Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add your company information and social media links in profile settings
          </Typography>
        </Box>
      ) : (
        <>
          {/* Company Name Section */}
          {profileData?.enterpriseDetails?.companyName && (
            <>
              <Box px={2} py={3} display="flex" alignItems="flex-start">
                <AvatarPrimary>
                  <BusinessTwoToneIcon />
                </AvatarPrimary>
                <Box pl={2} flex={1}>
                  <Typography variant="h4" gutterBottom>
                    Company Name
                  </Typography>
                  <Typography
                    variant="h3"
                    color="text.primary"
                    sx={{
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      fontWeight: 600
                    }}
                  >
                    {profileData.enterpriseDetails.companyName}
                  </Typography>
                </Box>
              </Box>
              <Divider />
            </>
          )}

          {/* Website Section */}
          {profileData?.enterpriseDetails?.website && (
            <>
              <Box px={2} py={3} display="flex" alignItems="flex-start">
                <AvatarSuccess>
                  <LanguageTwoToneIcon />
                </AvatarSuccess>
                <Box pl={2} flex={1}>
                  <Typography variant="h4" gutterBottom>
                    Website
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    href={profileData.enterpriseDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<LaunchTwoToneIcon />}
                    sx={{
                      mt: 1,
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                    }}
                  >
                    Visit Website
                  </Button>
                </Box>
              </Box>
              <Divider />
            </>
          )}

          {/* Social Media Section */}
          {profileData?.enterpriseDetails?.socialMedia && profileData.enterpriseDetails.socialMedia.length > 0 && (
            <Box px={2} py={3} display="flex" alignItems="flex-start">
              <AvatarPrimary>
                <ShareTwoToneIcon />
              </AvatarPrimary>
              <Box pl={2} flex={1}>
                <Typography variant="h4" gutterBottom>
                  Social Media ({profileData.enterpriseDetails.socialMedia.length})
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    maxHeight: profileData.enterpriseDetails.socialMedia.length > 12 ? '300px' : 'auto',
                    overflowY: profileData.enterpriseDetails.socialMedia.length > 12 ? 'auto' : 'visible',
                    pr: profileData.enterpriseDetails.socialMedia.length > 12 ? 1 : 0
                  }}
                >
                  <Grid container spacing={1}>
                    {profileData.enterpriseDetails.socialMedia.map((social, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Tooltip title={`Visit ${social.platform}: ${social.url}`} arrow>
                          <Chip
                            icon={getSocialMediaIcon(social.platform)}
                            label={social.platform}
                            variant="outlined"
                            size="small"
                            clickable
                            onClick={() => window.open(social.url, '_blank', 'noopener,noreferrer')}
                            sx={{
                              width: '100%',
                              justifyContent: 'flex-start',
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100px'
                              },
                              '&:hover': {
                                backgroundColor: theme.colors.primary.lighter,
                                borderColor: theme.colors.primary.main
                              }
                            }}
                          />
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                {profileData.enterpriseDetails.socialMedia.length > 6 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 2, display: 'block' }}
                  >
                    {profileData.enterpriseDetails.socialMedia.length > 12
                      ? 'Scroll to see all platforms • Click on any platform to visit the link'
                      : 'Click on any platform to visit the link'
                    }
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </>
      )}
    </Card>
  );
}

export default EnterpriseDetails;
