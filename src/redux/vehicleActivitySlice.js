import { ApiService } from '../services';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchVehicleActivityData = createAsyncThunk(
  'vehicleActivity/fetchVehicleActivityData',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ApiService.get('reports/movement-summary', params);
      if (!response.success) return rejectWithValue(response.message || 'Failed to fetch vehicle activity data');
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Something went wrong');
    }
  }
);

export const fetchVehicleMissingInflux = createAsyncThunk(
  'vehicle_missing_influx/fetchVehicleMissingInflux',
  async ({ company_id, page, limit }, thunkAPI) => {
    try {
      const response = await ApiService.get('vehicle_missing_influx', { company_id, page, limit });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchMapHistoryData = createAsyncThunk('mapHistory/fetchMapHistoryData', async (params, thunkAPI) => {
  try {
    const response = await ApiService.get('report/maphistory', params);
    return response;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

// ✅ Initial State
const initialState = {
  vehicleActivityMomentData: [],
  vehicleMissingInflux: [],
  activityData: [],
  mapHistoryData: [],
  loading: false,
  error: null,
};

// ✅ Slice
const vehicleActivitySliceReport = createSlice({
  name: 'vehicleActivity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleActivityData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleActivityData.fulfilled, (state, action) => {
        state.loading = false;
        state.activityData = action.payload;
      })
      .addCase(fetchVehicleActivityData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchVehicleMissingInflux.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleMissingInflux.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicleMissingInflux = action.payload;
      })
      .addCase(fetchVehicleMissingInflux.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMapHistoryData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMapHistoryData.fulfilled, (state, action) => {
        state.loading = false;
        state.mapHistoryData = action.payload;
      })
      .addCase(fetchMapHistoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default vehicleActivitySliceReport.reducer;
