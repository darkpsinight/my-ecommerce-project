import React from 'react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Define the error object interface
export interface ValidationError {
  type: string;
  code: string;
  details: string;
  suggestion: string;
  [key: string]: any; // For additional properties
}

// Define the context object interface
export interface ValidationContext {
  platform?: string;
  category?: string;
  patterns?: Array<{
    description?: string;
    example?: string;
  }>;
  [key: string]: any; // For additional properties
}

// Define the props interface
interface ValidationErrorDisplayProps {
  message: string;
  errors: ValidationError[];
  context?: ValidationContext;
}

/**
 * Component to display validation errors in a standardized way
 */
const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  message,
  errors,
  context
}) => {
  // Group errors by type
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  // Get error types
  const errorTypes = Object.keys(errorsByType);

  // Helper function to get icon based on error type
  const getIconForErrorType = (type: string) => {
    switch (type) {
      case 'duplicate':
        return <ErrorOutlineIcon color="error" />;
      case 'invalid_pattern':
        return <WarningAmberIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Helper function to get human-readable error type
  const getReadableErrorType = (type: string) => {
    switch (type) {
      case 'duplicate':
        return 'Duplicate Codes';
      case 'invalid_pattern':
        return 'Invalid Code Format';
      default:
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      <AlertTitle>Error: {message}</AlertTitle>
      
      {/* Context information if available */}
      {context && (
        <Box sx={{ mb: 2 }}>
          {context.platform && context.category && (
            <Typography variant="body2" color="text.secondary">
              Platform: <Chip size="small" label={context.platform} /> 
              Category: <Chip size="small" label={context.category} />
            </Typography>
          )}
        </Box>
      )}
      
      {/* Error sections by type */}
      {errorTypes.map((errorType) => (
        <Accordion key={errorType} sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 1 }}>{getIconForErrorType(errorType)}</Box>
              <Typography variant="subtitle2">
                {getReadableErrorType(errorType)} ({errorsByType[errorType].length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {errorsByType[errorType].map((error, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getIconForErrorType(errorType)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Chip 
                          label={error.code} 
                          size="small" 
                          color={errorType === 'duplicate' ? 'error' : 'warning'} 
                          sx={{ mr: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary">
                          {error.details}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          <strong>Suggestion:</strong> {error.suggestion}
                        </Typography>
                        
                        {/* Additional error details for pattern validation */}
                        {errorType === 'invalid_pattern' && error.validationErrors && (
                          <Box sx={{ mt: 1, bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                            {error.validationErrors.map((valError: any, i: number) => (
                              <Typography key={i} variant="caption" display="block">
                                {valError.reason}: Expected {valError.expected}, got {valError.actual}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            {/* Pattern examples for invalid_pattern errors */}
            {errorType === 'invalid_pattern' && context?.patterns && context.patterns.length > 0 && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2">Valid Format Examples:</Typography>
                <List dense>
                  {context.patterns.map((pattern, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={pattern.description}
                        secondary={pattern.example ? `Example: ${pattern.example}` : ''}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Alert>
  );
};

export default ValidationErrorDisplay;
