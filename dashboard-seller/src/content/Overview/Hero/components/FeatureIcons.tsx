import React from 'react';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export const FeatureIcons = {
  marketplace: <StorefrontIcon />,
  security: <SecurityIcon />,
  analytics: <AnalyticsIcon />,
  support: <SupportAgentIcon />
} as const; 