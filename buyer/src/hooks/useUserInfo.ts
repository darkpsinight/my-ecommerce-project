import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserInfo, clearUserInfo } from '@/redux/features/user-info-slice';
import { RootState } from '@/redux/store';
import { userApi } from '@/services/user';

// Static flag to track fetching status across all hook instances
let isFetching = false;

export const useUserInfo = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.authReducer);
  const userInfo = useSelector((state: RootState) => state.userInfoReducer.info);

  const fetchUserInfo = async () => {
    if (!token || isFetching) return;

    try {
      isFetching = true;
      const data = await userApi.getUserInfo(token);
      dispatch(setUserInfo(data));
    } catch (error) {
      console.error('Error fetching user info:', error);
      dispatch(clearUserInfo());
    } finally {
      isFetching = false;
    }
  };

  useEffect(() => {
    if (token && !userInfo) {
      fetchUserInfo();
    } else if (!token && userInfo) {
      dispatch(clearUserInfo());
    }
  }, [token]);

  return { userInfo, fetchUserInfo };
}; 