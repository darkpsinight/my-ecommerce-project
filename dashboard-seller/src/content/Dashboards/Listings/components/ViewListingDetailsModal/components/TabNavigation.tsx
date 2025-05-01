import React from 'react';
import { Box, Tabs, Tab, Typography, Badge, useTheme } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CodeIcon from '@mui/icons-material/Code';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ImageIcon from '@mui/icons-material/Image';
import { Listing } from '../../../types';

interface TabNavigationProps {
  tabValue: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  listing: Listing;
  activeCodes: number;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabValue,
  handleTabChange,
  listing,
  activeCodes
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="listing details tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            minWidth: 'auto',
            px: 2,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9rem',
            color: theme.palette.text.primary,
            '&.Mui-selected': {
              color: '#ffffff'
            },
            '&:hover': {
              color: '#000000'
            }
          },
          '& .MuiTab-wrapper': {
            flexDirection: 'row',
            justifyContent: 'flex-start'
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3
          }
        }}
        TabIndicatorProps={{ children: <span /> }}
      >
        <Tab
          icon={<InfoOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={
            <Typography
              component="span"
              sx={{ ml: 1, display: 'inline-block', fontWeight: 'bold' }}
            >
              Overview
            </Typography>
          }
          id="listing-tab-0"
          aria-controls="listing-tabpanel-0"
        />
        <Tab
          icon={<CodeIcon fontSize="small" />}
          iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Typography component="span" sx={{ fontWeight: 'bold' }}>Codes</Typography>
              {activeCodes > 0 && (
                <Badge
                  badgeContent={activeCodes}
                  color="success"
                  sx={{ ml: 1 }}
                  max={999}
                >
                  <Box sx={{ width: 8 }} />
                </Badge>
              )}
            </Box>
          }
          id="listing-tab-1"
          aria-controls="listing-tabpanel-1"
          disabled={!listing.codes || listing.codes.length === 0}
        />
        <Tab
          icon={<LocalOfferIcon fontSize="small" />}
          iconPosition="start"
          label={
            <Typography
              component="span"
              sx={{ ml: 1, display: 'inline-block', fontWeight: 'bold' }}
            >
              Tags & Languages
            </Typography>
          }
          id="listing-tab-2"
          aria-controls="listing-tabpanel-2"
          disabled={
            (!listing.tags || listing.tags.length === 0) &&
            (!listing.supportedLanguages ||
              listing.supportedLanguages.length === 0)
          }
        />
        {listing.thumbnailUrl && (
          <Tab
            icon={<ImageIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Typography
                component="span"
                sx={{ ml: 1, display: 'inline-block', fontWeight: 'bold' }}
              >
                Images
              </Typography>
            }
            id="listing-tab-3"
            aria-controls="listing-tabpanel-3"
          />
        )}
      </Tabs>
    </Box>
  );
};

export default TabNavigation;
