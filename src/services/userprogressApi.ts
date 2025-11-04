import { api } from './api';
import {
  StudyInfo,
  LessonProgress,
  PlatformOverview,
  UserProgressDetail,
  LeaderboardData,
  CompleteListsonRequest,
  UserProgressResponse,
} from '@/types/userprogressTypes';

// User Progress APIs
export const userProgressApi = {
  // Complete a lesson
  completeLesson: async (data: CompleteListsonRequest): Promise<UserProgressResponse> => {
    const response = await api.put('/users/progress/complete', data);
    return response.data as UserProgressResponse;
  },

  // Get course progress
  getCourseProgress: async (courseId: number): Promise<LessonProgress[]> => {
    const response = await api.get(`/users/progress/course/${courseId}`);
    return response.data as LessonProgress[];
  },

  // Get study info
  getStudyInfo: async (): Promise<StudyInfo> => {
    const response = await api.get('/users/progress/study-info');
    return response.data as StudyInfo;
  },

  // Get lesson progress
  getLessonProgress: async (lessonId: number): Promise<UserProgressResponse | null> => {
    const response = await api.get(`/users/progress/lesson/${lessonId}`);
    return response.data as UserProgressResponse | null;
  },
};

// Admin Statistics APIs
export const adminProgressApi = {
  // Platform overview
  getOverview: async (): Promise<PlatformOverview> => {
    const response = await api.get('/admin/progress/overview');
    return response.data as PlatformOverview;
  },

  // User progress details
  getUserProgress: async (userId: number): Promise<UserProgressDetail> => {
    const response = await api.get(`/admin/progress/user/${userId}`);
    return response.data as UserProgressDetail;
  },

  // Course analytics
  getCourseAnalytics: async (courseId: number): Promise<any> => {
    const response = await api.get(`/admin/progress/course/${courseId}/analytics`);
    return response.data;
  },

  // Lesson analytics
  getLessonAnalytics: async (lessonId: number): Promise<any> => {
    const response = await api.get(`/admin/progress/lesson/${lessonId}/analytics`);
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (limit: number = 20): Promise<LeaderboardData> => {
    const response = await api.get(`/admin/progress/leaderboard?limit=${limit}`);
    return response.data as LeaderboardData;
  },
};