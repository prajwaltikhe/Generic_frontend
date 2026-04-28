import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

export const fetchVehicleRoutes = createAsyncThunk('vehicleRoute/fetchVehicleRoutes', async (params, thunkAPI) => {
  try {
    const res = await ApiService.get(APIURL.VEHICLE_ROUTE, params);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.message);
  }
});

export const fetchAllVehicleRoutes = createAsyncThunk('vehicleRoute/fetchAllVehicleRoutes', async (params = { limit: 150 }, thunkAPI) => {
  try {
    const res = await ApiService.get(APIURL.VEHICLE_ROUTE, params);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.message);
  }
});

export const createVehicleRoute = createAsyncThunk(
  'vehicleRoute/createVehicleRoute',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await ApiService.post(APIURL.VEHICLE_ROUTE, payload);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);

export const updateVehicleRoute = createAsyncThunk(
  'vehicleRoute/updateVehicleRoute',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await ApiService.put(`${APIURL.VEHICLE_ROUTE}/${id}`, payload);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);

export const fetchVehicleRouteStops = createAsyncThunk(
  'vehicleRoute/fetchVehicleRouteStops',
  async (id, { rejectWithValue }) => {
    try {
      const res = await ApiService.get(`${APIURL.VEHICLE_ROUTE}/${id}/stops`);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);

export const deleteVehicleRoute = createAsyncThunk(
  'vehicleRoute/deleteVehicleRoute',
  async (id, { rejectWithValue }) => {
    try {
      const res = await ApiService.delete(`${APIURL.VEHICLE_ROUTE}/${id}`);
      if (!res.success) return rejectWithValue(res.message);
      return id;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);

export const uploadVehicleRouteData = createAsyncThunk(
  'vehicleRoute/uploadVehicleRouteData',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=vehicle_route`, formData);
      if (!response.success) return rejectWithValue(response.message || 'Upload failed');
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Upload failed');
    }
  },
);

// Initial state
const initialState = {
  vehicleRoutes: { routes: [] },
  allRoutes: [],
  loading: false,
  error: null,
  routeStops: [],
};

const vehicleRouteReducer = createSlice({
  name: 'vehicleRoute',
  initialState,
  reducers: {
    setVehicleRoute: (state, action) => {
      state.vehicleRoutes = action.payload || { routes: [] };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVehicleRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicleRoutes = action.payload || { routes: [] };
      })
      .addCase(fetchVehicleRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch All
      .addCase(fetchAllVehicleRoutes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllVehicleRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.allRoutes = action.payload?.routes || [];
      })
      .addCase(fetchAllVehicleRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createVehicleRoute.pending, (state) => {
        state.loading = true;
      })
      .addCase(createVehicleRoute.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createVehicleRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateVehicleRoute.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateVehicleRoute.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateVehicleRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteVehicleRoute.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteVehicleRoute.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteVehicleRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Stops
      .addCase(fetchVehicleRouteStops.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVehicleRouteStops.fulfilled, (state, action) => {
        state.loading = false;
        state.routeStops = action.payload;
      })
      .addCase(fetchVehicleRouteStops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setVehicleRoute } = vehicleRouteReducer.actions;
export default vehicleRouteReducer.reducer;
