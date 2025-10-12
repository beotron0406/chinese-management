import {
  Course,
  Word,
  GrammarPattern,
  CourseFormValues,
  PaginatedResponse,
} from "@/types";
import { Lesson, LessonFormValues } from "@/types/lessonTypes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

// Helper function to handle API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem("auth_token");

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`🌐 API Request: ${options.method || "GET"} ${fullUrl}`);
  console.log(`🔑 Auth Token: ${token ? "Present" : "Missing"}`);

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

    console.log(
      `📡 API Response: ${response.status} ${response.statusText} for ${fullUrl}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API Error: ${response.status}`, errorData);
      throw new Error(
        errorData.message ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`✅ API Success: ${fullUrl}`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Request Failed: ${fullUrl}`, error);
    throw error;
  }
};

// API utility object that lessonApi.ts is expecting
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

// Course API functions
export const courseService = {
  getCourses: (page = 1, limit = 10): Promise<PaginatedResponse<Course>> =>
    apiRequest(`/courses?page=${page}&limit=${limit}`),
  getCoursesByHskLevel: (level: number): Promise<Course[]> =>
    apiRequest(`/courses/hsk/${level}`),

  getCourseById: (id: number): Promise<Course> => apiRequest(`/courses/${id}`),

  createCourse: (courseData: CourseFormValues): Promise<Course> =>
    apiRequest("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    }),

  updateCourse: (
    id: number,
    courseData: Partial<CourseFormValues>
  ): Promise<Course> =>
    apiRequest(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(courseData),
    }),

  deleteCourse: (id: number): Promise<void> =>
    apiRequest(`/courses/${id}`, {
      method: "DELETE",
    }),

  restoreCourse: (id: number): Promise<Course> =>
    apiRequest(`/courses/${id}/restore`, {
      method: "PUT",
    }),

  getCourseStats: (): Promise<any> => apiRequest("/courses/stats"),
};

// Dictionary API functions
export const dictionaryService = {
  searchWords: (query: string, limit = 10): Promise<Word[]> =>
    apiRequest(`/words/search?q=${query}&limit=${limit}`),

  getWordById: (id: number): Promise<Word> => apiRequest(`/words/${id}`),

  getWordBySimplified: (simplified: string): Promise<Word> =>
    apiRequest(`/words/simplified/${simplified}`),
};

// Grammar API functions
export const grammarService = {
  searchGrammarPatterns: (
    query: string,
    limit = 10
  ): Promise<GrammarPattern[]> =>
    apiRequest(`/grammar-patterns/search?q=${query}&limit=${limit}`),

  getGrammarPatternById: (id: number): Promise<GrammarPattern> =>
    apiRequest(`/grammar-patterns/${id}`),
};
