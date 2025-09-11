'use client';

import { useParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import CourseDetailsView from '@/components/courses/CourseDetailsView';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.course_id);

  return (
    <ProtectedRoute adminOnly>
      <div>
        <PageHeader 
          title="Course Details" 
          subtitle="View and manage course information and lessons"
          backLink="/admin/courses"
        />
        
        <CourseDetailsView courseId={courseId} />
      </div>
    </ProtectedRoute>
  );
}