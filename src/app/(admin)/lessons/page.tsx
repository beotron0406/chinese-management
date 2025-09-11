'use client';

import React from 'react';
import { Typography, Card } from 'antd';
import LessonList from '../../../components/lessons/LessonList';
import PageHeader from '../../../components/common/PageHeader';

const { Title } = Typography;

export default function LessonsPage() {
  return (
    <div>
      <PageHeader 
        title="Lesson Management" 
        subtitle="Create and manage lessons for your courses" 
      />
      
      <Card style={{ marginTop: 16 }}>
        <LessonList showAll={true} />
      </Card>
    </div>
  );
}