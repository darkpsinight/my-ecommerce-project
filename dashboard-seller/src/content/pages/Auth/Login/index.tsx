import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLogin } from './useLogin';
import { MainContent, LoginCard, LogoBox, GoogleButton } from './styles';

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const {
    isLoading,
    loginError,
    loginErrorHint,
    loginErrorLink,
    formErrors,
    handleLogin,
    handleGoogleLogin
  } = useLogin();

  const configData = useSelector((state: { config: { data: { APP_NAME: string } } }) => state.config.data);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <MainContent>
      <IconButton
        onClick={() => navigate('/')}
        sx={{
          position: 'fixed',
          top: { xs: 12, sm: 24, md: 32 },
          left: { xs: 12, sm: 24, md: 32 },
          color: '#fff',
          backgroundColor: 'primary.main',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          width: { xs: 36, sm: 42 },
          height: { xs: 36, sm: 42 },
          '&:hover': {
            backgroundColor: 'primary.dark',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          },
          transition: 'all 0.2s ease-in-out',
          zIndex: 1100
        }}
        size="large"
      >
        <ArrowBackIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
      </IconButton>
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
              {configData?.APP_NAME}
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
            Access your digital code store, manage inventory, and track sales
            all in one place
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
              <Typography variant="h4" fontWeight="Bold">
                {loginError}
              </Typography>
              {loginErrorHint && (
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  {loginErrorHint}
                </Typography>
              )}
              {loginErrorLink && (
                <Link href={loginErrorLink} sx={{ mt: 1, display: 'block' }}>
                  Click here to resolve
                </Link>
              )}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              margin="normal"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              type="email"
              disabled={isLoading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main'
                  }
                }
              }}
            />

            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              margin="normal"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              type={showPassword ? 'text' : 'password'}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={isLoading}
              sx={{
                mb: 2,
                py: 1.5,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <GoogleButton
              fullWidth
              onClick={handleGoogleLogin}
              disabled={isLoading}
              startIcon={<GoogleIcon />}
            >
              Continue with Google
            </GoogleButton>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Don't have an account?{' '}
                <Link
                  href={`${process.env.REACT_APP_BUYER_BASE_URL}/sell-digital-codes`}
                  color="primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join {configData?.APP_NAME} as seller
                </Link>
              </Typography>
            </Box>
          </form>
        </Box>
      </LoginCard>
    </MainContent>
  );
}

export default Login;
