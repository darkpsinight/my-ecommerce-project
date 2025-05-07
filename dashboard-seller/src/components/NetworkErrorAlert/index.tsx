import { FC, useState } from 'react';
import { Alert, Container, Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useError } from 'src/contexts/ErrorContext';

const NetworkErrorAlert: FC = () => {
  const { error, clearError } = useError();
  const [dismissed, setDismissed] = useState(false);

  if (!error || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    // Reset dismissed state after a delay to allow for future errors
    setTimeout(() => {
      setDismissed(false);
      clearError();
    }, 300);
  };

  return (
    <Box
      className="network-error-alert"
      sx={{
        width: '100%',
        py: 0.5,
        backgroundColor: '#ff0000cc',
        borderBottom: '1px solid #D32F2F',
        position: 'relative',
        zIndex: 1200, // Ensure it appears above other elements
        animation: 'fadeIn 0.3s ease-in-out',
        '@keyframes fadeIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(-10px)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        },
        '&.fade-out': {
          animation: 'fadeOut 0.3s ease-in-out forwards',
        },
        '@keyframes fadeOut': {
          '0%': {
            opacity: 1,
            transform: 'translateY(0)'
          },
          '100%': {
            opacity: 0,
            transform: 'translateY(-10px)'
          }
        }
      }}
    >
      <Container maxWidth="lg">
        <Alert
          severity="error"
          icon={false}
          action={
            <IconButton
              aria-label="close"
              onClick={handleDismiss}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.35)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)'
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                minWidth: 'auto',
                mr: 0.5,
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)'
              }}
            >
              <CloseIcon sx={{
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }} />
            </IconButton>
          }
          sx={{
            width: '100%',
            py: 0.5,
            backgroundColor: 'transparent',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-message': {
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            },
            '& .MuiAlert-action': {
              padding: 0,
              marginRight: 0,
              display: 'flex',
              alignItems: 'center',
              ml: 2
            }
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem'
            }}
          >
            {error}
          </Typography>
        </Alert>
      </Container>
    </Box>
  );
};

export default NetworkErrorAlert;
