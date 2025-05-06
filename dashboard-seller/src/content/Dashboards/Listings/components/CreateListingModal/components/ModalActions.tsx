import React from 'react';
import {
  DialogActions,
  Button,
  CircularProgress,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import { useModalContext } from '../ModalContext';

interface ModalActionsProps {
  onClose: () => void;
}

/**
 * Actions component for the Create New Listing modal
 */
const ModalActions: React.FC<ModalActionsProps> = ({ onClose }) => {
  const { handleSubmit, submitting, loading, resetForm } = useModalContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle cancel button click - reset form and close modal
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <DialogActions 
      sx={{ 
        p: 2.5, 
        justifyContent: 'space-between',
        backgroundColor: alpha(theme.palette.background.default, 0.04),
        borderTop: `1px solid ${theme.palette.divider}`,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}
    >
      <Button 
        onClick={handleCancel} 
        variant="outlined" 
        disabled={submitting}
        fullWidth={isMobile}
        size={isMobile ? "medium" : "large"}
        sx={{ 
          px: { xs: 3, sm: 5 },
          py: { xs: 1, sm: 1.2 },
          borderRadius: 1.5
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        variant="contained"
        color="primary"
        disabled={submitting || loading}
        fullWidth={isMobile}
        size={isMobile ? "medium" : "large"}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AddTwoToneIcon />}
        sx={{ 
          px: { xs: 3, sm: 5 },
          py: { xs: 1, sm: 1.2 },
          borderRadius: 1.5,
          fontWeight: 600
        }}
      >
        {submitting ? 'Creating...' : 'Create Listing'}
      </Button>
    </DialogActions>
  );
};

export default ModalActions;
