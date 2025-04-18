import React from 'react';
import IconButton from "@mui/material/IconButton";

interface CloseButtonProps {
  onClick: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClick }) => (
  <IconButton
    onClick={onClick}
    size="small"
    sx={{
      position: "absolute",
      top: 8,
      right: 8,
      color: "#FFFFFF",
      backgroundColor: "rgba(255,255,255,0.15)",
      width: 28,
      height: 28,
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.25)",
      },
      transition: "all 0.2s ease",
      zIndex: 10,
    }}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </IconButton>
);

export default CloseButton;
