import React, { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/redux/store";
import { decodeToken, hasRole } from "@/utils/jwt";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

// Import styles
import "./SellerDashboardButton/animations.css";

// Import from modular components
import DashboardIcon from "./SellerDashboardButton/DashboardIcon";
import CloseButton from "./SellerDashboardButton/CloseButton";
import PopoverHeader from "./SellerDashboardButton/PopoverHeader";
import PopoverContent from "./SellerDashboardButton/PopoverContent";
import { getStoredSettings, updateStoredSettings } from "./SellerDashboardButton/utils";
import { SellerDashboardButtonProps } from "./SellerDashboardButton/types";

// Main component
const SellerDashboardButton: React.FC<SellerDashboardButtonProps> = ({
  handleDashboardClick,
}) => {
  const { token } = useAppSelector((state) => state.authReducer);
  const decodedToken = token ? decodeToken(token) : null;
  const isAuthenticated = !!token;
  const isSeller = hasRole(decodedToken, "seller");
  const [isFlashing, setIsFlashing] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // For debugging - force show popover
  useEffect(() => {
    console.log("Popover state:", showPopover);
  }, [showPopover]);

  useEffect(() => {
    if (isSeller) {
      const settings = getStoredSettings();
      // Changed from 7 days to 1 day
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const shouldShowPopover =
        !settings.popoverDismissed ||
        Date.now() - settings.dismissedAt > oneDayInMs;

      setShowPopover(shouldShowPopover);
    }
  }, [isSeller]);

  useEffect(() => {
    if (isSeller && !isHovered) {
      const flashInterval = setInterval(() => {
        setIsFlashing(true);
        setIsFading(false);

        setTimeout(() => {
          setIsFlashing(false);
          setIsFading(true);

          setTimeout(() => {
            setIsFading(false);
          }, 1000);
        }, 1500);
      }, 7000);

      return () => {
        clearInterval(flashInterval);
      };
    }
  }, [isSeller, isHovered]);

  // Event handlers
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopover(true);
  };

  const handleDashboardNavigation = async (e?: React.MouseEvent) => {
    setShowPopover(false);
    updateStoredSettings({
      popoverDismissed: true,
      dismissedAt: Date.now(),
      lastInteraction: Date.now(),
    });
    await handleDashboardClick(e);
  };

  const handlePopoverDismiss = () => {
    setShowPopover(false);
    updateStoredSettings({
      popoverDismissed: true,
      dismissedAt: Date.now(),
    });
  };

  // Empty function to prevent closing when clicking outside
  const handlePopoverClose = () => {
    // Do nothing - this prevents the popover from closing when clicking outside
  };

  if (!isAuthenticated || !isSeller) {
    return null;
  }

  return (
    <div className="relative">
      {/* Dashboard Button */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-1.5 mr-1.5 relative rounded-md p-1
          border border-solid transition-colors duration-300
          ${
            isHovered
              ? "hover-animation border-blue-600"
              : isFlashing
              ? "flash-animation border-blue-600"
              : isFading
              ? "fade-out-animation border-transparent"
              : "border-transparent"
          }`}
      >
        <DashboardIcon />
        <div className="hidden xsm:block">
          <span
            className={`block text-2xs uppercase transition-colors duration-300
            ${
              isHovered || isFlashing
                ? "text-blue-600 font-bold"
                : "text-dark-4"
            }`}
          >
            Access
          </span>
          <p
            className={`font-medium text-xs transition-colors duration-300
            ${isHovered || isFlashing ? "text-blue-600" : "text-dark"}`}
          >
            Dashboard
          </p>
        </div>
      </button>

      {/* Popover */}
      <Popover
        open={showPopover}
        anchorEl={buttonRef.current}
        onClose={handlePopoverClose}
        disableRestoreFocus
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        sx={{
          mt: 2,
          zIndex: 9999
        }}
        slotProps={{
          paper: {
            sx: {
              zIndex: 9999,
              overflow: 'visible',
              mt: 1.5,
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)'
            }
          }
        }}
      >
        <Box sx={{ position: 'relative' }} ref={popoverRef}>
          {/* Arrow */}
          <Box
            sx={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: '10px solid #3C50E0',
              zIndex: 1,
              filter: 'drop-shadow(0px -2px 2px rgba(0,0,0,0.05))',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 1,
                left: -10,
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '10px solid #4C6FFF',
                zIndex: 0,
                opacity: 0.8
              }
            }}
          />

          {/* Popover Content */}
          <Paper
            sx={{
              p: 0,
              borderRadius: "16px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              position: "relative",
              width: 320,
              overflow: 'hidden',
            }}
          >
            <PopoverHeader />
            <CloseButton onClick={handlePopoverDismiss} />
            <PopoverContent
              onDismiss={handlePopoverDismiss}
              onNavigate={handleDashboardNavigation}
            />
          </Paper>
        </Box>
      </Popover>

    </div>
  );
};

export default SellerDashboardButton;