import { FC } from 'react';
import { DialogActions, Button, Box, Typography } from '@mui/material';

interface ModalFooterProps {
  onClose: () => void;
  lastUpdated?: string | Date | null;
}

const ModalFooter: FC<ModalFooterProps> = ({ 
  onClose,
  lastUpdated
}) => {
  const formatDate = (date: string | Date | null): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Invalid date format:', date);
      return '';
    }
  };

  return (
    <DialogActions
      sx={{
        justifyContent: 'space-between',
        p: 2,
        bgcolor: 'background.paper',
        borderTop: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      {lastUpdated && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Last updated: {formatDate(lastUpdated)}
          </Typography>
        </Box>
      )}
      <Button
        onClick={onClose}
        color="primary"
        variant="outlined"
      >
        Close
      </Button>
    </DialogActions>
  );
};

export default ModalFooter;
