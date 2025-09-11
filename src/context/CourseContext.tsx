'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { courseService } from '@/services/api';
import { Course } from '@/types';

interface CourseContextType {
  allCourses: Course[];
  loadingCourses: boolean;
  refreshCourses: () => Promise<void>;
  getCourseById: (id: number) => Course | undefined;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider = ({ children }: { children: ReactNode }) => {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const refreshCourses = async () => {
    setLoadingCourses(true);
    try {
      // Fetch all courses - this is a simplified approach
      // In a production app, you might want to implement pagination
      const response = await courseService.getCourses(1, 100);
      setAllCourses(response.items);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const getCourseById = (id: number) => {
    return allCourses.find(course => course.id === id);
  };

  useEffect(() => {
    refreshCourses();
  }, []);

  return (
    <CourseContext.Provider value={{ 
      allCourses, 
      loadingCourses, 
      refreshCourses,
      getCourseById
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};