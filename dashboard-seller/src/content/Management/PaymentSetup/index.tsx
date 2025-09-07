import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  AlertTitle,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import Footer from 'src/components/Footer';

interface PaymentSetupData {
  hasStripeAccount: boolean;
  stripeAccountStatus: 'pending' | 'verified' | 'requires_action' | null;
  canReceivePayments: boolean;
  pendingRequirements?: string[];
  accountUrl?: string;
}

const PaymentSetup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentSetupData | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Simulate loading payment setup data
    // TODO: Replace with actual API call
    setTimeout(() => {
      setPaymentData({
        hasStripeAccount: false,
        stripeAccountStatus: null,
        canReceivePayments: false,
        pendingRequirements: []
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleStartStripeSetup = async () => {
    setSetupLoading(true);
    try {
      // TODO: Implement actual Stripe Connect onboarding
      console.log('Starting Stripe Connect setup...');

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to Stripe Connect onboarding URL
      // window.location.href = stripeOnboardingUrl;

      setSetupLoading(false);
    } catch (error) {
      console.error('Error starting Stripe setup:', error);
      setSetupLoading(false);
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboards/listings');
  };

  const getStatusContent = () => {
    if (loading) {
      return (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Loading payment setup status...</Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    if (!paymentData) {
      return (
        <Alert severity="error">
          <AlertTitle>Unable to Load Payment Status</AlertTitle>
          There was an error loading your payment setup information. Please try
          refreshing the page.
        </Alert>
      );
    }

    if (
      paymentData.canReceivePayments &&
      paymentData.stripeAccountStatus === 'verified'
    ) {
      return (
        <Alert severity="success">
          <AlertTitle>Payment Setup Complete!</AlertTitle>
          Your payment processing is active and ready to receive payments from
          buyers.
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/management/profile/settings')}
              sx={{ mr: 1 }}
            >
              View Payment Settings
            </Button>
            <Button variant="contained" onClick={handleReturnToDashboard}>
              Return to Dashboard
            </Button>
          </Box>
        </Alert>
      );
    }

    if (
      paymentData.hasStripeAccount &&
      paymentData.stripeAccountStatus === 'requires_action'
    ) {
      return (
        <Alert severity="warning">
          <AlertTitle>Action Required</AlertTitle>
          Your payment account needs additional information to start receiving
          payments.
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              href={paymentData.accountUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Complete Setup on Stripe
            </Button>
          </Box>
        </Alert>
      );
    }

    if (
      paymentData.hasStripeAccount &&
      paymentData.stripeAccountStatus === 'pending'
    ) {
      return (
        <Alert severity="info">
          <AlertTitle>Verification in Progress</AlertTitle>
          Your payment account is being verified. This usually takes 1-2
          business days.
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleReturnToDashboard}>
              Return to Dashboard
            </Button>
          </Box>
        </Alert>
      );
    }

    // No Stripe account setup
    return null;
  };

  const steps = [
    {
      label: 'Why Set Up Payments?',
      content: (
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PaymentIcon color="primary" />
            Benefits of Payment Setup
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Receive payments instantly when customers purchase" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Secure processing with bank-level encryption" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Automatic payouts to your bank account" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Accept payments from customers worldwide" />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      label: "What You'll Need",
      content: (
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
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
                secondary="Business name, address, and type"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Bank Account Details"
                secondary="Account and routing numbers for payouts"
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
                secondary="Government-issued ID"
              />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      label: 'Start Setup',
      content: (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <AccountBalanceIcon
            sx={{ fontSize: 64, color: 'primary.main', mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            Secure Payment Setup with Stripe
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You'll be redirected to Stripe to complete your account setup
            securely. Your information is encrypted and never stored on our
            servers.
          </Typography>
          <Box
            sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon color="success" fontSize="small" />
              <Typography variant="body2">Bank-level Security</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedIcon color="success" fontSize="small" />
              <Typography variant="body2">PCI Compliant</Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartStripeSetup}
            disabled={setupLoading}
            startIcon={
              setupLoading ? (
                <CircularProgress size={20} />
              ) : (
                <AccountBalanceIcon />
              )
            }
          >
            {setupLoading ? 'Setting Up...' : 'Connect Stripe Account'}
          </Button>
        </Box>
      )
    }
  ];

  return (
    <>
      <Helmet>
        <title>Payment Setup - Seller Dashboard</title>
      </Helmet>

      <PageTitleWrapper>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box>
            <Typography variant="h3" component="h3" gutterBottom>
              Payment Setup
            </Typography>
            <Typography variant="subtitle2">
              Set up your payment processing to start receiving payments from
              buyers
            </Typography>
          </Box>
        </Box>
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>{getStatusContent()}</Box>

        {(!paymentData?.hasStripeAccount ||
          paymentData?.stripeAccountStatus !== 'verified') && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel>
                          <Typography variant="h6">{step.label}</Typography>
                        </StepLabel>
                        <StepContent>
                          {step.content}
                          <Box sx={{ mb: 2, mt: 2 }}>
                            {index < steps.length - 1 && (
                              <Button
                                variant="contained"
                                onClick={() => setActiveStep(index + 1)}
                                sx={{ mr: 1 }}
                              >
                                Continue
                              </Button>
                            )}
                            {index > 0 && (
                              <Button onClick={() => setActiveStep(index - 1)}>
                                Back
                              </Button>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Need Help?
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    If you encounter any issues during setup, our support team
                    is here to help.
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Contact Support
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary">
                    <strong>Setup typically takes:</strong>
                    <br />
                    5-10 minutes for account creation
                    <br />
                    1-2 business days for verification
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>

      <Footer />
    </>
  );
};

export default PaymentSetup;
