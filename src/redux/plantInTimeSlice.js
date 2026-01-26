import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

export const fetchPlantInTime = createAsyncThunk(
  'plantInTime/fetchPlantInTime',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.PLANTINTIME, params);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch plant in time records');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

export const createPlantInTime = createAsyncThunk(
  'plantInTime/createPlantInTime',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await ApiService.post(APIURL.PLANTINTIME, payload);
      if (!response.success) return rejectWithValue(response.message || 'Failed to create plant in time');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

export const updatePlantInTime = createAsyncThunk(
  'plantInTime/updatePlantInTime',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await ApiService.put(`${APIURL.PLANTINTIME}/${id}`, payload);
      if (!response.success) return rejectWithValue(response.message || 'Failed to update plant in time');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

export const deletePlantInTime = createAsyncThunk('plantInTime/deletePlantInTime', async (id, { rejectWithValue }) => {
  try {
    const response = await ApiService.delete(`${APIURL.PLANTINTIME}/${id}`);
    if (!response.success) return rejectWithValue(response.message || 'Failed to delete plant in time');
    return id;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const uploadPlantInTimeData = createAsyncThunk(
  'plantInTime/uploadPlantInTimeData',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=plant_in_time`, formData);
      if (!response.success) return rejectWithValue(response.message || 'Upload failed');
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Upload failed');
    }
  },
);

const initialState = {
  plantInTimeList: [],
  pagination: null,
  loading: false,
  error: null,
};

const plantInTimeSlice = createSlice({
  name: 'plantInTime',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPlantInTime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlantInTime.fulfilled, (state, action) => {
        state.loading = false;
        state.plantInTimeList = action.payload.plantInTimes || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPlantInTime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createPlantInTime.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPlantInTime.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createPlantInTime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updatePlantInTime.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePlantInTime.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePlantInTime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deletePlantInTime.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePlantInTime.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deletePlantInTime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default plantInTimeSlice.reducer;
