import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CoursesService } from '../../services/courses';

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  moduleCount: number;
  mobileOptimized: boolean;
  downloadable: boolean;
  estimatedSize: number;
  overallProgress?: number;
  totalModules?: number;
  completedModules?: number;
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  day: number;
  week?: number;
  videoUrl: string;
  duration?: number;
  progress?: number;
  completed?: boolean;
  lastWatchedPosition?: number;
}

interface CoursesState {
  courses: Course[];
  userCourses: Course[];
  currentCourse: Course | null;
  modules: Module[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CoursesState = {
  courses: [],
  userCourses: [],
  currentCourse: null,
  modules: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async () => {
    const response = await CoursesService.getCourses();
    return response;
  }
);

export const fetchUserCourses = createAsyncThunk(
  'courses/fetchUserCourses',
  async (userId: number) => {
    const response = await CoursesService.getUserCourses(userId);
    return response;
  }
);

export const fetchCourseModules = createAsyncThunk(
  'courses/fetchCourseModules',
  async ({ courseId, userId }: { courseId: number; userId: number }) => {
    const response = await CoursesService.getCourseModules(courseId, userId);
    return response;
  }
);

export const checkCourseAccess = createAsyncThunk(
  'courses/checkCourseAccess',
  async ({ email, courseId }: { email: string; courseId: number }) => {
    const response = await CoursesService.checkCourseAccess(email, courseId);
    return { courseId, hasAccess: response.hasAccess };
  }
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setCurrentCourse: (state, action: PayloadAction<Course>) => {
      state.currentCourse = action.payload;
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
      state.modules = [];
    },
    updateModuleProgress: (state, action: PayloadAction<{ moduleId: number; progress: number; completed: boolean }>) => {
      const module = state.modules.find(m => m.id === action.payload.moduleId);
      if (module) {
        module.progress = action.payload.progress;
        module.completed = action.payload.completed;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Courses
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch courses';
      })
      // Fetch User Courses
      .addCase(fetchUserCourses.fulfilled, (state, action) => {
        state.userCourses = action.payload;
      })
      // Fetch Course Modules
      .addCase(fetchCourseModules.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCourseModules.fulfilled, (state, action) => {
        state.isLoading = false;
        state.modules = action.payload;
      })
      .addCase(fetchCourseModules.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch modules';
      });
  },
});

export const { setCurrentCourse, clearCurrentCourse, updateModuleProgress, clearError } = coursesSlice.actions;
export default coursesSlice.reducer;