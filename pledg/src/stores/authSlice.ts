import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface AuthState {
  user: null | {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

const BE_SERVER = process.env.BE_SERVER || 'http://localhost:5000/api/v1';

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BE_SERVER}/auth/me`, {
        method: 'GET',
        credentials: 'include', 
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      const data = await response.json();
      return data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Authentication check failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutReducer(state) {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action: { payload?: unknown }) => {
        state.loading = false;
        state.user = null;
        state.error = typeof action.payload === 'string' ? action.payload : null;
      });
  },
});

export const { logoutReducer } = authSlice.actions;
export default authSlice.reducer; 