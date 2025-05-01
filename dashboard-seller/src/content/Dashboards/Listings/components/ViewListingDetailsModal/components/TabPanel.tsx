import React from 'react';
import { Box, Fade } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`listing-tabpanel-${index}`}
      aria-labelledby={`listing-tab-${index}`}
      {...other}
      style={{ padding: '0' }}
    >
      {value === index && (
        <Fade in={value === index} timeout={400}>
          <Box sx={{ pt: { xs: 1.5, sm: 2 }, pb: { xs: 1, sm: 1.5 } }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
};

export default TabPanel;