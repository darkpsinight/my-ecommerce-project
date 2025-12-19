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
  Verified as VerifiedIcon,
  Public as PublicIcon,
  Gavel as GavelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Skeleton,
  alpha
} from '@mui/material';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import Footer from 'src/components/Footer';

import { connectStripeAccount, getStripeAccountStatus } from 'src/services/api/payment';

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

  // New State for mandatory fields
  const [sellerType, setSellerType] = useState<string>('');
  const [country, setCountry] = useState<string>('US');
  const [countryConfirmed, setCountryConfirmed] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const status = await getStripeAccountStatus();
      setPaymentData({
        hasStripeAccount: status.hasAccount,
        stripeAccountStatus: status.chargesEnabled && status.payoutsEnabled ? 'verified' : (status.hasAccount ? 'requires_action' : 'pending'),
        // Map backend status to UI status. 
        // If hasAccount but not enabled, it's 'requires_action' or just 'pending' if details not submitted.
        // For simplicity:
        // 'verified' = charges & payouts enabled
        // 'requires_action' = hasAccount but not verified (could be details_submitted = false or requirements due)
        // 'pending' = intermediate state (maybe just returned from stripe but webhook not processed yet)

        canReceivePayments: status.chargesEnabled || false,
        pendingRequirements: status.requirements?.currently_due || [],
        accountUrl: 'https://dashboard.stripe.com/' // Ideally backend returns a login link if needed, or we just redirect to Connect
      });

      // Refined logic:
      if (status.chargesEnabled && status.payoutsEnabled) {
        setPaymentData(prev => ({ ...prev!, stripeAccountStatus: 'verified', canReceivePayments: true }));
      } else if (status.hasAccount) {
        // If we have an account but not verified, check if we need to do anything
        // Usually we just show 'Action Required' or 'Pending'
        if (status.detailsSubmitted) {
          setPaymentData(prev => ({ ...prev!, stripeAccountStatus: 'pending' }));
        } else {
          setPaymentData(prev => ({ ...prev!, stripeAccountStatus: 'requires_action' }));
        }
      } else {
        setPaymentData(prev => ({ ...prev!, stripeAccountStatus: null }));
      }

    } catch (error) {
      console.error('Error fetching status:', error);
      // Fallback/Mock for dev if API fails? No, better show error.
      setPaymentData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartStripeSetup = async () => {
    setSetupLoading(true);
    try {
      console.log('Starting Stripe Connect setup...');
      const response = await connectStripeAccount(country, sellerType);

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error) {
      console.error('Error starting Stripe setup:', error);
      setSetupLoading(false);
      // You might want to show a snackbar error here
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboards/listings');
  };

  const getStatusContent = () => {
    if (loading) {
      return (
        <Box>
          {/* Status Banner Skeleton */}
          <Skeleton variant="rectangular" height={80} sx={{ mb: 4, borderRadius: 1 }} />

          <Grid container spacing={4}>
            {/* Main Content / Stepper Skeleton */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', mb: 3 }}>
                    <Box sx={{ width: '100%' }}>
                      <Skeleton width="40%" height={32} sx={{ mb: 1 }} />
                      <Skeleton width="100%" height={100} variant="rectangular" sx={{ borderRadius: 1 }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Skeleton width={100} height={40} variant="rectangular" sx={{ borderRadius: 1 }} />
                    <Skeleton width={80} height={40} variant="rectangular" sx={{ borderRadius: 1 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar / Help Skeleton */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Skeleton width="60%" height={32} sx={{ mb: 2 }} />
                  <Skeleton width="100%" height={20} sx={{ mb: 1 }} />
                  <Skeleton width="90%" height={20} sx={{ mb: 3 }} />
                  <Skeleton width="100%" height={40} variant="rectangular" sx={{ borderRadius: 1 }} />
                  <Divider sx={{ my: 2 }} />
                  <Skeleton width="50%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
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
        <Card sx={{ textAlign: 'center', p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
          <Box
            sx={{
              mb: 3,
              display: 'inline-flex',
              p: 2.5,
              borderRadius: '50%',
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
              color: 'warning.main',
            }}
          >
            <WarningIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h4" gutterBottom>
            Action Required
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your payment account has been created, but Stripes requires some additional information before you can receive payouts.
          </Typography>

          {paymentData.pendingRequirements && paymentData.pendingRequirements.length > 0 && (
            <Box sx={{ my: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, textAlign: 'left', display: 'inline-block' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing Information:</Typography>
              <List dense>
                {paymentData.pendingRequirements.map((req, idx) => {
                  // Helper to format Stripe requirement codes to human readable text
                  const formatRequirementField = (field: string) => {
                    const map: Record<string, string> = {
                      'individual.dob.day': 'Date of birth (Day)',
                      'individual.dob.month': 'Date of birth (Month)',
                      'individual.dob.year': 'Date of birth (Year)',
                      'individual.address.city': 'City',
                      'individual.address.line1': 'Address Line 1',
                      'individual.address.postal_code': 'Postal Code',
                      'individual.address.state': 'State/Province',
                      'individual.email': 'Email Address',
                      'individual.first_name': 'First Name',
                      'individual.last_name': 'Last Name',
                      'individual.phone': 'Phone Number',
                      'individual.id_number': 'ID Number',
                      'individual.ssn_last_4': 'SSN (Last 4)',
                      'company.address.city': 'Company City',
                      'company.address.line1': 'Company Address',
                      'company.address.postal_code': 'Company Postal Code',
                      'company.address.state': 'Company State',
                      'company.name': 'Company Name',
                      'company.tax_id': 'Tax ID',
                      'external_account': 'Bank Account',
                      'tos_acceptance.date': 'Terms of Service Acceptance',
                      'tos_acceptance.ip': 'Terms of Service IP'
                    };

                    if (map[field]) return map[field];

                    // Fallback: Replace dots and underscores with spaces and capitalize
                    return field
                      .replace(/individual\./g, '')
                      .replace(/company\./g, '')
                      .replace(/_/g, ' ')
                      .replace(/\./g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase());
                  };

                  return (
                    <ListItem key={idx} disablePadding>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <InfoIcon fontSize="small" color="info" />
                      </ListItemIcon>
                      <ListItemText primary={formatRequirementField(req)} />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              href={paymentData.accountUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />}
            >
              Complete Setup on Stripe
            </Button>
          </Box>
        </Card>
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
      label: 'Business Details',
      content: (
        <Box sx={{ py: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Important Configuration</AlertTitle>
            This information is required by Stripe to verify your identity and cannot be changed later.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="seller-type-label">Seller Type</InputLabel>
                <Select
                  labelId="seller-type-label"
                  value={sellerType}
                  label="Seller Type"
                  onChange={(e) => setSellerType(e.target.value)}
                >
                  <MenuItem value="individual">Individual (Natural Person)</MenuItem>
                  <MenuItem value="company">Company (Registered Business)</MenuItem>
                </Select>
                <FormHelperText>
                  Select 'Individual' if you don't have a registered company entity.
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="country-label">Legal Country</InputLabel>
                <Select
                  labelId="country-label"
                  value={country}
                  label="Legal Country"
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <MenuItem value="US">United States</MenuItem>
                  <MenuItem value="CA">Canada</MenuItem>
                  <MenuItem value="GB">United Kingdom</MenuItem>
                  <MenuItem value="DE">Germany</MenuItem>
                  <MenuItem value="FR">France</MenuItem>
                  <MenuItem value="IT">Italy</MenuItem>
                  <MenuItem value="ES">Spain</MenuItem>
                  <MenuItem value="AU">Australia</MenuItem>
                  <MenuItem value="NZ">New Zealand</MenuItem>
                  <MenuItem value="IE">Ireland</MenuItem>
                  {/* Add more countries as needed */}
                </Select>
                <FormHelperText>
                  Determines your payout currency and regulatory framework.
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={countryConfirmed}
                    onChange={(e) => setCountryConfirmed(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" color="text.primary">
                    I understand my country and payout currency cannot be changed later.
                  </Typography>
                }
              />
            </Grid>
          </Grid>
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
            disabled={setupLoading || !countryConfirmed || !sellerType || !country}
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

        {!loading && !paymentData?.hasStripeAccount && (
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
