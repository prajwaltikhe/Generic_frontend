import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiService } from '../services';

export const fetchPuchLogReport = createAsyncThunk('geofence/getVehicleGeofence', async (params, thunkAPI) => {
  try {
    const response = await ApiService.get('reports/punchlog', params);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

const initialState = {
  punchLogs: [],
  totalCount: 0,
  loading: false,
  error: null,
};

const punchInOutReducer = createSlice({
  name: 'punchInOut',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPuchLogReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPuchLogReport.fulfilled, (state, action) => {
        state.loading = false;
        state.punchLogs = action.payload?.data || [];
        state.totalCount = action.payload?.pagination?.total || action.payload?.data?.length || 0;
      })
      .addCase(fetchPuchLogReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default punchInOutReducer.reducer;
