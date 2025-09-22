"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Lesson } from '@/types/lessonTypes';

interface LessonCacheContextType {
  cachedLesson: Lesson | null;
  setCachedLesson: (lesson: Lesson | null) => void;
  getCachedLesson: (lessonId: number) => Lesson | null;
}

const LessonCacheContext = createContext<LessonCacheContextType | undefined>(undefined);

interface LessonCacheProviderProps {
  children: ReactNode;
}

export const LessonCacheProvider: React.FC<LessonCacheProviderProps> = ({ children }) => {
  const [cachedLesson, setCachedLesson] = useState<Lesson | null>(null);

  const getCachedLesson = (lessonId: number): Lesson | null => {
    if (cachedLesson && cachedLesson.id === lessonId) {
      return cachedLesson;
    }
    return null;
  };

  const value: LessonCacheContextType = {
    cachedLesson,
    setCachedLesson,
    getCachedLesson,
  };

  return (
    <LessonCacheContext.Provider value={value}>
      {children}
    </LessonCacheContext.Provider>
  );
};

export const useLessonCache = (): LessonCacheContextType => {
  const context = useContext(LessonCacheContext);
  if (!context) {
    throw new Error('useLessonCache must be used within a LessonCacheProvider');
  }
  return context;
};