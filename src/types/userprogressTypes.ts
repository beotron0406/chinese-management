export interface StudyInfo {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  lastStudyDate: string | null;
}

export interface LessonProgress {
  lessonId: number;
  name: string;
  status: 'not_started' | 'completed';
  scorePercentage: number | null;
  completedAt: string | null;
}

export interface CourseProgress {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  averageScore: number;
}

export interface PlatformOverview {
  totalUsers: number;
  activeUsers: number;
  totalCompletions: number;
  averageScore: number;
  averageStreak: number;
  topUsers: Array<{
    userId: number;
    displayName: string;
    metric: number;
  }>;
}

export interface UserProgressDetail {
  user: {
    id: number;
    email: string;
    displayName: string;
    currentHskLevel: number;
  };
  studyInfo: StudyInfo;
  completedLessons: Array<{
    lessonId: number;
    lessonTitle: string;
    courseId: number;
    courseTitle: string;
    scorePercentage: number;
    completedAt: string;
  }>;
  courseBreakdown: CourseProgress[];
}

export interface LeaderboardData {
  byStreak: Array<{
    userId: number;
    displayName: string;
    longestStreak: number;
  }>;
  byLessonsCompleted: Array<{
    userId: number;
    displayName: string;
    lessonsCompleted: number;
  }>;
  byAverageScore: Array<{
    userId: number;
    displayName: string;
    averageScore: number;
  }>;
}

export interface CompleteListsonRequest {
  lessonId: number;
  scorePercentage: number;
}

export interface UserProgressResponse {
  id: number;
  userId: number;
  lessonId: number;
  status: string;
  scorePercentage: number;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}