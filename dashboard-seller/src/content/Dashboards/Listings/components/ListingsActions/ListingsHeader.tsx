import { FC } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { ListingsHeaderBox, FilterToggleButton } from './StyledComponents';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FilterListTwoToneIcon from '@mui/icons-material/FilterListTwoTone';

interface ListingsHeaderProps {
  activeFiltersCount: number;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
}

const ListingsHeader: FC<ListingsHeaderProps> = ({
  activeFiltersCount,
  showFilters,
  setShowFilters
}) => {
  return (
    <Grid container spacing={3} alignItems="center" justifyContent="space-between">
      <Grid item xs={12} md={8}>
        <ListingsHeaderBox>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              mb: 0.5,
              letterSpacing: '-0.5px'
            }}
          >
            Product Listings
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            {activeFiltersCount > 0 
              ? `${activeFiltersCount} active filters` 
              : 'Manage and filter your listings'}
          </Typography>
        </ListingsHeaderBox>
      </Grid>
      <Grid item xs={12} md={4} container justifyContent="flex-end" sx={{ width: '100%' }}>
        <Box sx={{ width: '100%', maxWidth: { md: 180 } }}>
          <FilterToggleButton
            fullWidth
            sx={{ minWidth: { md: 180 } }}
            color="secondary"
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            endIcon={showFilters ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            startIcon={<FilterListTwoToneIcon />}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </FilterToggleButton>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ListingsHeader;
