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

  // Check if there are any tags or languages
  const hasTags = listing.tags && listing.tags.length > 0;
  const hasLanguages = listing.supportedLanguages && listing.supportedLanguages.length > 0;
  const hasNoContent = !hasTags && !hasLanguages;

  return (
    <Grid container spacing={3}>
      {/* No content message */}
      {hasNoContent && (
        <Grid item xs={12}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              boxShadow: theme.shadows[1]
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  mb: 1
                }}
              >
                No Tags or Languages
              </Typography>
              <Typography variant="body1" color="textSecondary">
                This listing doesn't have any tags or supported languages yet.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                You can add tags and languages when editing this listing.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Tags Section */}
      {hasTags && (
        <Grid item xs={12} md={hasLanguages ? 6 : 12}>
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
      {hasLanguages && (
          <Grid
            item
            xs={12}
            md={hasTags ? 6 : 12}
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
