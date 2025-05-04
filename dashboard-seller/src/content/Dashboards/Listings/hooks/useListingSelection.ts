import { useCallback } from 'react';
import { Listing } from '../types';

interface UseListingSelectionProps {
  listings: Listing[];
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

interface UseListingSelectionReturn {
  isSelected: (id: string) => boolean;
  handleSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectClick: (event: React.MouseEvent<unknown>, id: string) => void;
  clearSelection: () => void;
}

export const useListingSelection = ({
  listings,
  selected,
  setSelected
}: UseListingSelectionProps): UseListingSelectionReturn => {
  const isSelected = useCallback(
    (id: string) => selected.indexOf(id) !== -1,
    [selected]
  );

  const handleSelectAllClick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        const newSelecteds = listings.map((listing) => listing.externalId);
        setSelected(newSelecteds);
        return;
      }
      setSelected([]);
    },
    [listings, setSelected]
  );

  const handleSelectClick = useCallback(
    (event: React.MouseEvent<unknown>, id: string) => {
      const selectedIndex = selected.indexOf(id);
      let newSelected: string[] = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1)
        );
      }
      setSelected(newSelected);
    },
    [selected, setSelected]
  );

  const clearSelection = useCallback(() => {
    setSelected([]);
  }, [setSelected]);

  return {
    isSelected,
    handleSelectAllClick,
    handleSelectClick,
    clearSelection
  };
};
