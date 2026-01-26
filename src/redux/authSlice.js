import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService } from '../services';
import { APIURL } from '../constants';

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await AuthService.login(APIURL.LOGIN_ADMIN, email, password);
    if (!response.data) return rejectWithValue('Login failed');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message || 'Login failed');
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ userId, otp }, { rejectWithValue }) => {
  try {
    const response = await AuthService.verifyOtp(APIURL.VERIFY_OTP, userId, otp);
    if (!response.data) return rejectWithValue('OTP verification failed');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message || 'OTP verification failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, status: 'idle', error: null },

  reducers: {
    loginUser: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('company_id');
      localStorage.removeItem('rememberedEmail');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { loginUser, logout } = authSlice.actions;
export default authSlice.reducer;
