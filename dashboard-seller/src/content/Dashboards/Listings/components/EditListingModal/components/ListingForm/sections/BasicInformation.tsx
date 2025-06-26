import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
  Typography,
  Switch,
  FormControlLabel
} from '@mui/material';
import { FormData, FormErrors } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer } from '../components/StyledComponents';
import LockIcon from '@mui/icons-material/Lock';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Define a custom type for the multi-field update
type MultiFieldUpdate = {
  fields: Record<string, any>;
};

interface BasicInformationProps {
  formData: FormData;
  formErrors: FormErrors;
  handleTextChange: (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | MultiFieldUpdate
  ) => void;
  handleSelectChange: (e: SelectChangeEvent<string>) => void;
  availablePlatforms?: string[];
}

const BasicInformation: React.FC<BasicInformationProps> = ({
  formData,
  formErrors,
  handleTextChange,
  handleSelectChange,
  availablePlatforms = []
}) => {
  // Handle region locked toggle
  const handleRegionLockedChange = () => {
    // Get the new state (opposite of current state)
    const newIsLocked = !formData.isRegionLocked;

    // Prepare the fields to update
    const fieldsToUpdate: Record<string, any> = {
      isRegionLocked: newIsLocked
    };

    // Update region value based on the new isRegionLocked state
    if (newIsLocked && (formData.region === 'Global' || formData.region === '')) {
      // If enabling region lock and region is Global, clear the region
      fieldsToUpdate.region = '';
    } else if (!newIsLocked) {
      // If disabling region lock, set region to Global
      fieldsToUpdate.region = 'Global';
    }

    // Update all changed fields at once to ensure UI updates in a single render
    handleTextChange({ fields: fieldsToUpdate });
  };

  return (
    <SectionContainer>
      <SectionHeader icon="description" title="Basic Information" />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleTextChange}
            error={!!formErrors.title}
            helperText={formErrors.title || 'Enter a descriptive title for your listing (max 50 characters)'}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            required
            inputProps={{ maxLength: 50 }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!formErrors.region}>
            <InputLabel id="region-label">Region *</InputLabel>
            <Select
              labelId="region-label"
              id="region"
              name="region"
              value={formData.region}
              onChange={handleSelectChange}
              label="Region"
            >

              {['Global', 'North America', 'Europe', 'Asia', 'Oceania', 'South America', 'Africa'].map((region) => (
                <MenuItem
                  key={region}
                  value={region}
                  disabled={(region === 'Global' && formData.isRegionLocked) ||
                           (region !== 'Global' && !formData.isRegionLocked)}
                >
                  {region}
                </MenuItem>
              ))}
            </Select>
            {formErrors.region && <FormHelperText>{formErrors.region}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isRegionLocked || false}
                onChange={handleRegionLockedChange}
                name="isRegionLocked"
                color="primary"
              />
            }
            label="Region locked"
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Enable if this code is restricted to the selected region
          </Typography>
        </Grid>
      </Grid>
    </SectionContainer>
  );
};

export default BasicInformation;
