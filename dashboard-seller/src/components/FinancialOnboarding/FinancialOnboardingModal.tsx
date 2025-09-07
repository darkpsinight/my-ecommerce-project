import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  Alert,
  AlertTitle,
  CircularProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Verified as VerifiedIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface FinancialOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  loading?: boolean;
}

const steps = [
  {
    label: 'Why Set Up Payments?',
    description: 'Learn about the benefits of connecting your payment account'
  },
  {
    label: 'Account Requirements',
    description: 'What you\'ll need to get started'
  },
  {
    label: 'Connect Stripe Account',
    description: 'Set up your payment processing'
  }
];

const FinancialOnboardingModal: React.FC<FinancialOnboardingModalProps> = ({
  open,
  onClose,
  onComplete,
  loading = false
}) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // On final step, initiate Stripe Connect onboarding
      handleStripeConnect();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStripeConnect = () => {
    // TODO: Implement Stripe Connect onboarding
    // This would typically create a Stripe Connect account and redirect to Stripe
    console.log('Starting Stripe Connect onboarding...');
    onComplete();
  };

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Ready to Get Paid?</AlertTitle>
              Setting up payments is required before you can start selling and receiving money from buyers.
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon color="primary" />
              Benefits of Setting Up Payments
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Receive Payments Instantly"
                  secondary="Get paid directly when customers purchase your digital codes"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Secure & Compliant"
                  secondary="Industry-standard security with PCI compliance through Stripe"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Global Reach"
                  secondary="Accept payments from customers worldwide in multiple currencies"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Automatic Payouts"
                  secondary="Funds are automatically transferred to your bank account"
                />
              </ListItem>
            </List>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>What You'll Need</AlertTitle>
              Make sure you have the following information ready before proceeding.
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              Required Information
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Business Information"
                  secondary="Business name, address, and type (individual or company)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Bank Account Details"
                  secondary="Account and routing numbers for receiving payouts"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Tax Information"
                  secondary="Tax ID or SSN (varies by country)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Identity Verification"
                  secondary="Government-issued ID for account verification"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> The setup process typically takes 5-10 minutes. 
              You can save your progress and return later if needed.
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>Ready to Connect!</AlertTitle>
              You'll be redirected to Stripe to complete your account setup securely.
            </Alert>

            <Box sx={{ textAlign: 'center', py: 3 }}>
              <AccountBalanceIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Secure Payment Setup with Stripe
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Stripe is our trusted payment partner, used by millions of businesses worldwide. 
                Your financial information is encrypted and never stored on our servers.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="success" fontSize="small" />
                  <Typography variant="body2">Bank-level Security</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon color="success" fontSize="small" />
                  <Typography variant="body2">PCI Compliant</Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary">
                By clicking "Connect Stripe Account", you'll be redirected to Stripe's secure platform 
                to complete your payment setup. After completion, you'll return to your dashboard.
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PaymentIcon color="primary" />
          <Typography variant="h4">
            Set Up Payment Processing
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Complete your payment setup to start selling and receiving payments from buyers. 
          This is a required step before you can list any products for sale.
        </Alert>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                {getStepContent(index)}
                <Box sx={{ mb: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mr: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      index === steps.length - 1 ? 'Connect Stripe Account' : 'Continue'
                    )}
                  </Button>
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Skip for Now
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          You can set this up later in your account settings
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

export default FinancialOnboardingModal;