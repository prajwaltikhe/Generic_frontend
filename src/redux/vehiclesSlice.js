import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

// Async thunk to fetch vehicles
export const fetchVehicles = createAsyncThunk('vehicle/fetchVehicles', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await ApiService.get(APIURL.VEHICLE, params);
    if (!response.success) return rejectWithValue(response.message || 'Failed to fetch vehicles');

    const { vehicles = [], pagination } = response.data;
    return { vehicles, pagination };
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

// Create Vehicle
export const createVehicle = createAsyncThunk('vehicles/createVehicle', async (payload, { rejectWithValue }) => {
  try {
    const response = await ApiService.post(APIURL.VEHICLE, payload);
    if (!response.success) return rejectWithValue(response.message);
    return response.data; // return the created vehicle
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Update Vehicle
export const updateVehicle = createAsyncThunk(
  'vehicles/updateVehicle',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await ApiService.put(`${APIURL.VEHICLE}/${id}`, payload);
      if (!response.success) return rejectWithValue(response.message);
      return response.data; // return updated vehicle
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete Vehicle
export const deleteVehicle = createAsyncThunk('vehicles/deleteVehicle', async (id, { rejectWithValue, dispatch }) => {
  try {
    const response = await ApiService.delete(`${APIURL.VEHICLE}/${id}`);
    if (!response.success) return rejectWithValue(response.message);

    // Re-fetch list after delete
    dispatch(fetchVehicles({ page: 1, limit: 10 }));
    return id;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const changeVehicleStatus = createAsyncThunk(
  'vehicles/changeVehicleStatus',
  async ({ id, newStatusId }, { rejectWithValue }) => {
    try {
      const res = await ApiService.put(`${APIURL.VEHICLE}/${id}`, {
        vehicle_status_id: newStatusId,
      });
      if (res.data) {
        return res.vehicle;
      } else {
        return rejectWithValue(res.message || 'Failed to update status');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ---- Initial State ----
const initialState = {
  vehicles: [],
  pagination: null,
  loading: false,
  error: null,
};

// ---- Slice ----
const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setVehicleData: (state, action) => {
      state.vehicles = action.payload;
    },
    resetVehicleState: () => initialState,
    updatedData: (state, action) => {
      const payload = typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload;
      const updatedIMEI = payload.imei || payload.imei_number;
      if (!updatedIMEI) return;
      state.vehicles = Array.isArray(state.vehicles)
        ? state.vehicles.map((v) =>
            v.imei_number === updatedIMEI ? { ...v, ...payload, imei_number: v.imei_number } : v
          )
        : state.vehicles;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload.vehicles;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Create ---
      .addCase(createVehicle.pending, (state) => {
        state.loading = true;
      })
      .addCase(createVehicle.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateVehicle.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateVehicle.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteVehicle.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteVehicle.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      //Status of vehicle
      .addCase(changeVehicleStatus.pending, (state) => {
        state.loading = false;
      })
      .addCase(changeVehicleStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changeVehicleStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setVehicleData, resetVehicleState, updatedData } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
