import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import { fetchConfigData } from 'src/redux/slices/configSlice';

/**
 * Custom hook to access application configuration data
 * @returns Object containing config data, loading status, and error information
 */
export const useAppConfig = () => {
  const dispatch = useAppDispatch();
  const { data, status, error } = useAppSelector((state) => state.config);
  
  useEffect(() => {
    // Only fetch if we haven't already loaded or are not in the process of loading
    if (status === 'idle') {
      dispatch(fetchConfigData());
    }
  }, [dispatch, status]);

  return {
    configs: data,
    isLoading: status === 'loading',
    error,
    isError: status === 'failed',
    isSuccess: status === 'succeeded'
  };
};

export default useAppConfig; 