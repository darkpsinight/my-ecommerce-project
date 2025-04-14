import React from 'react';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export const FeatureIcons = {
  marketplace: <StorefrontIcon />,
  security: <MoneyOffIcon />,
  analytics: <AnalyticsIcon />,
  support: <SupportAgentIcon />
} as const;