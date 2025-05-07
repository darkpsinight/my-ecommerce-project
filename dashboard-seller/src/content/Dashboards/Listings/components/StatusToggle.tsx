import React from 'react';
import { 
  Box, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Typography, 
  useTheme,
  alpha
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface StatusToggleProps {
  status: 'active' | 'draft';
  onStatusChange: (newStatus: 'active' | 'draft') => void;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ status, onStatusChange }) => {
  const theme = useTheme();
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onStatusChange(event.target.value as 'active' | 'draft');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: '20px',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.05)}`,
      }}
    >
      <RadioGroup
        row
        value={status}
        onChange={handleChange}
        sx={{
          margin: 0,
        }}
      >
        {/* Draft option */}
        <FormControlLabel
          value="draft"
          control={
            <Radio
              sx={{
                padding: 0,
                margin: 0,
                opacity: 0,
                width: 0,
                '&.Mui-checked + .MuiFormControlLabel-label': {
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  fontWeight: 'bold',
                }
              }}
            />
          }
          label={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                py: 0.5,
                px: 1.5,
                borderRadius: '20px 0 0 20px',
                backgroundColor: status === 'draft' 
                  ? alpha(theme.palette.warning.main, 0.1)
                  : 'transparent',
                color: status === 'draft' 
                  ? theme.palette.warning.main
                  : theme.palette.text.secondary,
                fontWeight: status === 'draft' ? 'bold' : 'normal',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: status === 'draft'
                    ? alpha(theme.palette.warning.main, 0.15)
                    : alpha(theme.palette.grey[200], 0.5),
                }
              }}
            >
              <VisibilityOffIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
              <Typography variant="body2">Draft</Typography>
            </Box>
          }
          sx={{
            margin: 0,
            '.MuiFormControlLabel-label': {
              margin: 0,
            }
          }}
        />
        
        {/* Publish option */}
        <FormControlLabel
          value="active"
          control={
            <Radio
              sx={{
                padding: 0,
                margin: 0,
                opacity: 0,
                width: 0,
                '&.Mui-checked + .MuiFormControlLabel-label': {
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  fontWeight: 'bold',
                }
              }}
            />
          }
          label={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                py: 0.5,
                px: 1.5,
                borderRadius: '0 20px 20px 0',
                backgroundColor: status === 'active' 
                  ? alpha(theme.palette.success.main, 0.1)
                  : 'transparent',
                color: status === 'active' 
                  ? theme.palette.success.main
                  : theme.palette.text.secondary,
                fontWeight: status === 'active' ? 'bold' : 'normal',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: status === 'active'
                    ? alpha(theme.palette.success.main, 0.15)
                    : alpha(theme.palette.grey[200], 0.5),
                }
              }}
            >
              <VisibilityIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
              <Typography variant="body2">PUBLISH</Typography>
            </Box>
          }
          sx={{
            margin: 0,
            '.MuiFormControlLabel-label': {
              margin: 0,
            }
          }}
        />
      </RadioGroup>
    </Box>
  );
};

export default StatusToggle;
