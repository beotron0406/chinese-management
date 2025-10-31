'use client';

import { Tabs, Typography, Row, Col } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import CourseStatsCard from '@/components/courses/CourseStatsCard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CourseList from './courses_list';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function CoursesPage() {
  return (
    <ProtectedRoute adminOnly>
      <div>
        <PageHeader 
          title="Course Management" 
          subtitle="Create and manage courses for the Chinese learning platform"
        />
        
        <div style={{ marginTop: '16px' }}>
          <Tabs defaultActiveKey="all">
            <TabPane tab="All Courses" key="all">
              <CourseList key="all-courses" />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}