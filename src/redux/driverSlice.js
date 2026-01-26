import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

export const createDriver = createAsyncThunk('driver/createDriver', async (payload, { rejectWithValue }) => {
  try {
    const res = await ApiService.post(APIURL.DRIVER, payload);
    if (!res.success) return rejectWithValue(res.message);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateDriver = createAsyncThunk('driver/updateDriver', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await ApiService.put(`${APIURL.DRIVER}/${id}`, payload);
    if (!res.success) return rejectWithValue(res.message);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Fetch Drivers
export const fetchDrivers = createAsyncThunk('driver/fetchDrivers', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await ApiService.get(APIURL.DRIVER, params);
    if (!res?.success) return rejectWithValue(res?.message || 'Failed to fetch drivers');

    const { drivers = [], pagination } = res.data;
    return { drivers, pagination };
  } catch (err) {
    return rejectWithValue(err.message || 'Network error');
  }
});

// DELETE driver thunk
export const deleteDriver = createAsyncThunk('driver/deleteDriver', async (id, { rejectWithValue }) => {
  try {
    const res = await ApiService.delete(`${APIURL.DRIVER}/${id}`);
    if (res.success) {
      return res.message;
    } else {
      return rejectWithValue(res.message || 'Failed to delete driver');
    }
  } catch (err) {
    return rejectWithValue(err.message || 'Network error');
  }
});

// Change driver status thunk
export const changeDriverStatus = createAsyncThunk(
  'driver/changeDriverStatus',
  async ({ id, newStatusId }, { rejectWithValue }) => {
    try {
      const res = await ApiService.put(`${APIURL.DRIVER}/${id}`, { status_id: newStatusId });

      if (res.success) {
        return res.message || 'Driver status updated successfully';
      } else {
        return rejectWithValue(res.message || 'Failed to update status');
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
);

// Upload Driver Data (Excel/CSV)
export const uploadDriverData = createAsyncThunk('driver/uploadDriverData', async (formData, { rejectWithValue }) => {
  try {
    const response = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=driver`, formData);
    if (!response.success) return rejectWithValue(response.message || 'Upload failed');
    return response;
  } catch (error) {
    return rejectWithValue(error.message || 'Upload failed');
  }
});

const initialState = {
  drivers: [],
  pagination: null,
  loading: false,
  error: null,
};

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: { resetDriverState: () => initialState },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.drivers = action.payload.drivers;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.drivers = [];
      })
      // Create Driver
      .addCase(createDriver.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDriver.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createDriver.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Driver
      .addCase(updateDriver.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDriver.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateDriver.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // delete driver
      .addCase(deleteDriver.pending, (state) => {
        state.loading = false;
      })
      .addCase(deleteDriver.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteDriver.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(changeDriverStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(changeDriverStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changeDriverStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetDriverState } = driverSlice.actions;
export default driverSlice.reducer;
