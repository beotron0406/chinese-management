export interface Lesson {
  id: number;
  name: string;            // Changed from title to name
  description: string;
  courseId: number;
  orderIndex: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  course?: {    
    id: number;
    hskLevel: number;
    title: string;
    description: string;
    prerequisiteCourseId: number | null;
    isActive: boolean;
    orderIndex: number;
    createdAt: string;
  };
  lessonWords?: any[];      // Added from API response
  lessonGrammarPatterns?: any[]; // Added from API response
}

import { ContentType } from '@/enums/content-type.enum';

export interface LessonContent {
  id: number;
  type: ContentType | 'text' | 'vocabulary' | 'grammar' | 'exercise' | 'divider';
  data: Record<string, any>;
  orderIndex?: number;
  lessonId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonItem {
  id: number;
  type: 'content' | 'question';
  lessonId: number;
  orderIndex?: number;
  data: Record<string, any>;
  contentType?: ContentType;
  questionType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Also update your form values interfaces
export interface LessonFormData {
  name: string;             // Changed from title to name
  description: string;
  courseId?: number;
  orderIndex: number;
}

export interface LessonFormValues {
  name: string;             // Changed from title to name
  description: string;
  courseId?: number | null;
  orderIndex: number;
  isActive?: boolean;
}

// Add content form interface
export interface ContentFormValues {
  lessonId: number;
  type: ContentType | 'text' | 'vocabulary' | 'grammar' | 'exercise' | 'divider';
  data: Record<string, any>;
  orderIndex?: number;
}
export interface ILessonByCourse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  orderIndex: number;
  courseId: number;
  course: {
    id: number;
    hskLevel: number;
    title: string;
    description: string;
    prerequisiteCourseId: number | null;
    isActive: boolean;
    orderIndex: number;
    createdAt: string; // ISO date string
  }
}
