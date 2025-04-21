import { FC, useState } from 'react';
import { 
  Typography, 
  IconButton, 
  Box, 
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

interface MaskedCodeProps {
  code: string;
}

export const MaskedCode: FC<MaskedCodeProps> = ({ code }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <>
      <Tooltip title="View code" arrow>
        <Paper 
          elevation={0} 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            py: 0.5,
            px: 1,
            borderRadius: 1,
            cursor: 'pointer',
            width: '100px' // Fixed width to prevent layout shifts
          }}
          onClick={handleOpenModal}
        >
          <VisibilityIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            View code
          </Typography>
        </Paper>
      </Tooltip>

      <Dialog 
        open={isModalOpen} 
        onClose={handleCloseModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Product Code</Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body1" fontFamily="monospace" fontSize="16px">
              {code}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            This code is partially masked for security. Only you can see this information.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyCode}
            color={copySuccess ? "success" : "primary"}
          >
            {copySuccess ? "Copied!" : "Copy Code"}
          </Button>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MaskedCode;
