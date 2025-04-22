import { useState, useEffect, useCallback } from 'react';
import { getSellerListings } from 'src/services/api/listings';
import { Listing, ListingsResponse } from '../types';

interface UseListingsProps {
  initialPage?: number;
  initialLimit?: number;
}

interface UseListingsReturn {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  totalListings: number;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  fetchListings: (pageOverride?: number, limitOverride?: number) => Promise<void>;
  refreshListings: () => Promise<void>;
}

export const useListings = ({
  initialPage = 0,
  initialLimit = 5
}: UseListingsProps = {}): UseListingsReturn => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalListings, setTotalListings] = useState<number>(0);
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);

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

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    loading,
    error,
    totalListings,
    page,
    limit,
    setPage,
    setLimit,
    fetchListings,
    refreshListings
  };
};
