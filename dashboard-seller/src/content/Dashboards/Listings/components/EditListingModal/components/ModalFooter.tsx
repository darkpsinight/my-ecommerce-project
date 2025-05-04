import { FC } from 'react';
import { DialogActions, Button, Box, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { Listing } from '../../../types';

interface ModalFooterProps {
  onClose: () => void;
  showSaveButton?: boolean;
  onSave?: (updatedData: Partial<Listing>) => void;
  isSubmitting?: boolean;
}

const ModalFooter: FC<ModalFooterProps> = ({ 
  onClose,
  showSaveButton = false,
  onSave,
  isSubmitting = false
}) => {
  const handleSave = () => {
    if (onSave) {
      // The actual form data will be collected in the ListingForm component
      // This just triggers the save action
      onSave({});
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
      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
        <Button
          onClick={onClose}
          color="primary"
          variant="outlined"
          sx={{ mr: 'auto' }}
        >
          Close
        </Button>
        
        {showSaveButton && onSave && (
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </Box>
    </DialogActions>
  );
};

export default ModalFooter;
