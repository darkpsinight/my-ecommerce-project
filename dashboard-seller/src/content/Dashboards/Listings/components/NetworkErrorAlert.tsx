import { FC, useContext, useState } from 'react';
import { Alert, Container, Box, IconButton, Typography } from '@mui/material';
import { ListingsContext } from '../context/ListingsContext';
import CloseIcon from '@mui/icons-material/Close';

const NetworkErrorAlert: FC = () => {
  const { error } = useContext(ListingsContext);
  const [dismissed, setDismissed] = useState(false);

  if (!error || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <Box
      sx={{
        width: '100%',
        py: 0.5,
        backgroundColor: '#ff0000cc',
        borderBottom: '1px solid #D32F2F'
      }}
    >
      <Container maxWidth="lg">
        <Alert
          severity="error"
          icon={false}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismiss}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            width: '100%',
            py: 0.5,
            backgroundColor: 'transparent',
            color: '#FFFFFF',
            border: 'none',
            '& .MuiAlert-message': {
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            },
            '& .MuiAlert-action': {
              padding: 0,
              marginRight: 0
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
