import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSellerListings } from 'src/services/api/listings';
import { Listing, ListingsResponse } from '../types';

interface ListingsContextProps {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  totalListings: number;
  page: number;
  limit: number;
  newListingId: string | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  fetchListings: (pageOverride?: number, limitOverride?: number) => Promise<void>;
  refreshListings: () => Promise<void>;
  addNewListing: (listing: Listing) => void;
  clearNewListingHighlight: () => void;
}

interface ListingsProviderProps {
  children: ReactNode;
  initialPage?: number;
  initialLimit?: number;
}

export const ListingsContext = createContext<ListingsContextProps>({
  listings: [],
  loading: false,
  error: null,
  totalListings: 0,
  page: 0,
  limit: 5,
  newListingId: null,
  setPage: () => {},
  setLimit: () => {},
  fetchListings: async () => {},
  refreshListings: async () => {},
  addNewListing: () => {},
  clearNewListingHighlight: () => {}
});

export const ListingsProvider: React.FC<ListingsProviderProps> = ({
  children,
  initialPage = 0,
  initialLimit = 5
}) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalListings, setTotalListings] = useState<number>(0);
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [newListingId, setNewListingId] = useState<string | null>(null);

  const fetchListings = useCallback(
    async (pageOverride?: number, limitOverride?: number) => {
      try {
        setLoading(true);
        setError(null);

        const currentPage = typeof pageOverride === 'number' ? pageOverride : page;
        const currentLimit = typeof limitOverride === 'number' ? limitOverride : limit;

        const response: ListingsResponse = await getSellerListings({
          page: currentPage,
          limit: currentLimit
        });

        if (response && response.success && response.data) {
          setListings(response.data.listings || []);
          if (
            response.data.pagination &&
            typeof response.data.pagination.total === 'number'
          ) {
            setTotalListings(response.data.pagination.total);
          } else {
            setTotalListings((response.data.listings || []).length);
          }
        } else {
          setError(response.message || 'Failed to fetch listings');
          setListings([]);
          setTotalListings(0);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        setError('An error occurred while fetching listings. Please try again.');
        setListings([]);
        setTotalListings(0);
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  const refreshListings = useCallback(() => fetchListings(), [fetchListings]);

  const addNewListing = useCallback((listing: Listing) => {
    // Add the new listing to the beginning of the array
    setListings(prevListings => [listing, ...prevListings]);
    
    // Set the new listing ID to trigger the highlight effect
    setNewListingId(listing._id);
    
    // Increment total listings count
    setTotalListings(prev => prev + 1);
    
    // Clear the highlight after 5 seconds
    setTimeout(() => {
      setNewListingId(null);
    }, 5000);
  }, []);

  const clearNewListingHighlight = useCallback(() => {
    setNewListingId(null);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <ListingsContext.Provider
      value={{
        listings,
        loading,
        error,
        totalListings,
        page,
        limit,
        newListingId,
        setPage,
        setLimit,
        fetchListings,
        refreshListings,
        addNewListing,
        clearNewListingHighlight
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
};
