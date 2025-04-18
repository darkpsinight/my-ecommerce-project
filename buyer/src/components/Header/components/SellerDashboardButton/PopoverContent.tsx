import React from 'react';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { PopoverContentProps } from './types';
import FeatureItem from './FeatureItem';

const PopoverContent: React.FC<PopoverContentProps> = ({ onDismiss, onNavigate }) => {
  // Feature items data
  const featureItems = [
    { 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="#3C50E0" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      text: "Manage listings and inventory"
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 8V5C16 3.9 15.1 3 14 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H14C15.1 21 16 20.1 16 19V16M12 12H21M21 12L18 9M21 12L18 15" stroke="#3C50E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      text: "Process orders and shipments"
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 12L9.5 14.5M9.5 14.5L12 17M9.5 14.5L12 12M9.5 14.5L7 17M16 6L18 8L22 4M6 18H12M3 3V21H21" stroke="#3C50E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      text: "Track sales and performance"
    }
  ];

  return (
    <Box sx={{ p: 3, pt: 2.5 }}>
      {/* Title and icon */}
      <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
        <Box 
          sx={{ 
            backgroundColor: 'rgba(60, 80, 224, 0.08)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mr: 2
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill="#3C50E0"
              stroke="#3C50E0"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: "#111827",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Ready to boost your sales?
        </Typography>
      </Box>
      
      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: "#4b5563",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          mb: 3,
        }}
      >
        Your Seller Dashboard is waiting! Access powerful tools to list items, 
        manage orders, and track your business performance.
      </Typography>
      
      {/* Feature highlights */}
      <Box sx={{ mb: 3 }}>
        {featureItems.map((item, index) => (
          <FeatureItem 
            key={index} 
            icon={item.icon} 
            text={item.text} 
          />
        ))}
      </Box>
      
      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={onDismiss}
          sx={{
            color: '#4b5563',
            backgroundColor: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 16px',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#f9fafb',
              borderColor: '#d1d5db',
            }
          }}
        >
          Remind later
        </Button>
        <Button
          onClick={onNavigate}
          sx={{
            backgroundColor: '#3C50E0',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 16px',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#2E3FBA',
            },
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default PopoverContent;
