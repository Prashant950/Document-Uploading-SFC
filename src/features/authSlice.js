import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: { token: null, role: null, user: null },
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.user = action.payload.user ?? state.user ?? null;
      if (action.payload.token != null)
        AsyncStorage.setItem("token", action.payload.token);
      if (action.payload.role != null)
        AsyncStorage.setItem("role", action.payload.role);
      if (action.payload.user != null)
        AsyncStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      AsyncStorage.removeItem("token");
      AsyncStorage.removeItem("role");
      AsyncStorage.removeItem("user");
      AsyncStorage.removeItem("PIN_CREATED");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
