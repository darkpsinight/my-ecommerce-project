import { styled } from '@mui/material';
import {
  Button,
  Box,
  Chip
} from '@mui/material';

// ---- Styled components ----
export const ButtonSearch = styled(Button)(
  ({ theme }) => `
    margin-right: ${theme.spacing(1)};
  `
);

export const ListingsHeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: theme.spacing(2.5)
  }
}));

export const ResponsiveActionsBox = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    '.MuiButton-root': {
      width: '100%',
      marginRight: 0,
      marginBottom: theme.spacing(1.5)
    }
  }
}));

export const ActiveFilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '& .MuiChip-label': {
    fontWeight: 500
  }
}));

// Create a component for the bold filter label
export const BoldSpan = styled('span')({
  fontWeight: 700
});

export const FilterToggleButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'auto',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2)
}));
