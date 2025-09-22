import { api } from './api';
import { Lesson, LessonContent, LessonFormValues, LessonItem, ContentFormValues } from '../types/lessonTypes';

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

interface LessonItemsResponse {
  lesson?: Lesson | null;
  items: LessonItem[];
}

// Alternative response formats the API might return
interface LessonItemsAlternateResponse {
  data?: LessonItem[];
  items?: LessonItem[];
  content?: any[]; // More flexible since API might return different content structure
  questions?: any[];
  // Also include other lesson properties that might be in the response
  id?: number;
  name?: string;
  description?: string;
  lesson?: Lesson;
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

  // Get lesson with all items (content + questions)
  getLessonItems: async (id: number): Promise<LessonItemsResponse> => {
    console.log(`🌐 API Call: GET /lessons/content/${id}`);

    const response = await api.get(`/lessons/content/${id}`);

    if (!response.data) {
      throw new Error('API returned empty response');
    }

    // Validate response structure
    const data = response.data as any;

    // Check if it's the expected LessonItemsResponse format
    if (data && typeof data === 'object' && 'lesson' in data && 'items' in data) {
      console.log('✅ Response matches LessonItemsResponse format');
      return data as LessonItemsResponse;
    }

    // Check if it's a direct array of items (alternative format)
    if (Array.isArray(data)) {
      console.log('📋 Response is direct items array, wrapping in expected format');
      return {
        lesson: null,
        items: data
      } as LessonItemsResponse;
    }

    // Check if response has items property directly
    if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
      console.log('📋 Response has items array, using it');
      return {
        lesson: data.lesson || null,
        items: data.items
      } as LessonItemsResponse;
    }

    // Check for alternative property names that might contain the data
    const altResponse = data as LessonItemsAlternateResponse;
    let items: any[] = [];

    // Priority order: content > items > data > questions
    if (altResponse.content && Array.isArray(altResponse.content)) {
      console.log('📋 Found items in "content" property');
      items = altResponse.content.map((item: any, index: number) => ({
        id: item.id || `content-${id}-${index}`,
        type: item.type || 'content',
        lessonId: id,
        orderIndex: item.order_index || item.orderIndex || index,
        data: item, // Just use the entire item as data since format is not final
        contentType: item.type || 'unknown',
        isActive: true
      }));
    } else if (altResponse.items && Array.isArray(altResponse.items)) {
      console.log('📋 Found items in "items" property');
      items = altResponse.items;
    } else if (altResponse.data && Array.isArray(altResponse.data)) {
      console.log('📋 Found items in "data" property');
      items = altResponse.data;
    } else if (altResponse.questions && Array.isArray(altResponse.questions)) {
      console.log('📋 Found items in "questions" property');
      items = altResponse.questions.map((q: any) => ({
        ...q,
        type: 'question',
        questionType: q.questionType || q.type
      }));
    }

    if (items.length > 0) {
      return {
        lesson: (data as any).lesson || null,
        items: items
      } as LessonItemsResponse;
    }

    // Check if the data object itself has properties that look like lesson items
    if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      console.log('🔍 Checking for item-like properties in keys:', keys);

      // Look for properties that might contain items
      for (const key of keys) {
        const value = (data as any)[key];
        if (Array.isArray(value) && value.length > 0) {
          console.log(`📋 Found array in "${key}" property with ${value.length} items`);
          return {
            lesson: (data as any).lesson || null,
            items: value
          } as LessonItemsResponse;
        }
      }
    }

    // Log unexpected format and return empty structure
    console.warn('⚠️ Unexpected API response format:', data);
    console.warn('⚠️ Response keys:', Object.keys(data || {}));

    return {
      lesson: null,
      items: []
    } as LessonItemsResponse;
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
  },

  // Create content
  createContent: async (contentData: ContentFormValues): Promise<LessonContent> => {
    const response = await api.post('/content', contentData);
    return response.data as LessonContent;
  }
};