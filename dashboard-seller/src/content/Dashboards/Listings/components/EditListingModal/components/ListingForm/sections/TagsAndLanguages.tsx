import React from 'react';
import {
  Grid,
  Autocomplete,
  TextField,
  Chip,
  Typography
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LanguageIcon from '@mui/icons-material/Language';
import { FormData } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer } from '../components/StyledComponents';
import { availableTags, availableLanguages } from '../utils/constants';

interface TagsAndLanguagesProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onFormDataChange?: (formData: FormData) => void;
}

const TagsAndLanguages: React.FC<TagsAndLanguagesProps> = ({
  formData,
  setFormData,
  onFormDataChange
}) => {
  return (
    <SectionContainer>
      <SectionHeader icon="tag" title="Tags & Languages" />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Autocomplete
            multiple
            id="tags"
            options={availableTags}
            value={formData.tags}
            onChange={(_, newValue) => {
              console.log('Tags changed:', { oldValue: formData.tags, newValue });

              // Update the form data
              setFormData(prev => {
                const updated = { ...prev, tags: newValue };
                console.log('Updated form data (tags):', updated);

                // Notify parent component of form data change
                if (onFormDataChange) {
                  console.log('Calling onFormDataChange with updated tags');
                  onFormDataChange(updated);
                }

                return updated;
              });
            }}
            freeSolo
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={`tag-${option}-${index}`}
                  icon={<LocalOfferIcon />}
                  variant="outlined"
                  label={option}
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
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            multiple
            id="languages"
            options={availableLanguages}
            value={formData.supportedLanguages}
            onChange={(_, newValue) => {
              console.log('Supported Languages changed:', { oldValue: formData.supportedLanguages, newValue });

              // Update the form data
              setFormData(prev => {
                const updated = { ...prev, supportedLanguages: newValue };
                console.log('Updated form data (supportedLanguages):', updated);

                // Notify parent component of form data change
                if (onFormDataChange) {
                  console.log('Calling onFormDataChange with updated supportedLanguages');
                  onFormDataChange(updated);
                }

                return updated;
              });
            }}
            freeSolo
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={`language-${option}-${index}`}
                  icon={<LanguageIcon />}
                  variant="outlined"
                  label={option}
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
              />
            )}
          />
        </Grid>
      </Grid>
    </SectionContainer>
  );
};

export default TagsAndLanguages;
