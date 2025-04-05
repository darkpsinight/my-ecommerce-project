import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserInfo, clearUserInfo } from '@/redux/features/user-info-slice';
import { RootState } from '@/redux/store';
import { decodeToken } from '@/utils/jwt';

export const useUserInfo = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.authReducer);
  const userInfo = useSelector((state: RootState) => state.userInfoReducer.info);

  useEffect(() => {
    if (token && !userInfo) {
      const decodedToken = decodeToken(token);
      if (decodedToken) {
        dispatch(setUserInfo({
          email: decodedToken.email,
          name: decodedToken.name,
          role: decodedToken.role,
          isEmailConfirmed: decodedToken.isEmailConfirmed
        }));
      }
    } else if (!token && userInfo) {
      dispatch(clearUserInfo());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { userInfo };
}; 