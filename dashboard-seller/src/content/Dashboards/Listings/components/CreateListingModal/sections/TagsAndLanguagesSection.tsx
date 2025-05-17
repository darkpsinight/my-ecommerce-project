import React from 'react';
import {
  Grid,
  Autocomplete,
  TextField,
  Chip,
  CardContent,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LanguageIcon from '@mui/icons-material/Language';
import { availableTags, availableLanguages } from '../../../components/EditListingModal/components/ListingForm/utils/constants';
import SectionCard from '../components/SectionCard';
import SectionTitle from '../components/SectionTitle';

interface TagsAndLanguagesSectionProps {
  formData: {
    tags: string[];
    supportedLanguages: string[];
  };
  handleTagsChange: (event: any, newValue: string[]) => void;
  handleLanguagesChange: (event: any, newValue: string[]) => void;
}

/**
 * Tags & Languages section for the Create New Listing modal
 * Matches the implementation in the Edit Listing modal
 */
const TagsAndLanguagesSection: React.FC<TagsAndLanguagesSectionProps> = ({
  formData,
  handleTagsChange,
  handleLanguagesChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            Tags & Languages
          </Box>
        </SectionTitle>

        <Grid container spacing={3}>
          {/* Tags - Left side */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              id="tags"
              options={availableTags}
              value={formData.tags}
              onChange={handleTagsChange}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={`tag-${option}-${index}`}
                    icon={<LocalOfferIcon />}
                    variant="outlined"
                    label={option}
                    size={isMobile ? "small" : "medium"}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Tags"
                  placeholder="Add tags"
                  helperText="Select from existing tags or type your own custom tags"
                  size={isMobile ? "small" : "medium"}
                />
              )}
            />
          </Grid>

          {/* Supported Languages - Right side */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              id="languages"
              options={availableLanguages}
              value={formData.supportedLanguages}
              onChange={handleLanguagesChange}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={`language-${option}-${index}`}
                    icon={<LanguageIcon />}
                    variant="outlined"
                    label={option}
                    size={isMobile ? "small" : "medium"}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Supported Languages"
                  placeholder="Add languages"
                  helperText="Select from existing languages or type your own custom languages"
                  size={isMobile ? "small" : "medium"}
                />
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </SectionCard>
  );
};

export default TagsAndLanguagesSection;
