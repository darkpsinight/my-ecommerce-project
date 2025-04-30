import { FC } from 'react';
import {
  Typography,
  Tooltip,
  Paper
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CodeViewerButtonProps } from './types';

export const CodeViewerButton: FC<CodeViewerButtonProps> = ({ codes, onClick }) => {
  return (
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
          width: '100px', // Fixed width to prevent layout shifts
          boxShadow: '0px 9px 16px rgba(159, 162, 191, .18), 0px 2px 2px rgba(159, 162, 191, 0.32)'
        }}
        onClick={onClick}
      >
        <VisibilityIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          View {codes.length > 1 ? 'codes' : 'code'}
        </Typography>
      </Paper>
    </Tooltip>
  );
};

export default CodeViewerButton;
