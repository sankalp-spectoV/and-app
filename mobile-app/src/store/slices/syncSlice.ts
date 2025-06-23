import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SyncService } from '../../services/sync';

interface SyncItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

interface SyncState {
  queue: SyncItem[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
}

const initialState: SyncState = {
  queue: [],
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,
  error: null,
};

// Async thunks
export const syncOfflineData = createAsyncThunk(
  'sync/syncOfflineData',
  async (_, { getState }) => {
    const state = getState() as { sync: SyncState };
    const unsyncedItems = state.sync.queue.filter(item => !item.synced);
    
    if (unsyncedItems.length === 0) return [];
    
    const response = await SyncService.syncData(unsyncedItems);
    return response;
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    addToSyncQueue: (state, action: PayloadAction<Omit<SyncItem, 'id' | 'timestamp' | 'synced'>>) => {
      const syncItem: SyncItem = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        synced: false,
      };
      state.queue.push(syncItem);
    },
    markAsSynced: (state, action: PayloadAction<string>) => {
      const item = state.queue.find(item => item.id === action.payload);
      if (item) {
        item.synced = true;
      }
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    clearSyncedItems: (state) => {
      state.queue = state.queue.filter(item => !item.synced);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncOfflineData.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncOfflineData.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncTime = Date.now();
        
        // Mark successfully synced items
        action.payload.forEach((result: any) => {
          if (result.success) {
            const item = state.queue.find(item => item.id === result.id);
            if (item) {
              item.synced = true;
            }
          }
        });
      })
      .addCase(syncOfflineData.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.error.message || 'Sync failed';
      });
  },
});

export const { addToSyncQueue, markAsSynced, setOnlineStatus, clearSyncedItems, clearError } = syncSlice.actions;
export default syncSlice.reducer;