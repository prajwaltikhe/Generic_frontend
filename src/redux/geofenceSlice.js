import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

export const vehicleGeofenceReport = createAsyncThunk('geofence/getVehicleGeofence', async (params = {}, thunkAPI) => {
  try {
    const res = await ApiService.get('geofenceReport', params);
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchGeofenceType = createAsyncThunk('geofence/geofenceTypeData', async ({ company_id }, thunkAPI) => {
  try {
    const res = await ApiService.get('geofencetype', { company_id });
    return res?.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchRouteViolation = createAsyncThunk('geofence/fetchRouteViolation', async (params, thunkAPI) => {
  try {
    const res = await ApiService.get('route-violation-summary', params);
    return res;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchGeofenceReportDetails = createAsyncThunk(
  'geofence/fetchGeofenceReportDetails',
  async ({ id, from_date, to_date, page, limit }, thunkAPI) => {
    try {
      const params = { from_date, to_date, page, limit };
      const res = await ApiService.get(`geofenceReport/details/${id}`, params);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const fetchRouteViolationDetails = createAsyncThunk(
  'geofence/fetchRouteViolationDetails',
  async ({ id, from_date, to_date }, thunkAPI) => {
    try {
      const params = { from_date, to_date };
      const res = await ApiService.get(`route-violation-summary/details/${id}`, params);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

const initialState = {
  GeoFenceVehicleReport: [],
  geofenceType: [],
  geofences: [],
  vehicleGeoFence: [],
  routeViolation: [],
  selectedGeofence: null,
  loading: false,
  error: null,
};

const geofenceSliceReducer = createSlice({
  name: 'geofence',
  initialState,
  reducers: {
    setGeofences: (state, action) => {
      state.geofences = action.payload;
    },
    setSelectedGeofence: (state, action) => {
      state.selectedGeofence = action.payload;
    },
    clearSelectedGeofence: (state) => {
      state.selectedGeofence = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(vehicleGeofenceReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(vehicleGeofenceReport.fulfilled, (state, action) => {
        state.loading = false;
        state.GeoFenceVehicleReport = action.payload;
      })
      .addCase(vehicleGeofenceReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchGeofenceType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGeofenceType.fulfilled, (state, action) => {
        state.loading = false;
        state.geofenceType = action.payload;
      })
      .addCase(fetchGeofenceType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchVehicleGeoFence.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleGeoFence.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicleGeoFence = action.payload;
      })
      .addCase(fetchVehicleGeoFence.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRouteViolation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRouteViolation.fulfilled, (state, action) => {
        state.loading = false;
        state.routeViolation = action.payload;
      })
      .addCase(fetchRouteViolation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Geofence
      .addCase(createGeofence.pending, (state) => {
        state.loading = true;
      })
      .addCase(createGeofence.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createGeofence.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Geofence
      .addCase(updateGeofence.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateGeofence.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateGeofence.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Fetch Geofences
export const fetchVehicleGeoFence = createAsyncThunk('geofence/fetchVehicleGeoFence', async (params, thunkAPI) => {
  try {
    const res = await ApiService.get(APIURL.GEOFENCE, params);
    return res?.data || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createGeofence = createAsyncThunk('geofence/createGeofence', async (payload, { rejectWithValue }) => {
  try {
    const res = await ApiService.post(APIURL.GEOFENCE, payload);
    if (!res.success) return rejectWithValue(res.message);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateGeofence = createAsyncThunk(
  'geofence/updateGeofence',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await ApiService.put(`${APIURL.GEOFENCE}/${id}`, payload);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const uploadGeofenceData = createAsyncThunk(
  'geofence/uploadGeofenceData',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=geofence`, formData);
      if (!response.success) return rejectWithValue(response.message || 'Upload failed');
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Upload failed');
    }
  },
);

export const deleteGeofence = createAsyncThunk('geofence/deleteGeofence', async (id, { rejectWithValue }) => {
  try {
    const res = await ApiService.delete(`${APIURL.GEOFENCE}/${id}`);
    if (res.success) {
      return res.message || 'Geofence deleted successfully';
    } else {
      return rejectWithValue(res.message || 'Failed to delete geofence');
    }
  } catch (error) {
    return rejectWithValue(error.message || 'An error occurred while deleting');
  }
});

export const { setGeofences, setSelectedGeofence, clearSelectedGeofence } = geofenceSliceReducer.actions;
export default geofenceSliceReducer.reducer;
