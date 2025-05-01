import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LanguageIcon from '@mui/icons-material/Language';

import { Listing } from '../../../../types';

interface TagsLanguagesTabProps {
  listing: Listing;
}

const TagsLanguagesTab: React.FC<TagsLanguagesTabProps> = ({ listing }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Tags Section */}
      {listing.tags && listing.tags.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              boxShadow: theme.shadows[1]
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LocalOfferIcon
                  sx={{
                    mr: 1,
                    color: theme.palette.secondary.main,
                    fontSize: 20
                  }}
                />
                Tags
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {listing.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="medium"
                    sx={{
                      bgcolor: alpha(
                        theme.palette.secondary.main,
                        0.1
                      ),
                      color: theme.palette.secondary.dark,
                      fontWeight: 500,
                      px: 0.5
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Languages Section */}
      {listing.supportedLanguages &&
        listing.supportedLanguages.length > 0 && (
          <Grid
            item
            xs={12}
            md={listing.tags && listing.tags.length > 0 ? 6 : 12}
          >
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                boxShadow: theme.shadows[1]
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <LanguageIcon
                    sx={{
                      mr: 1,
                      color: theme.palette.info.main,
                      fontSize: 20
                    }}
                  />
                  Supported Languages
                </Typography>

                <Box
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
                >
                  {listing.supportedLanguages.map(
                    (language, index) => (
                      <Chip
                        key={index}
                        label={language}
                        size="medium"
                        sx={{
                          bgcolor: alpha(
                            theme.palette.info.main,
                            0.1
                          ),
                          color: theme.palette.info.dark,
                          fontWeight: 500,
                          px: 0.5
                        }}
                        icon={<LanguageIcon fontSize="small" />}
                      />
                    )
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
    </Grid>
  );
};

export default TagsLanguagesTab;
