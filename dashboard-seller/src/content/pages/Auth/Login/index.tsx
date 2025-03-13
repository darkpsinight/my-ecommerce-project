import { Box, Button, Container, TextField, Typography, Link, Card, CircularProgress, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';

const MainContent = styled(Box)(({ theme }) => `
    min-height: 100vh;
    display: flex;
    flex: 1;
    overflow: auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%);
`);

const LoginCard = styled(Card)(({ theme }) => `
    padding: ${theme.spacing(4)};
    margin: ${theme.spacing(3)};
    width: 100%;
    max-width: 450px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    border-radius: 16px;
    transition: all 0.3s ease-in-out;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.18);
    }
`);

const LogoBox = styled(Box)(({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: ${theme.spacing(3)};
    
    .MuiSvgIcon-root {
        font-size: 3rem;
        color: ${theme.palette.primary.main};
        margin-right: ${theme.spacing(1)};
    }
`);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        // TODO: Implement login logic here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
        console.log('Login attempt with:', { email, password });
      } catch (error) {
        console.error('Login failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <MainContent>
      <LoginCard>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <LogoBox>
            <StorefrontIcon />
            <Typography 
              variant="h4" 
              component="span"
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              DigitalMarket
            </Typography>
          </LogoBox>

          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontSize: '2.2rem',
              fontWeight: 700,
              textAlign: 'center',
              mb: 1
            }}
          >
            Welcome to Your Dashboard
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="textSecondary" 
            sx={{ 
              mb: 4,
              textAlign: 'center',
              maxWidth: '80%'
            }}
          >
            Access your digital code store, manage inventory, and track sales all in one place
          </Typography>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              type="email"
              disabled={isLoading}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}
            />
            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              type="password"
              disabled={isLoading}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}
            />
            <Button
              fullWidth
              size="large"
              variant="contained"
              color="primary"
              type="submit"
              disabled={isLoading}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In to Dashboard'
              )}
            </Button>
          </form>

          <Divider sx={{ width: '100%', my: 3 }} />

          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 1 
            }}
          >
            <Typography variant="body2" color="textSecondary">
              New to DigitalMarket?
            </Typography>
            <Link
              component={RouterLink}
              to="/register"
              variant="subtitle2"
              underline="hover"
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': {
                  color: 'primary.dark'
                }
              }}
            >
              Create a Seller Account
            </Link>
          </Box>
        </Box>
      </LoginCard>

      <Typography 
        variant="body2" 
        color="white" 
        sx={{ 
          mt: 2,
          opacity: 0.8,
          textAlign: 'center'
        }}
      >
        Need help? Contact our seller support team
      </Typography>
    </MainContent>
  );
}

export default Login;