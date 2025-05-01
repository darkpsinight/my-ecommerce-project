import React from 'react';
import { Box, DialogActions, Divider, Typography, Button, Stack, alpha, useTheme } from '@mui/material';
import { formatDate } from '../utils/formatters';

interface ModalFooterProps {
  createdAt: Date | string | null;
  onClose: () => void;
}

const ModalFooter: React.FC<ModalFooterProps> = ({ createdAt, onClose }) => {
  const theme = useTheme();

  return (
    <>
      <Divider />
      <DialogActions
        sx={{
          p: 2,
          justifyContent: 'space-between',
          bgcolor: alpha(theme.palette.background.default, 0.7)
        }}
      >
        <Box>
          {createdAt && (
            <Typography variant="caption" color="text.secondary">
              Created: {formatDate(createdAt)}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Stack>
      </DialogActions>
    </>
  );
};

export default ModalFooter;
