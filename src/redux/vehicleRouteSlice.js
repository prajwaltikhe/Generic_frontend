import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';

export const fetchVehicleRoutes = createAsyncThunk('vehicleRoute/fetchVehicleRoutes', async (params, thunkAPI) => {
  try {
    const res = await ApiService.get('/vehicleRoute', params);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.message);
  }
});

const initialState = {
  vehicleRoutes: { routes: [] },
  loading: false,
  error: null,
};

const vehicleRouteReducer = createSlice({
  name: 'vehicleRoute',
  initialState,
  reducers: {
    setVehicleRoute: (state, action) => {
      state.vehicleRoutes = action.payload || { routes: [] };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicleRoutes = action.payload || { routes: [] };
      })
      .addCase(fetchVehicleRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setVehicleRoute } = vehicleRouteReducer.actions;
export default vehicleRouteReducer.reducer;
