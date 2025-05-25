import {
  Box,
  Typography,
  Card,
  CardHeader,
  Divider,
  Avatar,
  useTheme,
  styled,
} from '@mui/material';

import ShoppingBagTwoToneIcon from '@mui/icons-material/ShoppingBagTwoTone';
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone';
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone';

const AvatarPrimary = styled(Avatar)(
  ({ theme }) => `
      background: ${theme.colors.primary.lighter};
      color: ${theme.colors.primary.main};
      width: ${theme.spacing(7)};
      height: ${theme.spacing(7)};
`
);

// Styled heading that doesn't rely on MUI theme resolution during initial render
const StableHeading = styled('h3')(
  ({ theme }) => `
      font-weight: 700;
      font-size: 25px;
      line-height: 1.4;
      margin: 0;
      color: ${theme.palette.mode === 'dark' ? '#ffffff' : '#223354'};
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
`
);

function RecentActivity() {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader title="Recent Activity" />
      <Divider />
      <Box px={2} py={4} display="flex" alignItems="flex-start">
        <AvatarPrimary>
          <ShoppingBagTwoToneIcon />
        </AvatarPrimary>
        <Box pl={2} flex={1}>
          <StableHeading>Orders</StableHeading>

          <Box pt={2} display="flex" flexWrap="wrap" gap={2}>
            <Box pr={{ xs: 2, sm: 4, md: 8 }} minWidth="80px">
              <Typography
                gutterBottom
                variant="caption"
                sx={{ fontSize: `${theme.typography.pxToRem(16)}` }}
              >
                Total
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>485</Typography>
            </Box>
            <Box minWidth="80px">
              <Typography
                gutterBottom
                variant="caption"
                sx={{ fontSize: `${theme.typography.pxToRem(16)}` }}
              >
                Failed
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>8</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Divider />
      <Box px={2} py={4} display="flex" alignItems="flex-start">
        <AvatarPrimary>
          <FavoriteTwoToneIcon />
        </AvatarPrimary>
        <Box pl={2} flex={1}>
          <StableHeading>Favourites</StableHeading>

          <Box pt={2} display="flex" flexWrap="wrap" gap={2}>
            <Box pr={{ xs: 2, sm: 4, md: 8 }} minWidth="80px">
              <Typography
                gutterBottom
                variant="caption"
                sx={{ fontSize: `${theme.typography.pxToRem(16)}` }}
              >
                Products
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>64</Typography>
            </Box>
            <Box minWidth="80px">
              <Typography
                gutterBottom
                variant="caption"
                sx={{ fontSize: `${theme.typography.pxToRem(16)}` }}
              >
                Lists
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>15</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Divider />
      <Box px={2} py={4} display="flex" alignItems="flex-start">
        <AvatarPrimary>
          <StarTwoToneIcon />
        </AvatarPrimary>
        <Box pl={2} flex={1}>
          <StableHeading>Reviews</StableHeading>

          <Box pt={2} display="flex" flexWrap="wrap" gap={2}>
            <Box pr={{ xs: 2, sm: 4, md: 8 }} minWidth="80px">
              <Typography
                gutterBottom
                variant="caption"
                sx={{ fontSize: `${theme.typography.pxToRem(16)}` }}
              >
                Total
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>654</Typography>
            </Box>
            <Box minWidth="80px">
              <Typography
                gutterBottom
                variant="caption"
                sx={{ fontSize: `${theme.typography.pxToRem(16)}` }}
              >
                Useful
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>21</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

export default RecentActivity;
