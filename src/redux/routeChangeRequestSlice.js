import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

export const fetchRouteChangeRequests = createAsyncThunk(
  'routeChangeRequest/fetchRouteChangeRequests',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.ROUTECHANGEREQ, params);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch route change requests');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

export const updateRouteChangeRequest = createAsyncThunk(
  'routeChangeRequest/updateRouteChangeRequest',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await ApiService.put(`${APIURL.ROUTECHANGEREQ}/${id}`, payload);
      if (!response.success) return rejectWithValue(response.message || 'Failed to update request');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

export const uploadRouteChangeData = createAsyncThunk(
  'routeChangeRequest/uploadRouteChangeData',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=route_change`, formData);
      if (!response.success) return rejectWithValue(response.message || 'Upload failed');
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Upload failed');
    }
  },
);

const initialState = {
  requests: [],
  pagination: null,
  loading: false,
  error: null,
};

const routeChangeRequestSlice = createSlice({
  name: 'routeChangeRequest',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchRouteChangeRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRouteChangeRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.routeChanges || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRouteChangeRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateRouteChangeRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRouteChangeRequest.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateRouteChangeRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default routeChangeRequestSlice.reducer;
