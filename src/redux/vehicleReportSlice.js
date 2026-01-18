import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';

// Async thunk to fetch vehicle reports
export const fetchVehicleReport = createAsyncThunk(
  'vehicleReport/fetchVehicleReport',
  async ({ company_id, from_date, to_date }, thunkAPI) => {
    try {
      const response = await ApiService.get('/vehicle', {
        params: { company_id, from_date, to_date },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Async thunk to fetch all vehicle data
export const fetchAllVehicleData = createAsyncThunk(
  'vehicleReport/fetchAllVehicleData',
  async ({ company_id }, thunkAPI) => {
    try {
      const response = await ApiService.get('vehicle', { company_id });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Async thunk to fetch seat occupancy report
export const fetchSeatOccupancyReport = createAsyncThunk(
  'vehicleReport/fetchSeatOccupancyReport',
  async (params, thunkAPI) => {
    try {
      const response = await ApiService.get('seatoccupancy', params);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Async thunk to fetch speed over report
export const fetchOverSpeedReport = createAsyncThunk('vehicleReport/fetchOverSpeedReport', async (params, thunkAPI) => {
  try {
    const response = await ApiService.get('reports/overspeed', params);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

// Async thunk to fetch overspeed report details
export const fetchOverspeedReportDetails = createAsyncThunk(
  'vehicleReport/fetchOverspeedReportDetails',
  async ({ id, company_id, from_date, to_date, page, limit }, thunkAPI) => {
    try {
      const params = { company_id, from_date, to_date, page, limit };
      const response = await ApiService.get(`reports/overspeed/details/${id}`, params);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Async thunk to fetch VehicleArrivalReport
export const fetchVehicleArrivalData = createAsyncThunk(
  'vehicleReport/fetchVehicleArrivalData',
  async (params, thunkAPI) => {
    try {
      const response = await ApiService.get('reports/vehicleArrival', params);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Initial state
const initialState = {
  VehicleArrivalTimeReport: [],
  seatOccupancyReportData: [],
  speedOverReportData: [],
  vehicleReport: [],
  allVehicledata: [],
  loading: false,
  error: null,
};

// Slice
const vehicleReportSlice = createSlice({
  name: 'vehicleReport',
  initialState,
  reducers: {
    setVehicleReport: (state, action) => {
      state.vehicleReport = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Vehicle Report
      .addCase(fetchVehicleReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleReport.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicleReport = action.payload;
      })
      .addCase(fetchVehicleReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // All Vehicle Data
      .addCase(fetchAllVehicleData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllVehicleData.fulfilled, (state, action) => {
        state.loading = false;
        state.allVehicledata = action.payload;
      })
      .addCase(fetchAllVehicleData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Seat Occupancy Report
      .addCase(fetchSeatOccupancyReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeatOccupancyReport.fulfilled, (state, action) => {
        state.loading = false;
        state.seatOccupancyReportData = action.payload;
      })
      .addCase(fetchSeatOccupancyReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Speed Over Report
      .addCase(fetchOverSpeedReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverSpeedReport.fulfilled, (state, action) => {
        state.loading = false;
        state.speedOverReportData = action.payload;
      })
      .addCase(fetchOverSpeedReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Vehicle Arrival Time
      .addCase(fetchVehicleArrivalData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleArrivalData.fulfilled, (state, action) => {
        state.loading = false;
        state.VehicleArrivalTimeReport = action.payload;
      })
      .addCase(fetchVehicleArrivalData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { setVehicleReport } = vehicleReportSlice.actions;

// Export reducer
export default vehicleReportSlice.reducer;
