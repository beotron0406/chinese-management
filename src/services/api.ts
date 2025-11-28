import {
  Course,
  Word,
  GrammarPattern,
  CourseFormValues,
  PaginatedResponse,
} from "@/types";
import {
  CompleteListsonRequest,
  CourseAnalytics,
  LeaderboardData,
  LessonAnalytics,
  LessonProgress,
  PlatformOverview,
  StudyInfo,
  UserProgressDetail,
  UserProgressResponse,
} from "@/types/userprogressTypes";

// Next.js API routes base URL
const API_BASE_URL = "/api";

// Helper function to handle API requests to Next.js routes
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem("auth_token");

  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// API utility object for backward compatibility
export const api = {
  get: <T>(endpoint: string) =>
    apiRequest<{ data: T }>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, data: any) =>
    apiRequest<{ data: T }>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: any) =>
    apiRequest<{ data: T }>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  patch: <T>(endpoint: string, data: any) =>
    apiRequest<{ data: T }>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) =>
    apiRequest<{ data: T }>(endpoint, { method: "DELETE" }),
};

// Course API functions - Updated to use Next.js routes
// ...existing code...

// Course API functions - Updated to use Next.js routes
// ...existing code...

// Course API functions - Updated to handle correct response format
export const courseService = {
  getCourses: async (
    page = 1,
    limit = 10
  ): Promise<{
    courses: Course[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    // Direct API call with correct typing
    return apiRequest<{
      courses: Course[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/course?page=${page}&limit=${limit}`);
  },

  getCoursesByHskLevel: (level: number): Promise<Course[]> =>
    apiRequest(`/course/hsk/${level}`),

  getCourseById: (id: number): Promise<Course> => apiRequest(`/course/${id}`),

  createCourse: (courseData: CourseFormValues): Promise<Course> =>
    apiRequest("/course", {
      method: "POST",
      body: JSON.stringify(courseData),
    }),

  updateCourse: (
    id: number,
    courseData: Partial<CourseFormValues>
  ): Promise<Course> =>
    apiRequest(`/course/${id}`, {
      method: "PUT",
      body: JSON.stringify(courseData),
    }),

  deleteCourse: (id: number): Promise<void> =>
    apiRequest(`/course/${id}`, {
      method: "DELETE",
    }),

  restoreCourse: (id: number): Promise<Course> =>
    apiRequest(`/course/${id}/restore`, {
      method: "PUT",
    }),

  getCourseStats: (): Promise<any> => apiRequest("/course/stats"),
};

export const {
  getCourses,
  getCoursesByHskLevel,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  restoreCourse,
  getCourseStats,
} = courseService;

export const dictionaryService = {
  searchWords: (query: string, limit = 10): Promise<Word[]> =>
    apiRequest(`/words/search?q=${query}&limit=${limit}`),

  getWordById: (id: number): Promise<Word> => apiRequest(`/words/${id}`),

  getWordBySimplified: (simplified: string): Promise<Word> =>
    apiRequest(`/words/simplified/${simplified}`),
};

// Grammar API functions - Still direct backend calls (until routes are created)
export const grammarService = {
  searchGrammarPatterns: (
    query: string,
    limit = 10
  ): Promise<GrammarPattern[]> =>
    apiRequest(`/grammar-patterns/search?q=${query}&limit=${limit}`),

  getGrammarPatternById: (id: number): Promise<GrammarPattern> =>
    apiRequest(`/grammar-patterns/${id}`),
};

// Export individual course functions for convenience

export const userProgressService = {
  completeLesson: (
    data: CompleteListsonRequest
  ): Promise<UserProgressResponse> =>
    apiRequest("/users/progress/complete", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getCourseProgress: (courseId: number): Promise<LessonProgress[]> =>
    apiRequest(`/users/progress/course/${courseId}`),

  getStudyInfo: (): Promise<StudyInfo> =>
    apiRequest("/users/progress/study-info"),

  getLessonProgress: (lessonId: number): Promise<UserProgressResponse | null> =>
    apiRequest(`/users/progress/lesson/${lessonId}`),
};

// Admin Progress API functions - Updated to use Next.js routes
export const adminProgressService = {
  getOverview: (): Promise<PlatformOverview> =>
    apiRequest("/admin/progress/overview"),

  getUserProgress: (userId: number): Promise<UserProgressDetail> =>
    apiRequest(`/admin/progress/user/${userId}`),

  getCourseAnalytics: (courseId: number): Promise<CourseAnalytics> =>
    apiRequest(`/admin/progress/course/${courseId}/analytics`),

  getLessonAnalytics: (lessonId: number): Promise<LessonAnalytics> =>
    apiRequest(`/admin/progress/lesson/${lessonId}/analytics`),

  getLeaderboard: (limit: number = 20): Promise<LeaderboardData> =>
    apiRequest(`/admin/progress/leaderboard?limit=${limit}`),
};

// Export individual functions for convenience
export const {
  completeLesson,
  getCourseProgress,
  getStudyInfo,
  getLessonProgress,
} = userProgressService;

export const {
  getOverview,
  getUserProgress,
  getCourseAnalytics,
  getLessonAnalytics,
  getLeaderboard,
} = adminProgressService;

// ...existing code...
