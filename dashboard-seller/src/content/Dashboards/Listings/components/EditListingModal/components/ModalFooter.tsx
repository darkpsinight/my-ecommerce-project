import { FC } from 'react';
import { DialogActions, Button, Box, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { ExtendedListing } from './ListingForm/utils/types';

interface ModalFooterProps {
  onClose: () => void;
  showSaveButton?: boolean;
  onSave?: (updatedData: ExtendedListing) => void;
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
      // Pass a non-empty object to avoid triggering the refresh logic
      // and indicate this is a save action from the footer
      console.log('Save button clicked in ModalFooter');

      // This will trigger the image upload in the EditListingModal component
      // before the form is submitted
      onSave({ _saveAction: true });
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
