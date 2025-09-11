'use client';

import React from 'react';
import { Card } from 'antd';
import PageHeader from '../../../../components/common/PageHeader';
import LessonDetailView from '../../../../components/lessons/LessonDetailView';

export default function LessonDetailPage({ params }: { params: { lesson_id: string } }) {
  const lessonId = parseInt(params.lesson_id);

  return (
    <div>
      <PageHeader 
        title="Lesson Details" 
        subtitle="View and edit lesson content"
      />
      
      <Card style={{ marginTop: 16 }}>
        <LessonDetailView lessonId={lessonId} />
      </Card>
    </div>
  );
}