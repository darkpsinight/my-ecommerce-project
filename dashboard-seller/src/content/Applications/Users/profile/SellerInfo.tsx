import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  Divider,
  Avatar,
  Chip,
  useTheme,
  styled,
  Grid,
  IconButton,
  TextField,
  Button,
  Collapse
} from '@mui/material';

import PersonTwoToneIcon from '@mui/icons-material/PersonTwoTone';
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';
import BusinessTwoToneIcon from '@mui/icons-material/BusinessTwoTone';
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

const AvatarSuccess = styled(Avatar)(
  ({ theme }) => `
      background: ${theme.colors.success.lighter};
      color: ${theme.colors.success.main};
      width: ${theme.spacing(7)};
      height: ${theme.spacing(7)};
`
);

interface SellerInfoProps {
  profileData: SellerProfileData | null;
  userData: {
    name: string;
    email: string;
    role: string;
  } | null;
}

function SellerInfo({ profileData, userData }: SellerInfoProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: profileData?.nickname || '',
    marketName: profileData?.marketName || ''
  });

  const handleEdit = () => {
    setFormData({
      nickname: profileData?.nickname || '',
      marketName: profileData?.marketName || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      nickname: profileData?.nickname || '',
      marketName: profileData?.marketName || ''
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profileData) return;

    setIsLoading(true);
    try {
      await dispatch(updateProfile({
        ...profileData,
        nickname: formData.nickname.trim(),
        marketName: formData.marketName.trim()
      })).unwrap();

      setIsEditing(false);
      toast.success('Seller information updated successfully');
    } catch (error) {
      toast.error('Failed to update seller information');
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

  return (
    <Card>
      <CardHeader
        title="Seller Information"
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

      {/* Nickname Section */}
      <Box px={2} py={3} display="flex" alignItems="flex-start">
        <AvatarPrimary>
          <PersonTwoToneIcon />
        </AvatarPrimary>
        <Box pl={2} flex={1}>
          <Typography variant="h4" gutterBottom>
            Display Name
          </Typography>

          <Collapse in={!isEditing}>
            <Box>
              <Typography
                variant="h3"
                color="text.primary"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 600
                }}
              >
                {profileData?.nickname || 'Not set'}
              </Typography>
              {!profileData?.nickname && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Set your display name in profile settings
                </Typography>
              )}
            </Box>
          </Collapse>

          <Collapse in={isEditing}>
            <Box>
              <TextField
                fullWidth
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                placeholder="Enter your display name"
                variant="outlined"
                size="small"
                inputProps={{ maxLength: 50 }}
                helperText={`${formData.nickname.length}/50 characters`}
                required
              />
            </Box>
          </Collapse>
        </Box>
      </Box>

      <Divider />

      {/* Market Name Section */}
      <Box px={2} py={3} display="flex" alignItems="flex-start">
        <AvatarSuccess>
          <StorefrontTwoToneIcon />
        </AvatarSuccess>
        <Box pl={2} flex={1}>
          <Typography variant="h4" gutterBottom>
            Market Name
          </Typography>

          <Collapse in={!isEditing}>
            <Box>
              <Typography
                variant="h3"
                color="text.primary"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 600
                }}
              >
                {profileData?.marketName || 'Not set'}
              </Typography>
              {!profileData?.marketName && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Set your market name to help customers identify your store
                </Typography>
              )}
            </Box>
          </Collapse>

          <Collapse in={isEditing}>
            <Box>
              <TextField
                fullWidth
                value={formData.marketName}
                onChange={(e) => handleInputChange('marketName', e.target.value)}
                placeholder="Enter your market/store name"
                variant="outlined"
                size="small"
                inputProps={{ maxLength: 100 }}
                helperText={`${formData.marketName.length}/100 characters`}
              />
            </Box>
          </Collapse>
        </Box>
      </Box>

      <Divider />

      {/* Account Information */}
      <Box px={2} py={3} display="flex" alignItems="flex-start">
        <AvatarPrimary>
          <BusinessTwoToneIcon />
        </AvatarPrimary>
        <Box pl={2} flex={1}>
          <Typography variant="h4" gutterBottom>
            Account Details
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Full Name
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {userData?.name || 'Not available'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {userData?.email || 'Not available'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Role
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={userData?.role || 'Unknown'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Edit Actions */}
      <Collapse in={isEditing}>
        <Box px={2} pb={3}>
          <Box display="flex" gap={1} justifyContent="flex-end">
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveTwoToneIcon />}
              onClick={handleSave}
              disabled={isLoading || !formData.nickname.trim()}
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
    </Card>
  );
}

export default SellerInfo;
