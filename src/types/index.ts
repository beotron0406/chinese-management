// User types
export interface User {
  id: number;
  email: string;
  displayName: string;
  role: string;
  currentHskLevel?: number;
  nativeLanguage?: string;
  totalStudyDays?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastStudyDate?: string | null;
  isActive: boolean;
  createdAt: string;
}

// Course types
export interface Course {
  id: number;
  title: string;
  description?: string;
  hskLevel: number;
  totalLessons?: number;
  prerequisiteCourseId?: number | null;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CourseFormValues {
  title: string;
  description?: string;
  hskLevel: number;
  orderIndex: number;
  isActive: boolean;
  prerequisiteCourseId?: number | null;
}

// Word types
export interface Word {
  id: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  definitions: WordDefinition[];
  hskLevel?: number;
  isActive: boolean;
}

export interface WordDefinition {
  id: number;
  wordId: number;
  text: string;
  partOfSpeech?: string;
  language: string;
}

// Grammar pattern types
export interface GrammarPattern {
  id: number;
  pattern: string;
  description: string;
  examples?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hskLevel?: number;
  isActive: boolean;
}



export interface CourseFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: CourseFormValues) => Promise<void>;
  initialValues?: Course | null;
}

export interface LessonDetailViewProps {
  lessonId: number | string;
}


export interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Course Types
export interface Course {
  id: number;
  hskLevel: number;
  title: string;
  description?: string;
  totalLessons?: number;
  prerequisiteCourseId?: number | null;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CourseCreateInput {
  hskLevel: number;
  title: string;
  description?: string;
  prerequisiteCourseId?: number | null;
  orderIndex: number;
  isActive?: boolean;
}

export interface CourseUpdateInput {
  title?: string;
  description?: string;
  hskLevel?: number;
  prerequisiteCourseId?: number | null;
  orderIndex?: number;
  isActive?: boolean;
}

export interface CoursesResponse {
  items: Course[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  coursesByHskLevel: {
    hskLevel: number;
    count: number;
  }[];
}
