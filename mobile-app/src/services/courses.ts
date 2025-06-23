import { apiService } from './api';

export class CoursesService {
  static async getCourses() {
    return await apiService.get('/api/mobile/courses');
  }

  static async getUserCourses(userId: number) {
    const response = await apiService.get('/api/mobile/dashboard');
    return response.data.courses;
  }

  static async getCourseModules(courseId: number, userId: number) {
    return await apiService.get(`/api/mobile/course/${courseId}/modules?userId=${userId}`);
  }

  static async checkCourseAccess(email: string, courseId: number) {
    return await apiService.post('/api/check-course-access', { email, courseId });
  }

  static async getCourseDetails(courseId: number) {
    return await apiService.get(`/api/courses/${courseId}`);
  }

  static async enrollInCourse(enrollmentData: {
    name: string;
    email: string;
    transid: string;
    refid?: string;
    courseName: string;
    amt: number;
    courseId: number;
  }) {
    return await apiService.post('/api/pending', enrollmentData);
  }

  static async checkEnrollmentStatus(email: string, courseId: number) {
    return await apiService.post('/api/pending-check', { email, courseId });
  }
}