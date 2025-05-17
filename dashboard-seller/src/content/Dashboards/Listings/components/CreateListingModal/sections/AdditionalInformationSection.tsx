import React from 'react';
import {
  Box,
  CardContent,
  Grid,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';

import NotesIcon from '@mui/icons-material/Notes';
import SectionCard from '../../CreateListingModal/components/SectionCard';
import SectionTitle from '../../CreateListingModal/components/SectionTitle';

interface AdditionalInformationSectionProps {
  formData: {
    sellerNotes: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Additional Information section of the create listing form
 * Contains seller notes
 */
const AdditionalInformationSection: React.FC<AdditionalInformationSectionProps> = ({
  formData,
  handleChange
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
              rows={3}
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
