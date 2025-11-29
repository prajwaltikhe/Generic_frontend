import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiService } from '../services';

function getTodayEmergencyCount(data) {
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const today = new Date().toISOString().slice(0, 10);
  return arr.filter((item) => item.created_at?.slice(0, 10) === today).length;
}

export const fetchEmergencyReportAlert = createAsyncThunk(
  'emergencyReportAlert/emergencyReportAlert',
  async (params, thunkAPI) => {
    try {
      const response = await ApiService.get('/reports/alerts', params);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchTodayEmergency = createAsyncThunk(
  'emergencyReportAlert/fetchTodayEmergency',
  async ({ page, limit, search }, thunkAPI) => {
    try {
      const response = await ApiService.get('/reports/alerts', { page, limit, search });
      return getTodayEmergencyCount(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const initialState = {
  emergencyReportAlertData: [],
  todayEmergency: 0,
  loading: false,
  error: null,
};

const emergencyReportAlertReducer = createSlice({
  name: 'emergencyReportAlert',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchEmergencyReportAlert
      .addCase(fetchEmergencyReportAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmergencyReportAlert.fulfilled, (state, action) => {
        state.loading = false;
        state.emergencyReportAlertData = action.payload;
      })
      .addCase(fetchEmergencyReportAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchTodayEmergency
      .addCase(fetchTodayEmergency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayEmergency.fulfilled, (state, action) => {
        state.loading = false;
        state.todayEmergency = action.payload;
      })
      .addCase(fetchTodayEmergency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default emergencyReportAlertReducer.reducer;
