import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

// Async thunk to fetch announcements
export const fetchAnnouncements = createAsyncThunk(
  'announcement/fetchAnnouncements',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.ANNOUNCEMENT, params);
      if (!response.success) return rejectWithValue(response.message || 'Failed to fetch announcements');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

// Async thunk to create announcement
export const createAnnouncement = createAsyncThunk(
  'announcement/createAnnouncement',
  async (data, { rejectWithValue }) => {
    try {
      const response = await ApiService.post(APIURL.ANNOUNCEMENT, data);
      if (!response.success) return rejectWithValue(response.message || 'Failed to create announcement');
      return response.message;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

// Async thunk to update announcement
export const updateAnnouncement = createAsyncThunk(
  'announcement/updateAnnouncement',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await ApiService.put(`${APIURL.ANNOUNCEMENT}/${id}`, data);
      if (!response.success) return rejectWithValue(response.message || 'Failed to update announcement');
      return response.message;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

// Async thunk to delete announcement
export const deleteAnnouncement = createAsyncThunk(
  'announcement/deleteAnnouncement',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ApiService.delete(`${APIURL.ANNOUNCEMENT}/${id}`);
      if (!response.success) return rejectWithValue(response.message || 'Failed to delete announcement');
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  },
);

// Async thunk to upload announcement data
export const uploadAnnouncementData = createAsyncThunk(
  'announcement/uploadAnnouncementData',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=announcement`, formData);
      if (!response.success) return rejectWithValue(response.message || 'Upload failed');
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Upload failed');
    }
  },
);

const initialState = {
  announcements: [],
  pagination: null,
  loading: false,
  error: null,
  success: false,
};

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {
    resetAnnouncementState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAnnouncements
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = action.payload.announcements || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createAnnouncement
      .addCase(createAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAnnouncement.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // updateAnnouncement
      .addCase(updateAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAnnouncement.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // deleteAnnouncement
      .addCase(deleteAnnouncement.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteAnnouncement.fulfilled, (state) => {
        state.loading = false;
        // Optionally filter out deleted announcement from state
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAnnouncementState } = announcementSlice.actions;
export default announcementSlice.reducer;
