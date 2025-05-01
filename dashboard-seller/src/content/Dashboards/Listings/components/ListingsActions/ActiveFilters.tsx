import { FC } from 'react';
import { Box, Button } from '@mui/material';
import { ActiveFilterChip, BoldSpan } from './StyledComponents';

interface ActiveFilterDisplay {
  category?: string;
  platform?: string;
  status?: string;
  title?: string;
  minPrice?: string;
  maxPrice?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | undefined;
}

interface ActiveFiltersProps {
  activeFilters: ActiveFilterDisplay;
  handleRemoveFilter: (key: string) => void;
  handleClearFilters: () => void;
}

const ActiveFilters: FC<ActiveFiltersProps> = ({
  activeFilters,
  handleRemoveFilter,
  handleClearFilters
}) => {
  if (Object.keys(activeFilters).length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
      {Object.entries(activeFilters).map(([key, value]) => {
        // For each filter chip, parse the label to make the prefix bold
        const parts = value.split(':');
        const label = parts.length > 1 ? (
          <>
            <BoldSpan>{parts[0]}:</BoldSpan>{parts.slice(1).join(':')}
          </>
        ) : value;
        
        return (
          <ActiveFilterChip
            key={key}
            label={label}
            onDelete={() => handleRemoveFilter(key)}
            color="primary"
            variant="outlined"
            size="small"
          />
        );
      })}
      <Button
        size="small"
        variant="text"
        color="error"
        sx={{ ml: 1 }}
        onClick={handleClearFilters}
      >
        Clear All
      </Button>
    </Box>
  );
};

export default ActiveFilters;
