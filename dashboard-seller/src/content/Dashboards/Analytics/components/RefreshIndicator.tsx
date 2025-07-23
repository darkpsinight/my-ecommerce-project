import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface RefreshIndicatorProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  loading?: boolean;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  lastUpdated,
  onRefresh,
  isRefreshing,
  loading = false
}) => {
  const getLastUpdatedText = () => {
    if (loading || (isRefreshing && !lastUpdated)) return 'Loading data...';
    if (!lastUpdated) return 'No data loaded';

    try {
      return `Updated just now`;
    } catch (error) {
      return 'Recently updated';
    }
  };

  const getStatusColor = () => {
    if (loading || (isRefreshing && !lastUpdated)) return 'info';
    if (!lastUpdated) return 'warning';

    const now = new Date();
    const timeDiff = now.getTime() - lastUpdated.getTime();

    // Less than 1 minute - fresh
    if (timeDiff < 60 * 1000) return 'success';
    // Less than 5 minutes - good
    if (timeDiff < 5 * 60 * 1000) return 'primary';
    // Older - warning
    return 'warning';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap'
      }}
    >
      <Chip
        size="small"
        label={getLastUpdatedText()}
        color={getStatusColor() as any}
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />

      <Tooltip title="Refresh data">
        <IconButton
          size="small"
          onClick={onRefresh}
          disabled={isRefreshing || loading}
          sx={{
            ml: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          {isRefreshing || loading ? (
            <CircularProgress size={16} />
          ) : (
            <RefreshIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      {isRefreshing && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.75rem' }}
        >
          Refreshing...
        </Typography>
      )}
    </Box>
  );
};
