import { api } from './api';
import {
  StudyInfo,
  LessonProgress,
  PlatformOverview,
  UserProgressDetail,
  LeaderboardData,
  CourseAnalytics,
  LessonAnalytics,
  CompleteListsonRequest,
  UserProgressResponse,
} from '@/types/userprogressTypes';

// Admin Statistics APIs
export const adminProgressApi = {
  // 1. Platform overview
  getOverview: async (): Promise<PlatformOverview> => {
    try {
      console.log('🔄 API Service: Calling Next.js API...');
      const response = await api.get('/admin/progress/overview');
      
      console.log('🔄 API Service: Full response object:', response);
      console.log('🔄 API Service: Response type:', typeof response);
      
      // Kiểm tra xem response có data property không
      if (response && typeof response === 'object' && 'data' in response) {
        console.log('✅ API Service: Using response.data');
        return (response as any).data as PlatformOverview;
      } else {
        console.log('✅ API Service: Using response directly');
        return response as PlatformOverview;
      }
      
    } catch (error: any) {
      console.error('❌ API Service Error:', error);
      throw error;
    }
  },

  // 2. User progress details
  getUserProgress: async (userId: number): Promise<UserProgressDetail> => {
    const response = await api.get(`/admin/progress/user/${userId}`);
    console.log('getUserProgress response:', response);
    
    // Xử lý response một cách an toàn
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as UserProgressDetail;
    }
    return response as UserProgressDetail;
  },

  // 3. Course analytics
  getCourseAnalytics: async (courseId: number): Promise<CourseAnalytics> => {
    const response = await api.get(`/admin/progress/course/${courseId}/analytics`);
    console.log('getCourseAnalytics response:', response);
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as CourseAnalytics;
    }
    return response as CourseAnalytics;
  },

  // 4. Lesson analytics
  getLessonAnalytics: async (lessonId: number): Promise<LessonAnalytics> => {
    const response = await api.get(`/admin/progress/lesson/${lessonId}/analytics`);
    console.log('getLessonAnalytics response:', response);
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as LessonAnalytics;
    }
    return response as LessonAnalytics;
  },

  // 5. Leaderboard
  getLeaderboard: async (limit: number = 20): Promise<LeaderboardData> => {
    const response = await api.get(`/admin/progress/leaderboard?limit=${limit}`);
    console.log('getLeaderboard response:', response);
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as LeaderboardData;
    }
    return response as LeaderboardData;
  },
};

// User Progress APIs
export const userProgressApi = {
  completeLesson: async (data: CompleteListsonRequest): Promise<UserProgressResponse> => {
    console.log('🔄 Completing lesson via Next.js API:', data);
    
    const response = await api.put('/users/progress/complete', data);
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as UserProgressResponse;
    }
    return response as UserProgressResponse;
  },

  getCourseProgress: async (courseId: number): Promise<LessonProgress[]> => {
    console.log(`🔄 Fetching course progress via Next.js API: ${courseId}`);
    
    const response = await api.get(`/users/progress/course/${courseId}`);
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as LessonProgress[];
    }
    return response as LessonProgress[];
  },

  getStudyInfo: async (): Promise<StudyInfo> => {
    console.log('🔄 Fetching study info via Next.js API');
    
    const response = await api.get('/users/progress/study-info');
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as StudyInfo;
    }
    return response as StudyInfo;
  },

  getLessonProgress: async (lessonId: number): Promise<UserProgressResponse | null> => {
    console.log(`🔄 Fetching lesson progress via Next.js API: ${lessonId}`);
    
    const response = await api.get(`/users/progress/lesson/${lessonId}`);
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as UserProgressResponse | null;
    }
    return response as UserProgressResponse | null;
  },
};