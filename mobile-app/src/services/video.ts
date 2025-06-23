import { apiService } from './api';

export class VideoService {
  static async generateVideoToken(email: string, moduleId: number) {
    return await apiService.post('/api/generate-video-token', { email, moduleId });
  }

  static async updateProgress(progressData: {
    moduleId: number;
    courseId: number;
    watchedDuration: number;
    totalDuration: number;
    currentPosition: number;
  }) {
    return await apiService.post('/api/mobile/video/progress', progressData);
  }

  static async getVideoUrl(moduleId: number, token: string) {
    return `${apiService['baseURL']}/api/secure-video/${moduleId}?token=${token}`;
  }
}