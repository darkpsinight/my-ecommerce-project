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
}

const TagsAndLanguages: React.FC<TagsAndLanguagesProps> = ({
  formData,
  setFormData
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
              setFormData(prev => ({ ...prev, tags: newValue }));
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
              setFormData(prev => ({ ...prev, supportedLanguages: newValue }));
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
