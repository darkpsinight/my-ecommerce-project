import React from 'react';
import { Box, DialogTitle, IconButton, Typography, useTheme, alpha } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ModalHeaderProps {
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => {
  const theme = useTheme();

  return (
    <DialogTitle
      id="listing-details-dialog-title"
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
          <InfoOutlinedIcon
            sx={{
              mr: 1.5,
              color: theme.palette.primary.main,
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
            Listing Details
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
