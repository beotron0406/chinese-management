'use client';

import { Tabs, Typography, Row, Col } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import CourseList from '@/components/courses/CourseList';
import CourseStatsCard from '@/components/courses/CourseStatsCard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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
        
        {/* <Row gutter={[16, 16]}>
          <Col span={24} lg={8}>
            <CourseStatsCard />
          </Col>
          <Col span={24} lg={16}>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '4px' }}>
              <Title level={5}>Quick Tips</Title>
              <ul>
                <li>Create courses organized by HSK level for structured learning</li>
                <li>Use the order index to control the sequence of courses</li>
                <li>Set prerequisite courses to create a learning path</li>
                <li>Inactive courses are hidden from students</li>
              </ul>
            </div>
          </Col>
        </Row> */}
        
        <div style={{ marginTop: '16px' }}>
          <Tabs defaultActiveKey="all">
            <TabPane tab="All Courses" key="all">
              <CourseList key="all-courses" />
            </TabPane>
            <TabPane tab="Active Courses" key="active">
              <CourseList key="active-courses" filterActive={true} />
            </TabPane>
            <TabPane tab="Inactive Courses" key="inactive">
              <CourseList key="inactive-courses" filterActive={false} />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}