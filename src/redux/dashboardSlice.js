import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

export const fetchTotalCount = createAsyncThunk('dashboard/fetchTotalCount', async (params, { rejectWithValue }) => {
  try {
    const response = await ApiService.get(APIURL.TOTALCOUNT, params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch total counts');
  }
});

export const fetchDepartmentAnalytics = createAsyncThunk(
  'dashboard/fetchDepartmentAnalytics',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.DEPARTMENTANALYTICS, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch department analytics');
    }
  },
);

export const fetchDistanceCovered = createAsyncThunk(
  'dashboard/fetchDistanceCovered',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.DISTANCECOVER, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch distance covered');
    }
  },
);

export const fetchTotalOnboardEmp = createAsyncThunk(
  'dashboard/fetchTotalOnboardEmp',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.TOTALONBOARDEMP, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch total onboard employees');
    }
  },
);

export const fetchLateArrival = createAsyncThunk('dashboard/fetchLateArrival', async (params, { rejectWithValue }) => {
  try {
    const response = await ApiService.get(APIURL.LATEARRIVAL, params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch late arrival data');
  }
});

export const fetchOverspeedViolation = createAsyncThunk(
  'dashboard/fetchOverspeedViolation',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.OVERSPEEDVIOLATION, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch overspeed violations');
    }
  },
);

const initialState = {
  totalCounts: {},
  departmentAnalytics: [],
  distanceCovered: {},
  totalOnboardEmp: {},
  lateArrival: {},
  overspeedViolation: {},
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchTotalCount
      .addCase(fetchTotalCount.fulfilled, (state, action) => {
        state.totalCounts = action.payload;
      })
      // fetchDepartmentAnalytics
      .addCase(fetchDepartmentAnalytics.fulfilled, (state, action) => {
        state.departmentAnalytics = action.payload;
      })
      // fetchDistanceCovered
      .addCase(fetchDistanceCovered.fulfilled, (state, action) => {
        state.distanceCovered = action.payload;
      })
      // fetchTotalOnboardEmp
      .addCase(fetchTotalOnboardEmp.fulfilled, (state, action) => {
        state.totalOnboardEmp = action.payload;
      })
      // fetchLateArrival
      .addCase(fetchLateArrival.fulfilled, (state, action) => {
        state.lateArrival = action.payload;
      })
      // fetchOverspeedViolation
      .addCase(fetchOverspeedViolation.fulfilled, (state, action) => {
        state.overspeedViolation = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
