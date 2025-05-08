import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Divider,
  alpha,
  Paper,
  Avatar,
  Chip,
  Stack,
  Alert,
  Zoom
} from '@mui/material';
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone';
import CodeTwoToneIcon from '@mui/icons-material/CodeTwoTone';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  severity?: 'warning' | 'error' | 'info' | 'success';
  itemDetails?: {
    title?: string;
    fullTitle?: string;
    subtitle?: string;
    image?: string;
    metadata?: Array<{ label: string; value: string | number }>;
    codeCount?: number;
    additionalWarning?: string;
  };
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  severity = 'warning',
  itemDetails
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Determine icon and colors based on severity
  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      case 'success':
        return theme.palette.success.main;
      case 'warning':
      default:
        return theme.palette.warning.main;
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'error':
        return <DeleteTwoToneIcon fontSize="large" />;
      case 'info':
        return <InfoTwoToneIcon fontSize="large" />;
      case 'success':
        return <CheckCircleOutlineIcon fontSize="large" />;
      case 'warning':
      default:
        return <WarningTwoToneIcon fontSize="large" />;
    }
  };

  const severityColor = getSeverityColor();
  const SeverityIcon = getSeverityIcon();

  // We're no longer truncating titles based on screen size
  // This function is kept as a placeholder in case title handling is needed later
  const truncateTitle = (text: string) => {
    return text || '';
  };

  // Calculate appropriate layout dimensions
  const dialogWidth = isMobile ? '95%' : itemDetails ? '500px' : '450px';
  const headerPadding = isMobile ? 2 : 3;
  const contentPadding = {
    xs: isMobile ? 2 : 2.5,
    sm: 3
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={isLoading ? undefined : onCancel}
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        TransitionComponent={Zoom}
        PaperProps={{
          elevation: 10,
          sx: {
            borderRadius: '16px',
            width: dialogWidth,
            maxWidth: '95%',
            overflow: 'hidden',
            backgroundImage: 'none',
            background:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.95)
                : '#fff',
            boxShadow:
              severity === 'error'
                ? `0 8px 24px ${alpha(theme.palette.error.main, 0.25)}`
                : `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
            border:
              severity === 'error'
                ? `1px solid ${alpha(severityColor, 0.2)}`
                : 'none'
          }
        }}
      >
        <Box
          sx={{
            p: { xs: headerPadding, sm: headerPadding },
            background:
              severity === 'error'
                ? `linear-gradient(135deg, ${alpha(
                    severityColor,
                    0.12
                  )}, ${alpha(severityColor, 0.06)})`
                : severity === 'success'
                ? `linear-gradient(135deg, ${alpha(
                    severityColor,
                    0.12
                  )}, ${alpha(severityColor, 0.06)})`
                : `linear-gradient(135deg, ${alpha(
                    severityColor,
                    0.1
                  )}, ${alpha(severityColor, 0.03)})`,
            borderBottom: `1px solid ${alpha(severityColor, 0.15)}`
          }}
        >
          <DialogTitle id="confirmation-dialog-title" sx={{ p: 0 }}>
            <Box display="flex" alignItems="center">
              <Avatar
                sx={{
                  mr: { xs: 1.5, sm: 2 },
                  bgcolor: alpha(severityColor, 0.18),
                  color: severityColor,
                  width: { xs: 42, sm: 50 },
                  height: { xs: 42, sm: 50 },
                  boxShadow: `0 0 0 3px ${alpha(severityColor, 0.2)}`,
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: '1.75rem', sm: '2rem' }
                  }
                }}
              >
                {SeverityIcon}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h3"
                  component="span"
                  sx={{
                    fontWeight: 700,
                    display: 'block',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    lineHeight: 1.2,
                    color:
                      theme.palette.mode === 'dark'
                        ? '#fff'
                        : theme.palette.grey[900]
                  }}
                >
                  {title}
                </Typography>
                {itemDetails?.codeCount !== undefined && (
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.9),
                      display: 'flex',
                      alignItems: 'center',
                      mt: 0.75,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    <CodeTwoToneIcon
                      fontSize="small"
                      sx={{
                        mr: 0.5,
                        color: severityColor,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    />
                    {itemDetails.codeCount}{' '}
                    {itemDetails.codeCount === 1 ? 'code' : 'codes'} will be
                    permanently deleted
                  </Typography>
                )}
              </Box>
              {!isLoading && (
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    opacity: 0.6,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <Button
                    onClick={onCancel}
                    color="inherit"
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </Button>
                </Box>
              )}
            </Box>
          </DialogTitle>
        </Box>

        <DialogContent
          sx={{
            pt: { xs: contentPadding.xs, sm: contentPadding.sm },
            pb: itemDetails
              ? { xs: 1, sm: 1.5 }
              : { xs: contentPadding.xs, sm: contentPadding.sm },
            px: { xs: contentPadding.xs, sm: contentPadding.sm }
          }}
        >
          <DialogContentText
            id="confirmation-dialog-description"
            sx={{
              color: alpha(theme.palette.text.primary, 0.9),
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              mb: itemDetails ? 3 : 0,
              lineHeight: 1.5
            }}
          >
            {message}
          </DialogContentText>

          {itemDetails?.additionalWarning && (
            <Alert
              severity="warning"
              variant="outlined"
              sx={{
                mt: 2,
                mb: 2,
                borderRadius: 1.5,
                '& .MuiAlert-icon': {
                  color: theme.palette.warning.main
                }
              }}
            >
              {itemDetails.additionalWarning}
            </Alert>
          )}

          {itemDetails && (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.75, sm: 2.25 },
                borderRadius: 2,
                borderColor: alpha(theme.palette.divider, 0.4),
                backgroundColor: alpha(theme.palette.background.default, 0.7),
                backdropFilter: 'blur(8px)',
                mt: itemDetails.additionalWarning ? 0 : { xs: 1.5, sm: 2 },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: alpha(severityColor, 0.3),
                  backgroundColor: alpha(theme.palette.background.default, 0.9)
                }
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                mb={itemDetails.metadata?.length ? 2 : 0}
              >
                {itemDetails.image && (
                  <Avatar
                    src={itemDetails.image}
                    variant="rounded"
                    sx={{
                      width: { xs: 38, sm: 46 },
                      height: { xs: 38, sm: 46 },
                      mr: 2,
                      borderRadius: 1.5
                    }}
                  />
                )}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  {itemDetails.title && (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color:
                            severity === 'error'
                              ? theme.palette.error.dark
                              : theme.palette.text.primary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          fontSize: { xs: '0.9375rem', sm: '1rem' }
                        }}
                      >
                        {itemDetails.fullTitle || itemDetails.title}
                      </Typography>
                    </Box>
                  )}
                  {itemDetails.subtitle && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                        mt: 0.25
                      }}
                    >
                      {itemDetails.subtitle}
                    </Typography>
                  )}
                </Box>
              </Box>

              {itemDetails.metadata && itemDetails.metadata.length > 0 && (
                <Stack
                  spacing={0.5}
                  divider={
                    <Divider
                      sx={{
                        borderColor: alpha(theme.palette.divider, 0.3),
                        my: 0.75
                      }}
                    />
                  }
                  sx={{ mt: 1.5 }}
                >
                  {itemDetails.codeCount !== undefined && (
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                      >
                        Codes:
                      </Typography>
                      <Chip
                        size="small"
                        label={`${itemDetails.codeCount} ${
                          itemDetails.codeCount === 1 ? 'code' : 'codes'
                        }`}
                        color={severity === 'error' ? 'error' : 'primary'}
                        variant="outlined"
                        icon={<CodeTwoToneIcon />}
                        sx={{
                          height: { xs: 22, sm: 24 },
                          '& .MuiChip-label': {
                            px: 1,
                            fontSize: { xs: '0.6875rem', sm: '0.75rem' }
                          },
                          '& .MuiChip-icon': {
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }
                        }}
                      />
                    </Box>
                  )}

                  {itemDetails.metadata.map((item, index) => (
                    <Box
                      key={index}
                      display="flex"
                      justifyContent="space-between"
                      sx={{ py: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: contentPadding.xs, sm: contentPadding.sm },
            pb: { xs: contentPadding.xs, sm: contentPadding.sm },
            pt: { xs: 1.5, sm: 2 },
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.default, 0.6),
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          {severity === 'error' && (
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.error.main,
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  letterSpacing: '0.05em'
                }}
              >
                <WarningTwoToneIcon
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                />
                THIS ACTION CANNOT BE UNDONE
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 1.5, sm: 2 },
              width: '100%',
              flexDirection: isMobile ? 'column-reverse' : 'row'
            }}
          >
            <Button
              onClick={onCancel}
              color="inherit"
              variant="outlined"
              disabled={isLoading}
              fullWidth={isMobile}
              sx={{
                borderRadius: '10px',
                px: { xs: 2, sm: 4 },
                py: { xs: 0.75, sm: 1 },
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.grey[800], 0.5)
                    : '#ffffff',
                color: theme.palette.text.primary,
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? 'none'
                    : '0 1px 3px rgba(0,0,0,0.08)',
                '&:hover': {
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.grey[800], 0.8)
                      : '#f5f5f5',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.12)'
                },
                minWidth: isMobile ? '100%' : '120px',
                border: `1px solid ${
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.grey[700], 0.8)
                    : '#c0c0c0'
                }`,
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' }
              }}
            >
              {cancelButtonText}
            </Button>
            <Button
              onClick={onConfirm}
              color={severity === 'error' ? 'error' : 'primary'}
              variant="contained"
              disabled={isLoading}
              fullWidth={isMobile}
              startIcon={
                isLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : null
              }
              sx={{
                borderRadius: '10px',
                px: { xs: 2, sm: 4 },
                py: { xs: 0.75, sm: 1 },
                bgcolor:
                  severity === 'error'
                    ? theme.palette.error.main
                    : theme.palette.primary.main,
                '&:hover': {
                  bgcolor:
                    severity === 'error'
                      ? theme.palette.error.dark
                      : theme.palette.primary.dark,
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s'
                },
                fontWeight: 600,
                minWidth: isMobile ? '100%' : '120px',
                boxShadow:
                  severity === 'error'
                    ? `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
                    : `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                fontSize: { xs: '0.8125rem', sm: '0.875rem' }
              }}
            >
              {confirmButtonText}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConfirmationDialog;
