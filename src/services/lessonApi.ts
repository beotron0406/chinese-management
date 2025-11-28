import { api } from "./api";
import {
  Lesson,
  LessonContent,
  LessonFormValues,
  LessonItem,
  ContentFormValues,
  LessonContentResponse,
} from "../types/lessonTypes";
import { ContentType } from "@/enums/content-type.enum";

// Define response types to match API
interface PaginatedLessonResponse {
  data: Lesson[];
  total: number;
  page: number;
  limit: number;
}

interface LessonItemsResponse {
  lesson?: Lesson | null;
  items: LessonItem[];
}
interface RawLessonContentResponse {
  id: number;
  name: string;
  description: string;
  content: RawLessonContentItem[];
}

// Base content item interface
interface RawLessonContentItem {
  order_index: number;
  type: string;
  [key: string]: any; // For dynamic properties
}

// Specific content type interfaces
interface AudioImageQuestionContent extends RawLessonContentItem {
  type: "question_audio_image";
  audio: string;
  pinyin: string;
  english: string;
  transcript: string;
  explanation: string;
  instruction: string;
  correctAnswer: boolean;
}

interface WordDefinitionContent extends RawLessonContentItem {
  type: "content_word_definition";
  pinyin: string;
  speech: string;
  audio_url: string;
  picture_url: string;
  chinese_text: string;
  translation: string;
}

// You can add more specific content types here as needed

// Update your LessonItemsResponse to match the transformed structure
interface LessonItemsResponse {
  lesson?: Lesson | null;
  items: LessonItem[];
}
export interface LessonWord {
  id: number;
  lessonId: number;
  wordSenseId: number;
  orderIndex: number;
  wordSense: {
    id: number;
    pinyin?: string;
    partOfSpeech?: string;
    hskLevel?: number;
    translations?: Array<{
      language: string;
      translation: string;
      additionalDetail?: string;
    }>;
    word: {
      id: number;
      simplified: string;
      traditional?: string;
    };
  };
}
export interface AddLessonWordDto {
  wordSenseId: number;
}

export interface AddLessonGrammarPatternDto {
  grammarPatternId: number;
}

export interface LessonGrammarPattern {
  id: number;
  lessonId: number;
  grammarPatternId: number;
  orderIndex: number;
  grammarPattern: {
    id: number;
    pattern: string[];
    patternPinyin?: string[];
    patternFormula?: string;
    hskLevel?: number;
    translations?: Array<{
      language: string;
      grammarPoint: string;
      explanation: string;
    }>;
  };
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
  console.log("🔍 getLessonWithContent called with id:", id);
  console.log("📡 Making request to: /lessons/content/" + id);
  
  try {
    const response = await api.get(`/lessons/content/${id}`);
    
    console.log("📦 Raw API response:", response);
    console.log("📦 Response data:", response.data);
    
    // Check what's actually in response
    if (!response) {
      console.log("❌ Response is falsy");
      return { id: 0, name: '', description: '', content: [], words: [], grammarPatterns: [] } as LessonContentResponse;
    }
    
    if (!response.data) {
      console.log("❌ Response.data is falsy");
      console.log("Returning response.data (may be undefined):", response.data);
      return response.data as LessonContentResponse;
    }
    
    console.log("✅ Returning response.data");  
    return response.data as LessonContentResponse;
  } catch (error) {
    console.error("❌ Error in getLessonWithContent:", error);
    throw error;
  }
},

  getLessonItems: async (id: number): Promise<LessonItemsResponse> => {
    const response = await api.get(`/lessons/content/${id}`);

    const rawData = response.data || response;

    if (!rawData || typeof rawData !== "object" || !("content" in rawData)) {
      return { lesson: null, items: [] };
    }

    const lessonData = rawData as RawLessonContentResponse;

    const contentItems: LessonItem[] = lessonData.content.map(
      (item: any, index: number) => {
        // Map string type to ContentType enum
        let contentType;
        switch (item.type) {
          case "content_word_definition":
            contentType = ContentType.CONTENT_WORD_DEFINITION;
            break;
          case "content_sentence":
            contentType = ContentType.CONTENT_SENTENCES;
            break;
        }

        return {
          id: item.id || `content-${id}-${index}`,
          type: "content",
          lessonId: id,
          orderIndex: item.order_index || 0,
          contentType: contentType,
          data: item,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    );

    return {
      lesson: {
        id: lessonData.id,
        name: lessonData.name,
        description: lessonData.description,
        courseId: 0,
        orderIndex: 0,
        isActive: true,
      },
      items: contentItems,
    };
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

      return response.data as Lesson[];
    } catch (error) {
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

  // Add content and questions to a lesson
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

  // Update lesson content/item
  updateLessonItem: async (
    itemId: number,
    itemData: Partial<ContentFormValues>
  ): Promise<LessonContent> => {
    const response = await api.put(`/lessons/items/${itemId}`, itemData);
    return response.data as LessonContent;
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
  getLessonWords: async (lessonId: number): Promise<LessonWord[]> => {
    const response = await api.get<LessonWord[]>(`/lessons/${lessonId}/words`);
    return response.data;
  },

  addWordsToLesson: async (
    lessonId: number,
    words: AddLessonWordDto[]
  ): Promise<any> => {
    const response = await api.post(`/lessons/${lessonId}/words`, words);
    return response.data || response;
  },

  removeWordsFromLesson: async (
    lessonId: number,
    wordSenseIds: number[]
  ): Promise<any> => {
    const query = wordSenseIds.length
      ? `?wordSenseIds=${wordSenseIds.join(",")}`
      : "";
    const response = await api.delete(`/lessons/${lessonId}/words${query}`);
    return response.data || response;
  },

  // Lesson Grammar Patterns
  getLessonGrammarPatterns: async (
    lessonId: number
  ): Promise<LessonGrammarPattern[]> => {
    const response = await api.get<LessonGrammarPattern[]>(
      `/lessons/${lessonId}/grammar-patterns`
    );
    return response.data;
  },

  addGrammarPatternsToLesson: async (
    lessonId: number,
    patterns: AddLessonGrammarPatternDto[]
  ): Promise<any> => {
    const response = await api.post(
      `/lessons/${lessonId}/grammar-patterns`,
      patterns
    );
    return response.data || response;
  },

  removeGrammarPatternsFromLesson: async (
    lessonId: number,
    grammarPatternIds: number[]
  ): Promise<any> => {
    const query = grammarPatternIds.length
      ? `?grammarPatternIds=${grammarPatternIds.join(",")}`
      : "";
    const response = await api.delete(
      `/lessons/${lessonId}/grammar-patterns${query}`
    );
    return response.data || response;
  },
};
