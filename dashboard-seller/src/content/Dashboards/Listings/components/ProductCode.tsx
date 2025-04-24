import { FC, useEffect, useState } from 'react';
import { 
  Grid, 
  TextField, 
  Typography, 
  Tooltip, 
  IconButton, 
  FormHelperText,
  Autocomplete,
  Chip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { FormSection } from './FormSection';

interface Pattern {
  regex: string;
  description: string;
  example: string;
  isActive?: boolean;
}

interface ProductCodeProps {
  formData: {
    code: string;
    expirationDate: string;
    sellerNotes: string;
    tags: string[];
  };
  formErrors: {
    code?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedPattern: Pattern | null;
  validationError: string | null;
}

/**
 * Component for the Product Code section of the listing creation form
 */
export const ProductCode: FC<ProductCodeProps> = ({
  formData,
  formErrors,
  handleChange,
  selectedPattern,
  validationError
}) => {
  const [isValid, setIsValid] = useState<boolean>(true);
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');

  // Handle code input with auto-formatting based on selected pattern
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let formattedValue = value.replace(/-/g, ''); // Remove existing dashes
    let finalValue = formattedValue;

    // Apply formatting based on the selected pattern
    if (selectedPattern && selectedPattern.example) {
      try {
        const example = selectedPattern.example;

        if (example.includes('-')) {
          // Get dash positions from the example
          const dashPositions: number[] = [];
          let exampleWithoutDashes = '';

          for (let i = 0; i < example.length; i++) {
            if (example[i] === '-') {
              // Store the position in the string without dashes
              dashPositions.push(exampleWithoutDashes.length);
            } else {
              exampleWithoutDashes += example[i];
            }
          }

          // Apply dashes at the correct positions
          finalValue = '';
          let dashesAdded = 0;

          for (let i = 0; i < formattedValue.length; i++) {
            // Check if we need to add a dash before this character
            if (dashPositions.includes(i)) {
              finalValue += '-';
              dashesAdded++;
            }

            finalValue += formattedValue[i];
          }
        } else {
          // If no dashes in example, just use the raw value
          finalValue = formattedValue;
        }
      } catch (error) {
        console.error('Error applying code formatting:', error);
        // Fallback to using the raw value without formatting
        finalValue = formattedValue;
      }
    }

    // Create a synthetic event with the formatted value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'code',
        value: finalValue
      }
    };

    handleChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };

  // Handle tags change
  const handleTagsChange = (event, newValue) => {
    const syntheticEvent = {
      target: {
        name: 'tags',
        value: newValue
      }
    };

    handleChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };

  // Validate code against regex pattern in real-time
  useEffect(() => {
    if (selectedPattern && formData.code) {
      try {
        const regex = new RegExp(selectedPattern.regex);
        const valid = regex.test(formData.code);
        setIsValid(valid);

        if (!valid) {
          setLocalValidationError(`Code doesn't match the required format: ${selectedPattern.description || selectedPattern.regex}`);
        } else {
          setLocalValidationError(null);
        }
      } catch (error) {
        console.error('Invalid regex pattern:', error);
        setIsValid(true); // Default to valid if regex is invalid
        setLocalValidationError(null);
      }
    } else {
      setIsValid(true); // No pattern or empty code, consider valid
      setLocalValidationError(null);
    }
  }, [formData.code, selectedPattern]);

  return (
    <FormSection 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Product Code
          <Tooltip 
            title="This code will be encrypted and securely stored. It will only be revealed to buyers after purchase." 
            arrow
          >
            <IconButton size="small" sx={{ p: 0 }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      } 
      marginTop={2}
    >
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Product Code"
          name="code"
          value={formData.code}
          onChange={handleCodeChange}
          placeholder={selectedPattern?.example || "Enter the exact code that buyers will receive"}
          error={Boolean(formErrors.code) || Boolean(validationError) || Boolean(localValidationError) || (formData.code ? !isValid : false)}
          helperText={
            formErrors.code || validationError || localValidationError || 
            (selectedPattern ? `Format: ${selectedPattern.description || selectedPattern.regex}` : undefined)
          }
          required
        />
        {selectedPattern && (
          <FormHelperText sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="primary">
              Example: {selectedPattern.example}
            </Typography>
          </FormHelperText>
        )}
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Expiration Date (Optional)"
          name="expirationDate"
          type="date"
          value={formData.expirationDate}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={formData.tags}
          onChange={handleTagsChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip 
                key={`tag-${option}-${index}`}
                variant="outlined" 
                label={option} 
                size="small"
                {...getTagProps({ index })} 
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              label="Tags (Optional)"
              placeholder="Add tags and press Enter"
              helperText="Add keywords to help buyers find your listing"
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Seller Notes (Private)"
          name="sellerNotes"
          value={formData.sellerNotes}
          onChange={handleChange}
          multiline
          rows={2}
          placeholder="Private notes (not visible to buyers)"
        />
      </Grid>
    </FormSection>
  );
};