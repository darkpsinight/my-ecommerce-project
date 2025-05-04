import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CodeIcon from '@mui/icons-material/Code';
import NotesIcon from '@mui/icons-material/Notes';
import { SectionHeaderProps } from '../utils/types';

// Map of icon names to components
const iconMap = {
  description: DescriptionIcon,
  info: InfoOutlinedIcon,
  money: AttachMoneyIcon,
  tag: LocalOfferIcon,
  code: CodeIcon,
  notes: NotesIcon
};

/**
 * Custom section header with icon
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title }) => {
  const theme = useTheme();
  
  // Determine which icon to use
  let IconComponent;
  if (React.isValidElement(icon)) {
    IconComponent = () => icon;
  } else if (typeof icon === 'string' && icon in iconMap) {
    const Icon = iconMap[icon as keyof typeof iconMap];
    IconComponent = Icon;
  } else {
    IconComponent = DescriptionIcon; // Default icon
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <IconComponent 
        sx={{ 
          color: theme.palette.primary.main, 
          mr: 1.5, 
          fontSize: '1.75rem' 
        }} 
      />
      <Typography variant="h5" component="h2" fontWeight="500">
        {title}
      </Typography>
    </Box>
  );
};

export default SectionHeader;
