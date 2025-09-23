import { api } from "./api";
import {
  Lesson,
  LessonContent,
  LessonFormValues,
  LessonItem,
  ContentFormValues,
} from "../types/lessonTypes";

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
  questions: unknown[];
}

interface LessonItemsResponse {
  lesson?: Lesson | null;
  items: LessonItem[];
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

    try {
      const response = await api.get(`/lessons/content/${id}`);

      console.log("🔍 FULL API RESPONSE:", response);
      console.log("🔍 response.data:", response.data);

      // Check if response.data exists and what it contains
      if (response && response.data) {
        console.log("📦 response.data keys:", Object.keys(response.data));
        console.log("📦 response.data type:", typeof response.data);
        console.log("📦 response.data content:", response.data);

        // Your actual API returns the data directly in response.data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actualData = response.data as any;

        if (
          actualData &&
          actualData.content &&
          Array.isArray(actualData.content)
        ) {
          console.log(
            `✅ FOUND CONTENT ARRAY with ${actualData.content.length} items`
          );

          // Transform the content items to our LessonItem format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: LessonItem[] = actualData.content.map(
            (item: any, index: number) => ({
              id: item.id || `content-${id}-${index}`,
              type: "content" as const,
              lessonId: id,
              orderIndex: item.order_index || index,
              data: item, // Store the entire item as data
              contentType: item.type || "unknown",
              isActive: true,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })
          );

          console.log(`✅ TRANSFORMED ${items.length} items successfully`);
          return {
            lesson: {
              id: actualData.id,
              name: actualData.name,
              description: actualData.description,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            items: items,
          } as LessonItemsResponse;
        } else {
          console.error("❌ NO CONTENT ARRAY FOUND in actualData:", actualData);
        }
      } else {
        console.error("❌ NO response.data found. Full response:", response);
      }

      // Fallback: return empty
      return {
        lesson: null,
        items: [],
      } as LessonItemsResponse;
    } catch (error) {
      console.error("❌ getLessonItems CATCH ERROR:", error);
      throw error;
    }
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

      console.log("Successfully retrieved lessons data:", response.data);
      return response.data as Lesson[];
    } catch (error) {
      console.error("Error in getLessonsByCourse:", error);
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
    const response = await api.post("/lessons", lessonData);
    return response.data as Lesson;
  },

  // Update an existing lesson
  updateLesson: async (
    id: number,
    lessonData: Partial<LessonFormValues>
  ): Promise<Lesson> => {
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
  addLessonContent: async (
    lessonId: number,
    contentData: Omit<LessonContent, "id" | "lessonId">
  ): Promise<LessonContent> => {
    const response = await api.post("/lessons/items", {
      lessonId,
      ...contentData,
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
  createContent: async (
    contentData: ContentFormValues
  ): Promise<LessonContent> => {
    const response = await api.post("/content", contentData);
    return response.data as LessonContent;
  },
};
