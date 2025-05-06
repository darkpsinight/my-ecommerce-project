import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  useTheme,
  alpha
} from '@mui/material';
import { ModalProvider } from './ModalContext';
import { CreateListingModalProps } from './types';
import ModalHeader from './components/ModalHeader';
import ModalContent from './components/ModalContent';
import ModalActions from './components/ModalActions';

/**
 * Main container component for the Create New Listing modal
 * This component has been refactored to use smaller, more focused components
 * for better maintainability and scalability.
 */
const ImprovedCreateListingModal: FC<CreateListingModalProps> = (props) => {
  const { open, onClose, onSubmit, initialCategories } = props;
  const theme = useTheme();

  // Create a wrapper for onClose that resets the form
  const handleClose = () => {
    onClose();
  };

  return (
    <ModalProvider
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialCategories={initialCategories}
    >
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { 
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <ModalHeader onClose={handleClose} />
        <DialogContent 
          sx={{ 
            p: { xs: 2, sm: 3 },
            backgroundColor: alpha(theme.palette.background.default, 0.02)
          }}
        >
          <ModalContent />
        </DialogContent>
        <ModalActions onClose={onClose} />
      </Dialog>
    </ModalProvider>
  );
};

export default ImprovedCreateListingModal;
