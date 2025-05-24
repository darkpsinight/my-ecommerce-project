import {
  Box,
  Typography,
  Card,
  CardHeader,
  Divider,
  Avatar,
  Chip,
  Grid,
  Tooltip,
  useTheme,
  styled
} from '@mui/material';

import EmojiEventsTwoToneIcon from '@mui/icons-material/EmojiEventsTwoTone';
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone';
import VerifiedTwoToneIcon from '@mui/icons-material/VerifiedTwoTone';
import TrendingUpTwoToneIcon from '@mui/icons-material/TrendingUpTwoTone';
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone';
import SpeedTwoToneIcon from '@mui/icons-material/SpeedTwoTone';
import SecurityTwoToneIcon from '@mui/icons-material/SecurityTwoTone';
import LocalShippingTwoToneIcon from '@mui/icons-material/LocalShippingTwoTone';
import { SellerProfileData, BadgeData } from 'src/services/api/sellerProfile';

const AvatarPrimary = styled(Avatar)(
  ({ theme }) => `
      background: ${theme.colors.primary.lighter};
      color: ${theme.colors.primary.main};
      width: ${theme.spacing(7)};
      height: ${theme.spacing(7)};
`
);

const BadgeChip = styled(Chip)(
  ({ theme }) => `
      margin: ${theme.spacing(0.5)};
      font-weight: 600;

      &.gold {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: #8B4513;
        border: 2px solid #FFD700;
      }

      &.silver {
        background: linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%);
        color: #2F2F2F;
        border: 2px solid #C0C0C0;
      }

      &.bronze {
        background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
        color: #FFFFFF;
        border: 2px solid #CD7F32;
      }

      &.verified {
        background: linear-gradient(135deg, ${theme.colors.success.main} 0%, ${theme.colors.success.dark} 100%);
        color: #FFFFFF;
        border: 2px solid ${theme.colors.success.main};
      }

      &.premium {
        background: linear-gradient(135deg, ${theme.colors.primary.main} 0%, ${theme.colors.primary.dark} 100%);
        color: #FFFFFF;
        border: 2px solid ${theme.colors.primary.main};
      }
`
);

interface BadgesSectionProps {
  profileData: SellerProfileData | null;
}

// Static badges for demonstration - these will be earned dynamically later
const getStaticBadges = (): BadgeData[] => [
  {
    name: 'Verified Seller',
    description: 'Account has been verified and is trusted',
    icon: 'verified',
    earnedAt: new Date().toISOString()
  },
  {
    name: 'Top Seller',
    description: 'Achieved top seller status with excellent sales performance',
    icon: 'star',
    earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    name: 'Fast Shipper',
    description: 'Consistently ships orders quickly',
    icon: 'shipping',
    earnedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  }
];

const getBadgeIcon = (iconType: string) => {
  switch (iconType) {
    case 'star':
      return <StarTwoToneIcon fontSize="small" />;
    case 'verified':
      return <VerifiedTwoToneIcon fontSize="small" />;
    case 'trending':
      return <TrendingUpTwoToneIcon fontSize="small" />;
    case 'favorite':
      return <FavoriteTwoToneIcon fontSize="small" />;
    case 'speed':
      return <SpeedTwoToneIcon fontSize="small" />;
    case 'security':
      return <SecurityTwoToneIcon fontSize="small" />;
    case 'shipping':
      return <LocalShippingTwoToneIcon fontSize="small" />;
    default:
      return <EmojiEventsTwoToneIcon fontSize="small" />;
  }
};

const getBadgeClass = (badgeName: string) => {
  if (badgeName.toLowerCase().includes('top') || badgeName.toLowerCase().includes('gold')) {
    return 'gold';
  }
  if (badgeName.toLowerCase().includes('verified') || badgeName.toLowerCase().includes('trusted')) {
    return 'verified';
  }
  if (badgeName.toLowerCase().includes('premium') || badgeName.toLowerCase().includes('pro')) {
    return 'premium';
  }
  if (badgeName.toLowerCase().includes('silver')) {
    return 'silver';
  }
  if (badgeName.toLowerCase().includes('bronze')) {
    return 'bronze';
  }
  return 'verified'; // default
};

const formatBadgeDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

function BadgesSection({ profileData }: BadgesSectionProps) {
  const theme = useTheme();

  // For now, use static badges. Later this will come from profileData.badges
  const badges = profileData?.badges || getStaticBadges();
  const hasBadges = badges && badges.length > 0;

  return (
    <Card>
      <CardHeader title="Achievements & Badges" />
      <Divider />

      <Box px={2} py={3} display="flex" alignItems="flex-start">
        <AvatarPrimary>
          <EmojiEventsTwoToneIcon />
        </AvatarPrimary>
        <Box pl={2} flex={1}>
          <Typography variant="h4" gutterBottom>
            Your Achievements
          </Typography>

          {hasBadges ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Badges you've earned for excellent performance and service
              </Typography>
              <Grid container spacing={{ xs: 0.5, sm: 1 }}>
                {badges.map((badge, index) => (
                  <Grid item xs="auto" key={index}>
                    <Tooltip
                      title={
                        <Box sx={{ p: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: '#ffffff',
                              fontSize: '0.9rem',
                              mb: 0.5
                            }}
                          >
                            {badge.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 1,
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontSize: '0.8rem',
                              lineHeight: 1.4
                            }}
                          >
                            {badge.description}
                          </Typography>
                          {badge.earnedAt && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '0.75rem',
                                fontStyle: 'italic'
                              }}
                            >
                              Earned: {formatBadgeDate(badge.earnedAt)}
                            </Typography>
                          )}
                        </Box>
                      }
                      arrow
                      placement="top"
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'rgba(33, 43, 54, 0.95)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            maxWidth: 280,
                            fontSize: '0.8rem'
                          }
                        },
                        arrow: {
                          sx: {
                            color: 'rgba(33, 43, 54, 0.95)',
                            '&::before': {
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }
                          }
                        }
                      }}
                    >
                      <BadgeChip
                        icon={getBadgeIcon(badge.icon)}
                        label={badge.name}
                        className={getBadgeClass(badge.name)}
                        size="medium"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          height: { xs: 24, sm: 32 },
                          '& .MuiChip-icon': {
                            fontSize: { xs: '0.9rem', sm: '1.1rem' }
                          },
                          '& .MuiChip-label': {
                            px: { xs: 1, sm: 1.5 }
                          }
                        }}
                      />
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                No badges earned yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Keep providing excellent service to earn achievement badges
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );
}

export default BadgesSection;
