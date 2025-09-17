import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    status: "idle",
    error: null,
  },

  reducers: {
    loginUser: (state, action) => {
      console.log("state",state)
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout: (state) => {
      // Clear state and localStorage on logout
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("company_id");
      localStorage.removeItem("rememberedEmail");
    },
  },
});

export const { loginUser, logout } = authSlice.actions;
export default authSlice.reducer;
