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
          p: { xs: 1.5, sm: 2 },
          justifyContent: 'space-between',
          bgcolor: alpha(theme.palette.background.default, 0.7),
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 1, sm: 0 }
        }}
      >
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {createdAt && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              Created: {formatDate(createdAt)}
            </Typography>
          )}
        </Box>
        <Stack 
          direction="row" 
          spacing={1}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-end', sm: 'flex-start' }
          }}
        >
          <Button 
            variant="outlined" 
            onClick={onClose}
            size="small"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: '60px', sm: '64px' } 
            }}
          >
            Close
          </Button>
        </Stack>
      </DialogActions>
    </>
  );
};

export default ModalFooter;