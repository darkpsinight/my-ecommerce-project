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
  Grid
} from '@mui/material';

import PersonTwoToneIcon from '@mui/icons-material/PersonTwoTone';
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';
import BusinessTwoToneIcon from '@mui/icons-material/BusinessTwoTone';
import { SellerProfileData } from 'src/services/api/sellerProfile';

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

  return (
    <Card>
      <CardHeader title="Seller Information" />
      <Divider />
      
      {/* Nickname Section */}
      <Box px={2} py={3} display="flex" alignItems="flex-start">
        <AvatarPrimary>
          <PersonTwoToneIcon />
        </AvatarPrimary>
        <Box pl={2} flex={1}>
          <Typography variant="h4" gutterBottom>
            Nickname
          </Typography>
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
              Set your nickname in profile settings
            </Typography>
          )}
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
    </Card>
  );
}

export default SellerInfo;
