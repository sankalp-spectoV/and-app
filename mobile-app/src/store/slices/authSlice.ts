import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '../../services/auth';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
}

const initialState: AuthState = {
  user: null,
  sessionToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string; deviceInfo: any }) => {
    const response = await AuthService.login(credentials);
    return response;
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; phone: string; password: string }) => {
    const response = await AuthService.register(userData);
    return response;
  }
);

export const verifyRegistration = createAsyncThunk(
  'auth/verifyRegistration',
  async (data: { email: string; otp: string }) => {
    const response = await AuthService.verifyRegistration(data);
    return response;
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken: string) => {
    const response = await AuthService.refreshToken(refreshToken);
    return response;
  }
);

export const biometricLogin = createAsyncThunk(
  'auth/biometricLogin',
  async () => {
    const response = await AuthService.biometricLogin();
    return response;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.sessionToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.sessionToken = action.payload.tokens.sessionToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
      })
      // Verify Registration
      .addCase(verifyRegistration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyRegistration.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyRegistration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Verification failed';
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.sessionToken = action.payload.sessionToken;
      })
      // Biometric Login
      .addCase(biometricLogin.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.sessionToken = action.payload.tokens.sessionToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.isAuthenticated = true;
      });
  },
});

export const { logout, clearError, setBiometricEnabled, updateUser } = authSlice.actions;
export default authSlice.reducer;