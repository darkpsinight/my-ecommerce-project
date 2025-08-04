import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Tab, 
  useTheme, 
  useMediaQuery, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Chip,
  Tooltip,
  ButtonBase
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Analytics as AnalyticsIcon,
  TrendingUp,
  Inventory,
  People,
  Public,
  Favorite,
  AttachMoney,
  CheckCircle,
  MoreHoriz
} from '@mui/icons-material';

interface TabItem {
  label: string;
  shortLabel: string;
  mobileLabel: string;
  value: string;
  icon: React.ReactElement;
}

function AnalyticsNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for overflow management
  const [visibleTabs, setVisibleTabs] = useState<TabItem[]>([]);
  const [overflowTabs, setOverflowTabs] = useState<TabItem[]>([]);
  const [dropdownAnchor, setDropdownAnchor] = useState<null | HTMLElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Memoize tabs to prevent recreation on every render
  const tabs = React.useMemo<TabItem[]>(() => [
    { 
      label: 'Overview', 
      shortLabel: 'Overview',
      mobileLabel: 'Over',
      value: '/dashboards/analytics/overview', 
      icon: <AnalyticsIcon /> 
    },
    { 
      label: 'Sales Performance', 
      shortLabel: 'Sales',
      mobileLabel: 'Sales',
      value: '/dashboards/analytics/sales', 
      icon: <TrendingUp /> 
    },
    { 
      label: 'Product Analytics', 
      shortLabel: 'Products',
      mobileLabel: 'Prod',
      value: '/dashboards/analytics/products', 
      icon: <Inventory /> 
    },
    { 
      label: 'Customer Intelligence', 
      shortLabel: 'Customers',
      mobileLabel: 'Cust',
      value: '/dashboards/analytics/customers', 
      icon: <People /> 
    },
    { 
      label: 'Market Insights', 
      shortLabel: 'Market',
      mobileLabel: 'Mkt',
      value: '/dashboards/analytics/market', 
      icon: <Public /> 
    },
    { 
      label: 'Engagement & Growth', 
      shortLabel: 'Engagement',
      mobileLabel: 'Eng',
      value: '/dashboards/analytics/engagement', 
      icon: <Favorite /> 
    },
    { 
      label: 'Customer Acquisition Cost', 
      shortLabel: 'CAC',
      mobileLabel: 'CAC',
      value: '/dashboards/analytics/cac', 
      icon: <AttachMoney /> 
    },
    { 
      label: 'Transaction Success Rate', 
      shortLabel: 'Success Rate',
      mobileLabel: 'TSR',
      value: '/dashboards/analytics/transaction-success-rate', 
      icon: <CheckCircle /> 
    }
  ], []);

  // Helper function to get appropriate tab label based on screen size
  const getTabLabel = useCallback((tab: TabItem) => {
    if (isSmall) return tab.mobileLabel;
    if (isMobile) return tab.shortLabel;
    return tab.label;
  }, [isSmall, isMobile]);

  // Calculate tab dimensions and manage overflow
  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || isSmall) {
      // For small screens, show all tabs in mobile view
      setVisibleTabs(tabs);
      setOverflowTabs([]);
      return;
    }

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    
    if (containerWidth === 0) return; // Container not ready yet

    const dropdownButtonWidth = 48; // Width of the dropdown button
    const padding = 16; // Container padding
    const availableWidth = containerWidth - dropdownButtonWidth - padding;

    let totalWidth = 0;
    let visibleCount = 0;

    // Calculate width for each tab
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabLabel = getTabLabel(tab);
      // More accurate width estimation based on actual content
      const baseWidth = isMobile ? 80 : 120;
      const textWidth = tabLabel.length * (isMobile ? 6 : 7); // Approximate character width
      const iconWidth = isMobile ? 16 : 18;
      const padding = isMobile ? 16 : 24;
      const estimatedWidth = Math.max(baseWidth, textWidth + iconWidth + padding);
      
      if (totalWidth + estimatedWidth <= availableWidth) {
        totalWidth += estimatedWidth;
        visibleCount++;
      } else {
        break;
      }
    }

    // Ensure at least one tab is visible
    visibleCount = Math.max(1, visibleCount);

    // Ensure active tab is always visible
    const activeTabIndex = tabs.findIndex(tab => tab.value === location.pathname);
    if (activeTabIndex >= visibleCount && activeTabIndex !== -1) {
      // If active tab would be hidden, replace the last visible tab with the active tab
      if (visibleCount > 1) {
        const newVisibleTabs = [
          ...tabs.slice(0, visibleCount - 1), 
          tabs[activeTabIndex]
        ];
        const newOverflowTabs = [
          ...tabs.slice(visibleCount - 1, activeTabIndex),
          ...tabs.slice(activeTabIndex + 1)
        ];
        setVisibleTabs(newVisibleTabs);
        setOverflowTabs(newOverflowTabs);
        return;
      }
    }

    setVisibleTabs(tabs.slice(0, visibleCount));
    setOverflowTabs(tabs.slice(visibleCount));
  }, [location.pathname, isMobile, isSmall, getTabLabel]);

  // Handle tab navigation
  const handleTabClick = (value: string) => {
    navigate(value);
    setDropdownAnchor(null);
  };

  // Handle dropdown
  const handleDropdownClick = (event: React.MouseEvent<HTMLElement>) => {
    setDropdownAnchor(event.currentTarget);
  };

  const handleDropdownKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setDropdownAnchor(event.currentTarget);
    }
  };

  const handleDropdownClose = () => {
    setDropdownAnchor(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, value: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(value);
    }
  };

  // Debounced resize handler for better performance
  const debouncedCalculateOverflow = useCallback(() => {
    const timeoutId = setTimeout(() => {
      calculateOverflow();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [calculateOverflow]);

  // Setup resize observer
  useEffect(() => {
    if (!containerRef.current || isSmall) return;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [isSmall]);

  // Recalculate overflow when container width or tabs change (debounced)
  useEffect(() => {
    const cleanup = debouncedCalculateOverflow();
    return cleanup;
  }, [debouncedCalculateOverflow, containerWidth]);

  // Initial calculation and fallback
  useEffect(() => {
    if (isSmall) {
      // For small screens, always show all tabs
      setVisibleTabs(tabs);
      setOverflowTabs([]);
    } else {
      // For larger screens, calculate overflow
      calculateOverflow();
    }
  }, [calculateOverflow, isSmall, tabs]);

  // Fallback: if no visible tabs, show all tabs
  useEffect(() => {
    if (visibleTabs.length === 0 && tabs.length > 0) {
      setVisibleTabs(tabs);
      setOverflowTabs([]);
    }
  }, [visibleTabs.length, tabs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownAnchor && !dropdownAnchor.contains(event.target as Node)) {
        setDropdownAnchor(null);
      }
    };

    if (dropdownAnchor) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownAnchor]);

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      {isSmall ? (
        // Ultra-compact horizontal scroll for mobile
        <Box
          sx={{
            display: 'flex',
            overflowX: 'auto',
            gap: 0.5,
            pb: 1,
            px: 1,
            '&::-webkit-scrollbar': { 
              height: 4,
              backgroundColor: 'rgba(0,0,0,0.1)'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 2
            }
          }}
        >
          {tabs.map((tab) => (
            <Box
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              onKeyDown={(e) => handleKeyDown(e, tab.value)}
              tabIndex={0}
              role="button"
              aria-label={`Navigate to ${tab.label}`}
              sx={{
                minWidth: 50,
                height: 44,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                cursor: 'pointer',
                backgroundColor: location.pathname === tab.value ? 'primary.main' : 'transparent',
                color: location.pathname === tab.value ? 'primary.contrastText' : 'text.secondary',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: location.pathname === tab.value ? 'primary.dark' : 'action.hover'
                },
                '&:focus': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '16px',
                  mb: 0.5
                },
                fontSize: '10px',
                fontWeight: location.pathname === tab.value ? 600 : 400,
                px: 0.5
              }}
            >
              {tab.icon}
              {tab.mobileLabel}
            </Box>
          ))}
        </Box>
      ) : (
        // Desktop/Tablet overflow-aware tabs
        <Box
          ref={containerRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            minHeight: 48,
            position: 'relative'
          }}
        >
          {/* Visible Tabs */}
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              overflow: 'hidden'
            }}
          >
            {visibleTabs.map((tab, index) => {
              const isActive = location.pathname === tab.value;
              return (
                <ButtonBase
                  key={tab.value}
                  onClick={() => handleTabClick(tab.value)}
                  onKeyDown={(e) => handleKeyDown(e, tab.value)}
                  sx={{
                    minWidth: isMobile ? 80 : 120,
                    maxWidth: isMobile ? 120 : 180,
                    height: 48,
                    padding: isMobile ? '6px 8px' : '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    borderRadius: 0,
                    borderBottom: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                    backgroundColor: 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: isActive ? 'primary.main' : 'text.primary'
                    },
                    '&:focus': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: -2
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: isMobile ? '16px' : '18px'
                    }
                  }}
                >
                  {tab.icon}
                  {getTabLabel(tab)}
                </ButtonBase>
              );
            })}
          </Box>

          {/* Overflow Dropdown */}
          {overflowTabs.length > 0 && (
            <>
              <Tooltip title={`${overflowTabs.length} more tabs`}>
                <IconButton
                  onClick={handleDropdownClick}
                  onKeyDown={handleDropdownKeyDown}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 0,
                    borderBottom: overflowTabs.some(tab => tab.value === location.pathname) 
                      ? `3px solid ${theme.palette.primary.main}` 
                      : '3px solid transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    },
                    '&:focus': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: -2
                    }
                  }}
                  aria-label="More tabs"
                  aria-expanded={Boolean(dropdownAnchor)}
                  aria-haspopup="true"
                >
                  <MoreHoriz />
                  {overflowTabs.some(tab => tab.value === location.pathname) && (
                    <Chip
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 8,
                        height: 8,
                        minWidth: 8,
                        backgroundColor: 'primary.main',
                        '& .MuiChip-label': {
                          display: 'none'
                        }
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={dropdownAnchor}
                open={Boolean(dropdownAnchor)}
                onClose={handleDropdownClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    maxHeight: 300,
                    overflow: 'auto',
                    boxShadow: theme.shadows[8]
                  }
                }}
                MenuListProps={{
                  'aria-labelledby': 'overflow-tabs-button',
                  role: 'menu'
                }}
              >
                {overflowTabs.map((tab) => {
                  const isActive = location.pathname === tab.value;
                  return (
                    <MenuItem
                      key={tab.value}
                      onClick={() => handleTabClick(tab.value)}
                      selected={isActive}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark'
                          }
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? 'inherit' : 'text.secondary',
                          minWidth: 36
                        }}
                      >
                        {tab.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={tab.label}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 400
                          }
                        }}
                      />
                    </MenuItem>
                  );
                })}
              </Menu>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

export default AnalyticsNavigation;