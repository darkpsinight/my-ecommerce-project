import React from 'react';
import {
  DialogActions,
  Button,
  CircularProgress,
  useTheme,
  alpha,
  useMediaQuery,
  Box,
  Typography
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useModalContext } from '../ModalContext';

interface ModalActionsProps {
  onClose: () => void;
}

/**
 * Actions component for the Create New Listing modal
 */
const ModalActions: React.FC<ModalActionsProps> = ({ onClose }) => {
  const {
    handleSubmit,
    submitting,
    loading,
    resetForm,
    imageUploadInProgress
  } = useModalContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Combined loading state for both image upload and form submission
  const isProcessing = submitting || imageUploadInProgress;

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
        disabled={isProcessing}
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
        disabled={isProcessing || loading}
        fullWidth={isMobile}
        size={isMobile ? "medium" : "large"}
        startIcon={
          isProcessing ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <AddTwoToneIcon />
          )
        }
        sx={{
          px: { xs: 3, sm: 5 },
          py: { xs: 1, sm: 1.2 },
          borderRadius: 1.5,
          fontWeight: 600,
          minWidth: '180px'
        }}
      >
        {imageUploadInProgress ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CloudUploadIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="button">
              Uploading Image...
            </Typography>
          </Box>
        ) : submitting ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="button">
              Creating Listing...
            </Typography>
          </Box>
        ) : (
          'Create Listing'
        )}
      </Button>
    </DialogActions>
  );
};

export default ModalActions;
