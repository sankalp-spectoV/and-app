import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { VideoService } from '../../services/video';

interface VideoState {
  currentVideoToken: string | null;
  currentModuleId: number | null;
  playbackPosition: number;
  duration: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: VideoState = {
  currentVideoToken: null,
  currentModuleId: null,
  playbackPosition: 0,
  duration: 0,
  isPlaying: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const generateVideoToken = createAsyncThunk(
  'video/generateToken',
  async ({ email, moduleId }: { email: string; moduleId: number }) => {
    const response = await VideoService.generateVideoToken(email, moduleId);
    return { token: response.token, moduleId };
  }
);

export const updateVideoProgress = createAsyncThunk(
  'video/updateProgress',
  async (progressData: {
    moduleId: number;
    courseId: number;
    watchedDuration: number;
    totalDuration: number;
    currentPosition: number;
  }) => {
    await VideoService.updateProgress(progressData);
    return progressData;
  }
);

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setPlaybackPosition: (state, action: PayloadAction<number>) => {
      state.playbackPosition = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    clearVideoState: (state) => {
      state.currentVideoToken = null;
      state.currentModuleId = null;
      state.playbackPosition = 0;
      state.duration = 0;
      state.isPlaying = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Video Token
      .addCase(generateVideoToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateVideoToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentVideoToken = action.payload.token;
        state.currentModuleId = action.payload.moduleId;
      })
      .addCase(generateVideoToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to generate video token';
      })
      // Update Video Progress
      .addCase(updateVideoProgress.fulfilled, (state, action) => {
        state.playbackPosition = action.payload.currentPosition;
      });
  },
});

export const { setPlaybackPosition, setDuration, setIsPlaying, clearVideoState, clearError } = videoSlice.actions;
export default videoSlice.reducer;