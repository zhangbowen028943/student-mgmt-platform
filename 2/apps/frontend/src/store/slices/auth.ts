import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: { id: number; username: string; role: string } | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null
};

export const login = createAsyncThunk('auth/login', async (payload: { username: string; password: string }) => {
  const res = await axios.post('/api/auth/login', payload);
  return res.data as { token: string; refreshToken: string };
});

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const res = await axios.get('/api/users/me');
  return res.data as { id: number; username: string; role: string };
});

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
    }
  },
  extraReducers: builder => {
    builder.addCase(login.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || '登录失败';
    });
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.user = action.payload;
    });
  }
});

export const { setTokens, logout } = slice.actions;
export default slice.reducer;

