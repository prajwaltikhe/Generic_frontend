import { createSlice } from '@reduxjs/toolkit';
import { processVehicles } from '../utils/vehicleStatus';

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
});

export const { setProcessedVehicles, setActiveTab, setIsTrackShow } = multiTrackSlice.actions;
export default multiTrackSlice.reducer;
