import { useEffect, useRef } from 'react';
import { useRoutes } from 'react-router-dom';
import router from 'src/router';

import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

import { CssBaseline } from '@mui/material';
import ThemeProvider from './theme/ThemeProvider';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { useConfigFetcher } from 'src/hooks/useConfigFetcher';
import { useTokenRestoration } from 'src/hooks/useTokenRestoration';
import { useAuthRefresh } from 'src/hooks/useAuthRefresh';
import AuthProvider from './providers/AuthProvider';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';

function AppContent() {
  const content = useRoutes(router);
  const token = useSelector((state: RootState) => state.auth.token);
  const hasInitializedRef = useRef(false);
  
  useConfigFetcher();
  useTokenRestoration();
  const { refreshToken } = useAuthRefresh();
  
  // Initial token refresh only if we don't already have a token
  useEffect(() => {
    // Only attempt refresh once per session and only if no token is present
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Short delay to ensure DOM is ready
      const timer = setTimeout(() => {
        console.log('App: Attempting initial token refresh on page load');
        refreshToken().then(success => {
          console.log('App initial refresh result:', success ? 'successful' : 'failed');
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <ThemeProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: '1.2rem',
              minWidth: '400px',
              padding: '24px 32px',
              borderRadius: '12px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.18)'
            }
          }}
        />
        {content}
      </LocalizationProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Provider>
  );
}

export default App;
