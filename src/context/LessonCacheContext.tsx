"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Lesson } from '@/types/lessonTypes';

interface LessonCacheContextType {
  cachedLesson: Lesson | null;
  setCachedLesson: (lesson: Lesson | null) => void;
  getCachedLesson: (lessonId: number) => Lesson | null;
  clearLessonCache: (lessonId: number) => void;
}

const LessonCacheContext = createContext<LessonCacheContextType | undefined>(undefined);

interface LessonCacheProviderProps {
  children: ReactNode;
}

export const LessonCacheProvider: React.FC<LessonCacheProviderProps> = ({ children }) => {
  const [cachedLesson, setCachedLessonState] = useState<Lesson | null>(null);
  const [lessonCacheMap, setLessonCacheMap] = useState<Record<number, Lesson>>({});

  // Initialize cache from localStorage on component mount
  useEffect(() => {
    try {
      const cachedLessons = localStorage.getItem('lessonCache');
      if (cachedLessons) {
        setLessonCacheMap(JSON.parse(cachedLessons));
      }
    } catch (e) {
      console.error('Failed to load lesson cache from localStorage:', e);
    }
  }, []);

  const setCachedLesson = (lesson: Lesson | null) => {
    setCachedLessonState(lesson);
    
    if (lesson) {
      // Update the cache map
      const updatedCache = { ...lessonCacheMap, [lesson.id]: lesson };
      setLessonCacheMap(updatedCache);
      
      // Persist to localStorage
      try {
        localStorage.setItem('lessonCache', JSON.stringify(updatedCache));
      } catch (e) {
        console.error('Failed to cache lesson in localStorage:', e);
      }
    }
  };

  const getCachedLesson = (lessonId: number): Lesson | null => {
    // Check current React state first
    if (cachedLesson && cachedLesson.id === lessonId) {
      return cachedLesson;
    }
    
    // Then check the cache map
    if (lessonCacheMap[lessonId]) {
      // Update the current cached lesson
      setCachedLessonState(lessonCacheMap[lessonId]);
      return lessonCacheMap[lessonId];
    }
    
    return null;
  };
  
  const clearLessonCache = (lessonId: number) => {
    // Remove from cache map
    const updatedCache = { ...lessonCacheMap };
    delete updatedCache[lessonId];
    setLessonCacheMap(updatedCache);
    
    // If it's the current cached lesson, clear it
    if (cachedLesson && cachedLesson.id === lessonId) {
      setCachedLessonState(null);
    }
    
    // Update localStorage
    try {
      localStorage.setItem('lessonCache', JSON.stringify(updatedCache));
    } catch (e) {
      console.error('Failed to update localStorage after clearing cache:', e);
    }
  };
  
  const value: LessonCacheContextType = {
    cachedLesson,
    setCachedLesson,
    getCachedLesson,
    clearLessonCache
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