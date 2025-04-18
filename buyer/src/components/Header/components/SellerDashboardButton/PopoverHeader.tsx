import React from 'react';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const PopoverHeader: React.FC = () => (
  <Box
    sx={{
      background: 'linear-gradient(135deg, #3C50E0, #4C6FFF)',
      height: '68px',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      px: 2
    }}
  >
    {/* Background elements */}
    <Box sx={{ position: 'absolute', top: 10, left: 10, opacity: 0.2 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 8V5C20 3.9 19.1 3 18 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H9.5" stroke="#FFFFFF" strokeWidth="1" />
        <path d="M17 8L15 10V8H10V14H15V12L17 14V8Z" fill="#FFFFFF" />
        <path d="M22 16.5C22 19.5376 19.5376 22 16.5 22C13.4624 22 11 19.5376 11 16.5C11 13.4624 13.4624 11 16.5 11C19.5376 11 22 13.4624 22 16.5Z" fill="#FFFFFF" />
        <path d="M16.5 13.5V16.5H19.5" stroke="#3C50E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Box>
    
    <Box sx={{ position: 'absolute', bottom: -15, right: -15, opacity: 0.15 }}>
      <svg width="80" height="80" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M3 6C3 4.34315 4.34315 3 6 3H8C9.65685 3 11 4.34315 11 6V8C11 9.65685 9.65685 11 8 11H6C4.34315 11 3 9.65685 3 8V6Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M13 6C13 4.34315 14.3431 3 16 3H18C19.6569 3 21 4.34315 21 6V8C21 9.65685 19.6569 11 18 11H16C14.3431 11 13 9.65685 13 8V6Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M3 16C3 14.3431 4.34315 13 6 13H8C9.65685 13 11 14.3431 11 16V18C11 19.6569 9.65685 21 8 21H6C4.34315 21 3 19.6569 3 18V16Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M13 16C13 14.3431 14.3431 13 16 13H18C19.6569 13 21 14.3431 21 16V18C21 19.6569 19.6569 21 18 21H16C14.3431 21 13 19.6569 13 18V16Z" />
      </svg>
    </Box>
    
    <Typography
      variant="h6"
      sx={{
        color: "#FFFFFF",
        fontWeight: 600,
        fontSize: "1.1rem",
        textAlign: 'center',
        textShadow: '0px 1px 2px rgba(0,0,0,0.1)',
        zIndex: 1
      }}
    >
      Seller Dashboard
    </Typography>
  </Box>
);

export default PopoverHeader;
