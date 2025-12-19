import React, { useState } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Typography,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

interface FinancialSetupData {
  hasStripeAccount: boolean;
  stripeAccountStatus: 'pending' | 'verified' | 'requires_action' | null;
  canReceivePayments: boolean;
  pendingRequirements?: string[];
}

interface FinancialStatusBannerProps {
  profileData: {
    hasProfile: boolean;
    profile?: any;
  } | null;
  financialData: FinancialSetupData | null;
  loading: boolean;
  onSetupPayments: () => void;
  onViewPaymentSettings: () => void;
}

const FinancialStatusBanner: React.FC<FinancialStatusBannerProps> = ({
  profileData,
  financialData,
  loading,
  onSetupPayments,
  onViewPaymentSettings
}) => {
  // LocalStorage key for tracking financial setup dismissal
  const FINANCIAL_DISMISSED_KEY = 'financial-setup-dismissed';

  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(FINANCIAL_DISMISSED_KEY) === 'true';
  });

  const handleDismissFinancial = () => {
    setIsDismissed(true);
    localStorage.setItem(FINANCIAL_DISMISSED_KEY, 'true');
  };

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="info">
          <AlertTitle>Loading payment status...</AlertTitle>
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      </Box>
    );
  }

  // Don't show if profile setup is not complete
  if (!profileData?.hasProfile) {
    return null;
  }

  // Don't show if no financial data available
  if (!financialData) {
    return null;
  }

  // If payments are fully set up and working
  if (financialData.canReceivePayments && financialData.stripeAccountStatus === 'verified') {
    if (!isDismissed) {
      return (
        <Box sx={{ mb: 3 }}>
          <Alert
            severity="success"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleDismissFinancial}
                variant="outlined"
              >
                Dismiss
              </Button>
            }
          >
            <AlertTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon />
                Payment Setup Complete!
              </Box>
            </AlertTitle>
            <Typography variant="body2">
              Your payment processing is active. You can now receive payments from buyers.
              <Button
                size="small"
                onClick={onViewPaymentSettings}
                sx={{ ml: 1, textTransform: 'none' }}
              >
                View Settings
              </Button>
            </Typography>
          </Alert>
        </Box>
      );
    }
    return null;
  }

  // If Stripe account exists but needs attention
  if (financialData.hasStripeAccount && financialData.stripeAccountStatus === 'requires_action') {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<SecurityIcon />}
              onClick={onViewPaymentSettings}
              variant="outlined"
            >
              Complete Setup
            </Button>
          }
        >
          <AlertTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon />
              Action Required: Payment Setup
            </Box>
          </AlertTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Your payment account needs additional information to start receiving payments.
          </Typography>
          {financialData.pendingRequirements && financialData.pendingRequirements.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {financialData.pendingRequirements.map((requirement, index) => (
                <Chip
                  key={index}
                  label={requirement}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Alert>
      </Box>
    );
  }

  // If Stripe account exists but is pending verification
  if (financialData.hasStripeAccount && financialData.stripeAccountStatus === 'pending') {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={onViewPaymentSettings}
              variant="outlined"
            >
              Check Status
            </Button>
          }
        >
          <AlertTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceIcon />
              Payment Verification in Progress
            </Box>
          </AlertTitle>
          <Typography variant="body2">
            Your payment account is being verified. This usually takes 1-2 business days.
            You'll be notified once it's ready to receive payments.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // If no payment setup at all
  if (!financialData.hasStripeAccount) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<PaymentIcon />}
              onClick={onViewPaymentSettings}
              variant="outlined"
            >
              Set Up Payments
            </Button>
          }
        >
          <AlertTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon />
              Payment Setup Required
            </Box>
          </AlertTitle>
          <Typography variant="body2">
            You need to set up payment processing before you can start selling.
            This is required to receive payments from buyers.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return null;
};

export default FinancialStatusBanner;