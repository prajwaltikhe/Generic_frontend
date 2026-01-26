import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

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
  },
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
  },
);

const initialState = {
  emergencyReportAlertData: [],
  todayEmergency: 0,
  loading: false,
  error: null,
};

// Async thunk to delete emergency report alert
export const deleteEmergencyReportAlert = createAsyncThunk(
  'emergencyReportAlert/deleteEmergencyReportAlert',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ApiService.delete(`${APIURL.EMERGENCY}/${id}`);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to delete alert');
      }
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

// Async thunk to upload emergency report alert
export const uploadEmergencyReportAlert = createAsyncThunk(
  'emergencyReportAlert/uploadEmergencyReportAlert',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=emergency_alert`, formData);
      if (!response.success) return rejectWithValue(response.message || 'Upload failed');
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Upload failed');
    }
  },
);

export const updateEmergencyReportAlert = createAsyncThunk(
  'emergencyReportAlert/updateEmergencyReportAlert',
  async ({ id, payload, company_id }, { rejectWithValue }) => {
    try {
      const response = await ApiService.put(`${APIURL.EMERGENCY}/${id}`, payload, { company_id });
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update alert');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

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
      })
      // deleteEmergencyReportAlert
      .addCase(deleteEmergencyReportAlert.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteEmergencyReportAlert.fulfilled, (state) => {
        state.loading = false;
        // Optionally update the list if needed, or rely on refetch
      })
      .addCase(deleteEmergencyReportAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateEmergencyReportAlert.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEmergencyReportAlert.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateEmergencyReportAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default emergencyReportAlertReducer.reducer;
