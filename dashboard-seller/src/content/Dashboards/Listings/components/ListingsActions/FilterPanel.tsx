import { FC } from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import FilterListTwoToneIcon from '@mui/icons-material/FilterListTwoTone';
import ClearIcon from '@mui/icons-material/Clear';
import { ButtonSearch } from './StyledComponents';

interface FilterPanelProps {
  showFilters: boolean;
  searchTerm: string;
  category: string;
  platform: string;
  status: string;
  minPrice: string;
  maxPrice: string;
  startDate: string;
  endDate: string;
  categories: any[];
  platforms: any[];
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCategoryChange: (event: any) => void;
  handlePlatformChange: (event: any) => void;
  handleStatusChange: (event: any) => void;
  handleMinPriceChange: (event: any) => void;
  handleMaxPriceChange: (event: any) => void;
  handleStartDateChange: (event: any) => void;
  handleEndDateChange: (event: any) => void;
  handleApplyFilters: () => void;
  setSearchTerm: (value: string) => void;
}

const FilterPanel: FC<FilterPanelProps> = ({
  showFilters,
  searchTerm,
  category,
  platform,
  status,
  minPrice,
  maxPrice,
  startDate,
  endDate,
  categories,
  platforms,
  handleSearchChange,
  handleCategoryChange,
  handlePlatformChange,
  handleStatusChange,
  handleMinPriceChange,
  handleMaxPriceChange,
  handleStartDateChange,
  handleEndDateChange,
  handleApplyFilters,
  setSearchTerm
}) => {
  return (
    <Collapse in={showFilters}>
      <Divider sx={{ mt: 1, mb: 3 }} />
      <Grid container spacing={3}>
        {/* Search field moved inside the filter panel */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchTwoToneIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            placeholder="Search by title..."
            label="Title"
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={handleCategoryChange}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth variant="outlined" disabled={platforms.length === 0} size="small">
            <InputLabel>Platform</InputLabel>
            <Select
              value={platform}
              onChange={handlePlatformChange}
              label="Platform"
            >
              <MenuItem value="all">All Platforms</MenuItem>
              {platforms.map((plat) => (
                <MenuItem key={plat.name} value={plat.name}>
                  {plat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={handleStatusChange}
              label="Status"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">On Sale</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={minPrice}
            onChange={handleMinPriceChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              )
            }}
            placeholder="Min Price"
            label="Min Price"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={maxPrice}
            onChange={handleMaxPriceChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              )
            }}
            placeholder="Max Price"
            label="Max Price"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            label="Start Date"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            label="End Date"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ButtonSearch
            fullWidth
            startIcon={<FilterListTwoToneIcon />}
            variant="contained"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </ButtonSearch>
        </Grid>
      </Grid>
      <Divider sx={{ mt: 3, mb: 1 }} />
    </Collapse>
  );
};

export default FilterPanel;
