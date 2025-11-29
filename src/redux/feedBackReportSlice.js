import { ApiService } from '../services';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchFeedbackReport = createAsyncThunk('feedbackReport/fetchFeedbackReport', async (params, thunkAPI) => {
  try {
    const response = await ApiService.get('/reports/feedback', params);
    return response?.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

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
      });
  },
});

export default feedbackReportSlice.reducer;
