import { apiService } from './api';

export class SyncService {
  static async syncData(syncItems: Array<any>) {
    return await apiService.post('/api/mobile/sync', { syncData: syncItems });
  }

  static async getDashboardData(userId: number) {
    return await apiService.get('/api/mobile/dashboard');
  }
}