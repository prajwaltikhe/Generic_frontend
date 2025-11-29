import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiService } from '../services';

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

export const fetchGeoToGeoFence = createAsyncThunk('geofence/geoToGeoFence', async (params, thunkAPI) => {
  try {
    const res = await ApiService.get('geofencetogeofence', params);
    return res;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

const initialState = {
  GeoToGeoReportData: [],
  GeoFenceVehicleReport: [],
  geofenceType: [],
  geoToGeoFence: [],
  geofences: [],
  vehicleGeoFence: [],
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
      .addCase(fetchGeoToGeoFence.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGeoToGeoFence.fulfilled, (state, action) => {
        state.loading = false;
        state.GeoToGeoReportData = action.payload;
      })
      .addCase(fetchGeoToGeoFence.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const fetchVehicleGeoFence = createAsyncThunk('geofence/fetchVehicleGeoFence', async (params, thunkAPI) => {
  try {
    const res = await ApiService.get('geofence', params);
    return res?.data || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const { setGeofences, setSelectedGeofence, clearSelectedGeofence } = geofenceSliceReducer.actions;
export default geofenceSliceReducer.reducer;
