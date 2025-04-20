import {
  Box,
  Card,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  useTheme,
  styled
} from '@mui/material';

import ShoppingCartTwoToneIcon from '@mui/icons-material/ShoppingCartTwoTone';
import AttachMoneyTwoToneIcon from '@mui/icons-material/AttachMoneyTwoTone';
import LocalShippingTwoToneIcon from '@mui/icons-material/LocalShippingTwoTone';

const ListWrapper = styled(List)(
  () => `
    .MuiListItem-root {
      border-radius: 0;
      margin: 0;
    }
`
);

function ListingsSummary() {
  const theme = useTheme();

  const items = [
    {
      id: 1,
      name: 'Active Listings',
      value: '2',
      icon: ShoppingCartTwoToneIcon,
      color: theme.colors.primary.main
    },
    {
      id: 2,
      name: 'Total Revenue',
      value: '$139.98',
      icon: AttachMoneyTwoToneIcon,
      color: theme.colors.success.main
    },
    {
      id: 3,
      name: 'Delivered Codes',
      value: '5',
      icon: LocalShippingTwoToneIcon,
      color: theme.colors.warning.main
    }
  ];

  return (
    <Card>
      <Box
        sx={{
          p: 3
        }}
      >
        <Typography variant="h4">Listings Summary</Typography>
        <Typography variant="subtitle2">
          Overview of your listing activity
        </Typography>
      </Box>
      <Divider />
      <ListWrapper disablePadding>
        {items.map((item) => (
          <ListItem
            key={item.id}
            sx={{
              py: 2,
              px: 3
            }}
          >
            <ListItemAvatar
              sx={{
                mr: 1
              }}
            >
              <Avatar
                sx={{
                  background: item.color,
                  color: `${theme.colors.alpha.white[100]}`
                }}
              >
                <item.icon fontSize="small" />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={item.name}
              primaryTypographyProps={{
                variant: 'h5',
                color: 'textPrimary',
                gutterBottom: true,
                noWrap: true
              }}
              secondary={item.value}
              secondaryTypographyProps={{
                variant: 'h3',
                color: 'textPrimary',
                noWrap: true
              }}
            />
          </ListItem>
        ))}
      </ListWrapper>
    </Card>
  );
}

export default ListingsSummary;
