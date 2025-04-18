import React from 'react';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FeatureItemProps } from './types';

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, text }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
    <Box 
      sx={{ 
        mr: 1.5,
        color: '#3C50E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
    <Typography 
      variant="body2" 
      sx={{ 
        fontSize: '0.825rem',
        color: '#4b5563',
      }}
    >
      {text}
    </Typography>
  </Box>
);

export default FeatureItem;
