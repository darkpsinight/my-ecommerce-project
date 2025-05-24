import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  Divider,
  Avatar,
  Button,
  TextField,
  IconButton,
  useTheme,
  styled,
  Fade,
  Collapse
} from '@mui/material';

import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone';
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

interface AboutSectionProps {
  profileData: SellerProfileData | null;
}

function AboutSection({ profileData }: AboutSectionProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [aboutText, setAboutText] = useState(profileData?.about || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    setAboutText(profileData?.about || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setAboutText(profileData?.about || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profileData) return;

    setIsLoading(true);
    try {
      await dispatch(updateProfile({
        ...profileData,
        about: aboutText.trim()
      })).unwrap();

      setIsEditing(false);
      toast.success('About section updated successfully');
    } catch (error) {
      toast.error('Failed to update about section');
    } finally {
      setIsLoading(false);
    }
  };

  const hasAbout = profileData?.about && profileData.about.trim().length > 0;

  return (
    <Card>
      <CardHeader
        title="About"
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

      <Box px={2} py={3} display="flex" alignItems="flex-start">
        <AvatarPrimary>
          <InfoTwoToneIcon />
        </AvatarPrimary>
        <Box pl={2} flex={1}>
          <Typography variant="h4" gutterBottom>
            About Your Business
          </Typography>

          <Collapse in={!isEditing}>
            <Box>
              {hasAbout ? (
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 'calc(1.6em * 7)', // 7 lines max (line-height * 7)
                    overflow: 'auto',
                    display: 'block',
                    // Custom scrollbar styling
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '3px',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(0, 0, 0, 0.3)',
                      }
                    },
                    // Firefox scrollbar styling
                    scrollbarWidth: 'thin',
                    scrollbarColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.2) transparent'
                      : 'rgba(0, 0, 0, 0.2) transparent',
                  }}
                >
                  {profileData?.about}
                </Typography>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tell customers about your business, what you sell, and what makes you unique.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditTwoToneIcon />}
                    onClick={handleEdit}
                  >
                    Add About Section
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>

          <Collapse in={isEditing}>
            <Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Tell customers about your business, what you sell, and what makes you unique..."
                variant="outlined"
                inputProps={{ maxLength: 500 }}
                helperText={`${aboutText.length}/500 characters`}
                sx={{ mb: 2 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveTwoToneIcon />}
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CancelTwoToneIcon />}
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Card>
  );
}

export default AboutSection;
