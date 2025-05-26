import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserInfo {
  email: string;
  name: string;
  roles: string[];
  isEmailConfirmed: boolean;
}

interface UserInfoState {
  info: UserInfo | null;
}

const initialState: UserInfoState = {
  info: null,
};

export const userInfoSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.info = action.payload;
    },
    clearUserInfo: (state) => {
      state.info = null;
    },
  },
});

export const { setUserInfo, clearUserInfo } = userInfoSlice.actions;
export default userInfoSlice.reducer;