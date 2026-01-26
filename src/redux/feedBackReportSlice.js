import { ApiService } from '../services';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { APIURL } from '../constants'; // Ensure APIURL is available

export const fetchFeedbackReport = createAsyncThunk('feedbackReport/fetchFeedbackReport', async (params, thunkAPI) => {
  try {
    const response = await ApiService.get('/reports/feedback', params);
    return response?.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deleteFeedbackReport = createAsyncThunk(
  'feedbackReport/deleteFeedbackReport',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ApiService.delete(`${APIURL.FEEDBACK}/${id}`);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to delete feedback');
      }
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

export const updateFeedbackReport = createAsyncThunk(
  'feedbackReport/updateFeedbackReport',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await ApiService.put(`${APIURL.FEEDBACK}/${id}`, payload);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to update feedback');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

const initialState = {
  feedbackReportData: {},
  loading: false,
  error: null,
};

const feedbackReportSlice = createSlice({
  name: 'feedbackReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedbackReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedbackReport.fulfilled, (state, action) => {
        state.loading = false;
        state.feedbackReportData = action.payload;
      })
      .addCase(fetchFeedbackReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateFeedbackReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateFeedbackReport.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateFeedbackReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default feedbackReportSlice.reducer;
