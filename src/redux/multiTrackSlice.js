import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiService, Lastvehicledata } from '../services';
import { APIURL } from '../constants';
import { processVehicles } from '../utils/vehicleStatus';
import { fetchVehicles } from './vehiclesSlice';

export const fetchEnrichedVehicles = createAsyncThunk(
  'multiTrackStatus/fetchEnrichedVehicles',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await dispatch(fetchVehicles({ limit: 100 })).unwrap();
      const vehicles = res.vehicles || [];
      const validVehicles = vehicles.filter((v) => v?.imei_number);

      if (!validVehicles.length) return [];

      const imeis = validVehicles.map((v) => v.imei_number);
      let lastData = [];

      for (let i = 0; i < imeis.length; i += 10) {
        const chunk = imeis.slice(i, i + 10);
        const results = await Promise.all(
          chunk.map(async (imei) => {
            try {
              return await Lastvehicledata.get(`${APIURL.LASTVEHICLEDATA}?imei=${imei}`);
            } catch {
              return null;
            }
          }),
        );
        lastData.push(...results.flatMap((r) => (r?.success ? r.data : [])));
      }

      return validVehicles.map((v) => {
        const live = lastData.find((d) => d?.imei === v.imei_number);
        return { ...v, ...(live || {}), vehicle_name: v.vehicle_name };
      });
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to sync vehicles');
    }
  },
);

export const fetchPlaybackData = createAsyncThunk(
  'multiTrackStatus/fetchPlaybackData',
  async (params, { rejectWithValue }) => {
    try {
      const res = await Lastvehicledata.post(APIURL.PLAYBACK, {}, params);
      if (res.success && res.data.length) {
        return res.data;
      }
      return rejectWithValue(res.message || 'No data found');
    } catch (err) {
      return rejectWithValue(err.message || 'Error fetching playback data');
    }
  },
);

export const fetchLateArrivalStats = createAsyncThunk(
  'multiTrackStatus/fetchLateArrivalStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await ApiService.get(APIURL.LATEARRIVAL);
      if (res?.success && Array.isArray(res.data?.weekChart)) {
        return res.data.weekChart;
      }
      return rejectWithValue(res?.message || 'Failed to fetch usage');
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
);

const initialState = {
  devices: [],
  runningDevices: [],
  parkedDevices: [],
  idelDevices: [],
  offlineVehicleData: [],
  newDevices: [],
  activeTab: 'All',
  isTrackShow: false,
  isProcessed: false,
  weekChart: [], // to store fetched stats
  loadingStats: false,
  playbackData: [],
  loadingPlayback: false,
  errorPlayback: null,
};

const multiTrackSlice = createSlice({
  name: 'multiTrackStatus',
  initialState,
  reducers: {
    setProcessedVehicles(state, action) {
      const result = processVehicles(action.payload);
      state.devices = result.devices;
      state.runningDevices = result.runningDevices;
      state.idelDevices = result.idelDevices;
      state.parkedDevices = result.parkedDevices;
      state.offlineVehicleData = result.offlineVehicleData;
      state.newDevices = result.newDevices;
      state.isProcessed = true;
    },
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    setIsTrackShow(state, action) {
      state.isTrackShow = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLateArrivalStats.pending, (state) => {
        state.loadingStats = true;
      })
      .addCase(fetchLateArrivalStats.fulfilled, (state, action) => {
        state.loadingStats = false;
        state.weekChart = action.payload;
      })
      .addCase(fetchLateArrivalStats.rejected, (state) => {
        state.loadingStats = false;
        state.weekChart = [];
      })
      .addCase(fetchPlaybackData.pending, (state) => {
        state.loadingPlayback = true;
        state.errorPlayback = null;
      })
      .addCase(fetchPlaybackData.fulfilled, (state, action) => {
        state.loadingPlayback = false;
        state.playbackData = action.payload;
      })
      .addCase(fetchPlaybackData.rejected, (state, action) => {
        state.loadingPlayback = false;
        state.errorPlayback = action.payload;
        state.playbackData = [];
      })
      .addCase(fetchEnrichedVehicles.fulfilled, (state, action) => {
        const result = processVehicles(action.payload);
        state.devices = result.devices;
        state.runningDevices = result.runningDevices;
        state.idelDevices = result.idelDevices;
        state.parkedDevices = result.parkedDevices;
        state.offlineVehicleData = result.offlineVehicleData;
        state.newDevices = result.newDevices;
        state.isProcessed = true;
      });
  },
});

export const { setProcessedVehicles, setActiveTab, setIsTrackShow } = multiTrackSlice.actions;
export default multiTrackSlice.reducer;
