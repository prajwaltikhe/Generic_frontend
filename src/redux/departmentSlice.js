import { APIURL } from '../constants';
import { ApiService } from '../services';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch departments (list with pagination + search)
export const fetchDepartments = createAsyncThunk(
  'department/fetchDepartments',
  async ({ page = 1, limit = 5, search = '' }, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(APIURL.DEPARTMENTS, { page, limit, search });

      if (!response.success) return rejectWithValue(response.message || 'Failed to fetch departments');

      const { departments = [], pagination } = response.data;
      return { departments, pagination };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Fetch single department by ID
export const fetchDepartmentById = createAsyncThunk(
  'department/fetchDepartmentById',
  async (departmentId, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(`${APIURL.DEPARTMENTS}/${departmentId}`);

      if (!response.success) return rejectWithValue(response.message || 'Failed to fetch department');

      return response.data.department;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Create department
export const createDepartment = createAsyncThunk(
  'department/createDepartment',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await ApiService.post(APIURL.DEPARTMENTS, payload);

      if (!response.success) return rejectWithValue(response.message || 'Failed to create department');

      return response.data; // new department object
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Update department
export const updateDepartment = createAsyncThunk(
  'department/updateDepartment',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await ApiService.put(`${APIURL.DEPARTMENTS}/${id}`, payload);

      if (!response.success) return rejectWithValue(response.message || 'Failed to update department');

      return response.data; // updated department object
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Delete department
export const deleteDepartment = createAsyncThunk(
  'department/deleteDepartment',
  async (departmentId, { rejectWithValue }) => {
    try {
      const response = await ApiService.delete(`${APIURL.DEPARTMENTS}/${departmentId}`);

      if (!response.success) return rejectWithValue(response.message || 'Failed to delete department');

      return { departmentId, message: response.message };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  departments: [],
  pagination: null,
  selectedDepartment: null,
  loading: false,
  error: null,
};

export const departmentReducer = createSlice({
  name: 'department',
  initialState,
  reducers: {
    setDepartmentData: (state, action) => {
      state.departments = action.payload;
    },
    clearSelectedDepartment: (state) => {
      state.selectedDepartment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload.departments;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single
      .addCase(fetchDepartmentById.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchDepartmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDepartment = action.payload;
      })
      .addCase(fetchDepartmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments = [action.payload, ...state.departments];
      })
      // Update
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const updated = action.payload;
        state.departments = state.departments.map((dept) => (dept.id === updated.id ? updated : dept));
        state.selectedDepartment = updated;
      })

      // Delete
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter((dept) => dept.id !== action.payload.departmentId);
      });
  },
});

export const { setDepartmentData, clearSelectedDepartment } = departmentReducer.actions;
export default departmentReducer.reducer;
