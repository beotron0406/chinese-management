import { api } from './api';
import { Lesson, LessonContent, LessonFormValues } from '../types/lessonTypes';

// Define response types to match API
interface PaginatedLessonResponse {
  data: Lesson[];
  total: number;
  page: number;
  limit: number;
}

interface LessonContentResponse {
  lesson: Lesson;
  content: LessonContent[];
  questions: any[];
}

export const lessonApi = {
  // Get paginated lessons
  getAllLessons: async (page: number, pageSize: number): Promise<any> => {
  const response = await api.get(`/lessons?page=${page}&limit=${pageSize}`);
  return response.data; 
},

  // Get a specific lesson by ID
  getLesson: async (id: number): Promise<Lesson> => {
    const response = await api.get(`/lessons/${id}`);
    return response.data as Lesson;
  },

  // Get complete lesson with content
  getLessonWithContent: async (id: number): Promise<LessonContentResponse> => {
    const response = await api.get(`/lessons/content/${id}`);
    return response.data as LessonContentResponse;
  },

  // Get lessons by course ID (active only)
getLessonsByCourse: async (courseId: number): Promise<Lesson[]> => {
  try {
    const response = await api.get(`/lessons/course/${courseId}`);
    
    if (!response) {
      return [];
    }
    
    if (response.data === undefined) {
      
    if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    }
    
    console.log('Successfully retrieved lessons data:', response.data);
    return response.data as Lesson[];
  } catch (error) {
    console.error('Error in getLessonsByCourse:', error);
    throw error;
  }
},

  // Get all lessons by course ID (including inactive)
  getAllLessonsByCourse: async (courseId: number): Promise<Lesson[]> => {
    const response = await api.get(`/lessons/course/${courseId}/all`);
    return response.data as Lesson[];
  },

  // Create a new lesson
  createLesson: async (lessonData: LessonFormValues): Promise<Lesson> => {
    const response = await api.post('/lessons', lessonData);
    return response.data as Lesson;
  },

  // Update an existing lesson
  updateLesson: async (id: number, lessonData: Partial<LessonFormValues>): Promise<Lesson> => {
    const response = await api.put(`/lessons/${id}`, lessonData);
    return response.data as Lesson;
  },

  // Soft delete a lesson
  softDeleteLesson: async (id: number): Promise<any> => {
    const response = await api.delete(`/lessons/${id}/soft`);
    return response.data;
  },

  // Restore a soft-deleted lesson
  restoreLesson: async (id: number): Promise<Lesson> => {
    const response = await api.patch(`/lessons/${id}/restore`, {});
    return response.data as Lesson;
  },

  // Add content to a lesson
  addLessonContent: async (lessonId: number, contentData: Omit<LessonContent, 'id' | 'lessonId'>): Promise<LessonContent> => {
    const response = await api.post('/lessons/items', {
      lessonId,
      ...contentData
    });
    return response.data as LessonContent;
  },

  // Get lesson content
  getLessonContent: async (lessonId: number): Promise<LessonContent[]> => {
    const response = await api.get(`/lessons/${lessonId}/content`);
    return response.data as LessonContent[];
  },

  // Delete lesson content
  deleteLessonContent: async (contentId: number): Promise<any> => {
    const response = await api.delete(`/lessons/items/${contentId}`);
    return response.data as LessonContent;
  }
};