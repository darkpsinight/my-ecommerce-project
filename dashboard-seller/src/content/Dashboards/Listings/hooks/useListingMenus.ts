import { useState, useCallback } from 'react';

interface UseListingMenusReturn {
  // Single listing menu
  anchorEl: HTMLElement | null;
  activeListingId: string | null;
  handleOpenMenu: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  handleCloseMenu: () => void;
  
  // Bulk actions menu
  bulkAnchorEl: HTMLElement | null;
  handleBulkMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleBulkMenuClose: () => void;
}

export const useListingMenus = (): UseListingMenusReturn => {
  // Single listing menu state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  
  // Bulk actions menu state
  const [bulkAnchorEl, setBulkAnchorEl] = useState<HTMLElement | null>(null);

  // Single listing menu handlers
  const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setActiveListingId(id);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
    setActiveListingId(null);
  }, []);

  // Bulk actions menu handlers
  const handleBulkMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setBulkAnchorEl(event.currentTarget);
  }, []);

  const handleBulkMenuClose = useCallback(() => {
    setBulkAnchorEl(null);
  }, []);

  return {
    anchorEl,
    activeListingId,
    handleOpenMenu,
    handleCloseMenu,
    bulkAnchorEl,
    handleBulkMenuOpen,
    handleBulkMenuClose
  };
};
