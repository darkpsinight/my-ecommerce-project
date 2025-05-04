import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import { FormData, FormErrors } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer } from '../components/StyledComponents';

interface BasicInformationProps {
  formData: FormData;
  formErrors: FormErrors;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  handleSelectChange: (e: SelectChangeEvent<string>) => void;
}

const BasicInformation: React.FC<BasicInformationProps> = ({
  formData,
  formErrors,
  handleTextChange,
  handleSelectChange
}) => {
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
            helperText={formErrors.title || 'Enter a descriptive title for your listing'}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!formErrors.platform}>
            <InputLabel id="platform-label">Platform</InputLabel>
            <Select
              labelId="platform-label"
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleSelectChange}
              label="Platform"
            >
              <MenuItem value="">
                <em>Select platform</em>
              </MenuItem>
              {['Steam', 'Epic Games', 'Origin', 'Uplay', 'GOG', 'Battle.net', 'Xbox', 'PlayStation', 'Nintendo Switch', 'Mobile', 'Other'].map((platform) => (
                <MenuItem key={platform} value={platform}>
                  {platform}
                </MenuItem>
              ))}
            </Select>
            {formErrors.platform && <FormHelperText>{formErrors.platform}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!formErrors.region}>
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              labelId="region-label"
              id="region"
              name="region"
              value={formData.region}
              onChange={handleSelectChange}
              label="Region"
            >
              <MenuItem value="">
                <em>Select region</em>
              </MenuItem>
              {['Global', 'North America', 'Europe', 'Asia', 'Oceania', 'South America', 'Africa'].map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
            {formErrors.region && <FormHelperText>{formErrors.region}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>
    </SectionContainer>
  );
};

export default BasicInformation;
