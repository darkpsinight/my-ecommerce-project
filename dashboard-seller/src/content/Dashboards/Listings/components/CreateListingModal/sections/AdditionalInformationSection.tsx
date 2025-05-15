import React from 'react';
import {
  Box,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormHelperText,
  Autocomplete,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';

import LanguageIcon from '@mui/icons-material/Language';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NotesIcon from '@mui/icons-material/Notes';
import SectionCard from '../../CreateListingModal/components/SectionCard';
import SectionTitle from '../../CreateListingModal/components/SectionTitle';

interface AdditionalInformationSectionProps {
  formData: {
    supportedLanguages: string[];
    tags: string[];
    sellerNotes: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagsChange: (event: any, newValue: string[]) => void;
}

/**
 * Additional Information section of the create listing form
 * Contains supported languages, tags, and seller notes
 */
const AdditionalInformationSection: React.FC<AdditionalInformationSectionProps> = ({
  formData,
  handleChange,
  handleTagsChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            Additional Information
          </Box>
        </SectionTitle>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Supported Languages
                </Box>
              </InputLabel>
              <Select
                name="supportedLanguages"
                multiple
                value={formData.supportedLanguages}
                onChange={handleChange as any}
                label="Supported Languages"
                renderValue={(selected) => (selected as string[]).join(', ')}
              >
                {['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Other'].map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    <Checkbox checked={formData.supportedLanguages.indexOf(lang) > -1} />
                    <Typography>{lang}</Typography>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Select all languages supported by this product</FormHelperText>
            </FormControl>
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
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocalOfferIcon fontSize="small" sx={{ mr: 0.5 }} />
                      Tags
                    </Box>
                  }
                  placeholder="Add tags and press Enter"
                  helperText="Add keywords to help buyers find your listing"
                  size={isMobile ? "small" : "medium"}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotesIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Seller Notes (Private)
                </Box>
              }
              name="sellerNotes"
              value={formData.sellerNotes}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Private notes (not visible to buyers)"
              helperText="These notes are only visible to you"
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
        </Grid>
      </CardContent>
    </SectionCard>
  );
};

export default AdditionalInformationSection;
