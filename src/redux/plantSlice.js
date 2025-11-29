import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '../services';
import { APIURL } from '../constants';

// Async thunk to fetch plants from API
export const fetchPlants = createAsyncThunk(
  'plant/fetchPlants',
  async ({ page = 1, limit = 5, search = '' }, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.PLANTS, { page, limit, search });
      if (!response.success) return rejectWithValue(response.message || 'Failed to fetch plants');
      const { plants = [], pagination } = response.data;
      return { plants, pagination };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

//Async thunk to Fetch single plant by ID
export const fetchPlantById = createAsyncThunk('plant/fetchPlantById', async (plantID, { rejectWithValue }) => {
  try {
    const response = await ApiService.get(`${APIURL.PLANTS}/${plantID}`);
    if (!response.success) return rejectWithValue(response.message || 'Failed to fetch plant');

    return response.data.plant; // should be a single plant object
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

//Async thunk to Update plant
export const updatePlant = createAsyncThunk('plant/updatePlant', async ({ plantID, payload }, { rejectWithValue }) => {
  try {
    const response = await ApiService.put(`${APIURL.PLANTS}/${plantID}`, payload);

    if (!response.success) {
      return rejectWithValue(response.message || 'Failed to update plant');
    }

    return response.data; // updated plant
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});
// Async thunk to Create plant
export const createPlant = createAsyncThunk('plant/createPlant', async (payload, { rejectWithValue }) => {
  try {
    const response = await ApiService.post(APIURL.PLANTS, payload);
    if (!response.success) {
      return rejectWithValue(response.message || 'Failed to create plant');
    }
    return response.data; // newly created plant
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

// Async thunk to delete plants
export const deletePlant = createAsyncThunk('plant/deletePlant', async (plantID, { rejectWithValue }) => {
  try {
    const response = await ApiService.delete(`${APIURL.PLANTS}/${plantID}`);
    if (!response.success) {
      return rejectWithValue(response.message || 'Failed to delete plant');
    }
    return { plantID, message: response.message };
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

const initialState = {
  plants: [],
  pagination: null,
  selectedPlant: null,
  loading: false,
  error: null,
};

export const plantReducer = createSlice({
  name: 'plant',
  initialState,
  reducers: {
    setPlantData: (state, action) => {
      state.plants = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlants.fulfilled, (state, action) => {
        state.loading = false;
        state.plants = action.payload.plants;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPlants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create plant
      .addCase(createPlant.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPlant.fulfilled, (state, action) => {
        state.loading = false;
        // append to list
        state.plants = [action.payload, ...state.plants];
      })
      .addCase(createPlant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single plant
      .addCase(fetchPlantById.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchPlantById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPlant = action.payload;
      })
      .addCase(fetchPlantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ✅ Update plant
      .addCase(updatePlant.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePlant.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPlant = action.payload;
        // Update the plant inside the list if it exists
        state.plants = state.plants.map((plant) => (plant.id === updatedPlant.id ? updatedPlant : plant));
        // Also set it as the selectedPlant
        state.selectedPlant = updatedPlant;
      })
      // Delete plant
      .addCase(deletePlant.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePlant.fulfilled, (state, action) => {
        state.loading = false;
        state.plants = state.plants.filter((plant) => plant.id !== action.payload.plantID);
      })
      .addCase(deletePlant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setPlantData } = plantReducer.actions;
export default plantReducer.reducer;
