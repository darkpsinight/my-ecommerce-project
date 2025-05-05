import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSellerListings } from 'src/services/api/listings';
import { Listing, ListingsResponse } from '../types';

interface FilterParams {
  status?: string;
  platform?: string;
  category?: string;
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
}

interface ListingsContextProps {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  totalListings: number;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: FilterParams;
  newListingId: string | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSorting: (field: string) => void;
  setFilters: (filters: Partial<FilterParams>) => void;
  fetchListings: (pageOverride?: number, limitOverride?: number, filterOverride?: Partial<FilterParams>) => Promise<void>;
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
  sortBy: 'createdAt',
  sortOrder: 'desc',
  filters: {},
  newListingId: null,
  setPage: () => {},
  setLimit: () => {},
  setSorting: () => {},
  setFilters: () => {},
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
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFiltersState] = useState<FilterParams>({});
  const [newListingId, setNewListingId] = useState<string | null>(null);

  // Function to handle sorting changes
  const setSorting = useCallback((field: string) => {
    setSortBy(prevSortBy => {
      // If clicking the same field, toggle sort order
      if (prevSortBy === field) {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
      } else {
        // If clicking a new field, set it as the sort field and default to desc order
        setSortOrder('desc');
      }
      return field;
    });
  }, []);

  // Function to update filters
  const setFilters = useCallback((newFilters: Partial<FilterParams>) => {
    // Create a clean filter object with only defined values
    const cleanFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
      // Only include properties that have defined values
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<FilterParams>);

    // Completely replace the filters state
    setFiltersState(cleanFilters);
  }, []);

  const fetchListings = useCallback(
    async (pageOverride?: number, limitOverride?: number, filterOverride?: Partial<FilterParams>) => {
      try {
        setLoading(true);
        setError(null);

        const currentPage = typeof pageOverride === 'number' ? pageOverride : page;
        const currentLimit = typeof limitOverride === 'number' ? limitOverride : limit;
        const currentFilters = filterOverride ? { ...filters, ...filterOverride } : filters;

        console.log('Fetching listings with params:', {
          page: currentPage,
          limit: currentLimit,
          sortBy,
          sortOrder,
          ...currentFilters
        });

        const response: ListingsResponse = await getSellerListings({
          page: currentPage,
          limit: currentLimit,
          sortBy,
          sortOrder,
          ...currentFilters
        });

        console.log('Listings API response:', response);

        if (response && response.success && response.data) {
          console.log('Setting listings state with', response.data.listings?.length || 0, 'items');
          setListings(response.data.listings || []);
          if (
            response.data.pagination &&
            typeof response.data.pagination.total === 'number'
          ) {
            setTotalListings(response.data.pagination.total);
          } else {
            setTotalListings((response.data.listings || []).length);
          }

          // If filter override was provided, update the filters state
          if (filterOverride) {
            setFiltersState(prevFilters => ({
              ...prevFilters,
              ...filterOverride
            }));
          }
        } else {
          console.error('Failed response from listings API:', response);
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
    [page, limit, sortBy, sortOrder, filters]
  );

  const refreshListings = useCallback(async () => {
    console.log('refreshListings called');
    await fetchListings();
  }, [fetchListings]);

  const addNewListing = useCallback(async (response: any) => {
    console.log('addNewListing called with response:', response);

    if (response && response.success && response.data) {
      // Store the new listing ID to highlight it after refresh
      // Backend API returns externalId, not id
      const newId = response.data.externalId;
      console.log('Setting new listing ID for highlighting:', newId);
      setNewListingId(newId);

      // Refresh the listings from the API to get the complete data
      console.log('Refreshing listings after new listing creation');
      await fetchListings(0, limit); // Reset to first page to show the new listing

      // Clear the highlight after 5 seconds
      setTimeout(() => {
        console.log('Clearing new listing highlight');
        setNewListingId(null);
      }, 5000);
    } else {
      console.error('Invalid response format from listing creation:', response);
    }
  }, [fetchListings, limit]);

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
        sortBy,
        sortOrder,
        filters,
        newListingId,
        setPage,
        setLimit,
        setSorting,
        setFilters,
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
