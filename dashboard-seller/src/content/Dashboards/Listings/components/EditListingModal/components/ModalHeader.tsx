import { FC } from 'react';
import { 
  DialogTitle, 
  IconButton, 
  Typography, 
  Box,
  useTheme,
  alpha
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

interface ModalHeaderProps {
  onClose: () => void;
  title?: string;
}

const ModalHeader: FC<ModalHeaderProps> = ({ onClose, title = 'Edit Listing' }) => {
  const theme = useTheme();

  return (
    <DialogTitle
      id="edit-listing-dialog-title"
      sx={{
        p: 2,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.12
        )}, ${alpha(theme.palette.primary.dark, 0.05)})`,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <EditIcon
            sx={{
              mr: 1.5,
              color: theme.palette.error.main,
              fontSize: 28
            }}
          />
          <Typography
            variant="h5"
            component="span"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            {title}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme.palette.grey[500],
            backgroundColor: alpha(theme.palette.grey[100], 0.3),
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.light, 0.1),
              color: theme.palette.error.main
            },
            transition: theme.transitions.create(
              ['background-color', 'color'],
              {
                duration: theme.transitions.duration.shortest
              }
            )
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
  );
};

export default ModalHeader;