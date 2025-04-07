import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import { fetchConfigData } from 'src/redux/slices/configSlice';

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

export const useConfigFetcher = () => {
  const dispatch = useAppDispatch();
  const { lastFetchTimestamp, status } = useAppSelector((state) => state.config);

  useEffect(() => {
    const shouldFetch = () => {
      if (status === 'loading') return false;
      if (!lastFetchTimestamp) return true;
      return Date.now() - lastFetchTimestamp > ONE_HOUR;
    };

    if (shouldFetch()) {
      dispatch(fetchConfigData());
    }
  }, [dispatch, lastFetchTimestamp, status]);
}; 