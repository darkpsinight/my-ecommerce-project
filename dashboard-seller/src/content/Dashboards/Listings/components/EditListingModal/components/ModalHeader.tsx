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
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';

interface ModalHeaderProps {
  onClose: () => void;
  title?: string;
  isSubmitting?: boolean;
}

const ModalHeader: FC<ModalHeaderProps> = ({
  onClose,
  title = 'Edit Listing',
  isSubmitting = false
}) => {
  const theme = useTheme();

  return (
    <DialogTitle
      id="edit-listing-dialog-title"
      sx={{
        p: 2.5,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.15
        )}, ${alpha(theme.palette.primary.dark, 0.08)})`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.05)}`
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <EditTwoToneIcon
            sx={{
              mr: 2,
              color: theme.palette.primary.main,
              fontSize: 26
            }}
          />
          <Typography
            variant="h4"
            component="span"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.5px',
              color: theme.palette.text.primary,
              ml: 0.5
            }}
          >
            {title}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          disabled={isSubmitting}
          sx={{
            color: theme.palette.text.secondary,
            backgroundColor: alpha(theme.palette.primary.light, 0.2),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 1,
            p: 1,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.light, 0.1),
              color: theme.palette.primary.main,
              boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.1)}`
            },
            '&.Mui-disabled': {
              opacity: 0.5,
              cursor: 'not-allowed'
            },
            transition: theme.transitions.create(
              ['background-color', 'color', 'box-shadow'],
              {
                duration: theme.transitions.duration.shortest
              }
            )
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </DialogTitle>
  );
};

export default ModalHeader;