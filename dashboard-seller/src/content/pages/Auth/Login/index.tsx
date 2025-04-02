import { Box, Button, Container, TextField, Typography, Link, Card, CircularProgress, Divider, Alert, InputAdornment, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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

const GoogleButton = styled(Button)(({ theme }) => `
    background-color: #fff;
    color: rgba(0, 0, 0, 0.87);
    border: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    text-transform: none;
    font-weight: 500;
    padding: ${theme.spacing(1.5)};
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
        background-color: #f5f5f5;
        box-shadow: 0 4px 8px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    
    .MuiSvgIcon-root {
        margin-right: ${theme.spacing(1)};
        color: #4285F4;
    }
`);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');  
  const [loginErrorHint, setLoginErrorHint] = useState('');  
  const [loginErrorLink, setLoginErrorLink] = useState('');  
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      setLoginError('');
      setLoginErrorHint('');
      setLoginErrorLink('');
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/seller-signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          // Extract detailed error information
          const errorMessage = data.message || 'Login failed';
          const errorHint = data.metadata?.hint || '';
          const errorLink = data.metadata?.links?.signin || '';
          
          setLoginError(errorMessage);
          setLoginErrorHint(errorHint);
          setLoginErrorLink(errorLink);
          throw new Error(errorMessage);
        }

        // Store authentication token in localStorage
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.refreshToken) {
          localStorage.setItem('refresh_token', data.refreshToken);
        }

        // Redirect to dashboard
        navigate('/overview');
      } catch (error) {
        console.error('Login failed:', error);
        setLoginError(error.message || 'Authentication failed. Please check your credentials.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('Google login is not implemented yet.');
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

          {loginError && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 3,
                borderRadius: '8px'
              }}
            >
              <Typography variant="h4" fontWeight="Bold">{loginError}</Typography>
              {loginErrorHint && (
                <Typography variant="subtitle1" sx={{ mt: 1 }}>{loginErrorHint}</Typography>
              )}
              
            </Alert>
          )}

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
              type={showPassword ? 'text' : 'password'}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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

          <Divider sx={{ width: '100%', my: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
              OR
            </Typography>
          </Divider>

          <GoogleButton
            fullWidth
            size="large"
            onClick={handleGoogleLogin}
            sx={{ mb: 3 }}
          >
            <GoogleIcon />
            Sign in with Google
          </GoogleButton>

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