import { FC } from 'react';
import { DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalHeaderProps {
  onClose: () => void;
  title?: string;
}

const ModalHeader: FC<ModalHeaderProps> = ({ onClose, title = 'Edit Listing' }) => {
  return (
    <DialogTitle
      sx={{
        m: 0,
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h4" component="h2">
        {title}
      </Typography>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          color: (theme) => theme.palette.grey[500]
        }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
  );
};

export default ModalHeader;
