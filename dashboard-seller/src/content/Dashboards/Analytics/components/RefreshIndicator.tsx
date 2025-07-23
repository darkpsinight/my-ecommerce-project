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
import { formatDistanceToNow } from 'date-fns';

interface RefreshIndicatorProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  lastUpdated,
  onRefresh,
  isRefreshing
}) => {
  const getLastUpdatedText = () => {
    if (!lastUpdated) return 'Never updated';
    
    try {
      return `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`;
    } catch (error) {
      return 'Recently updated';
    }
  };

  const getStatusColor = () => {
    if (!lastUpdated) return 'error';
    
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
          disabled={isRefreshing}
          sx={{ 
            ml: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          {isRefreshing ? (
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