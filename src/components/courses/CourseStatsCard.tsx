'use client';

import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Spin, message, Progress, List } from 'antd';
import { 
  BookOutlined, 
  CheckCircleOutlined, 
  LineChartOutlined 
} from '@ant-design/icons';
import { courseService } from '@/services/api';
import { CourseStats } from '@/types';

const CourseStatsCard = () => {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await courseService.getCourseStats();
        setStats(data);
      } catch (error) {
        message.error('Failed to load course statistics');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card title="Course Statistics">
        <div>No statistics available</div>
      </Card>
    );
  }

  const activePercentage = Math.round((stats.activeCourses / stats.totalCourses) * 100) || 0;

  return (
    <Card title="Course Statistics" bordered={false}>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic 
            title="Total Courses" 
            value={stats.totalCourses} 
            prefix={<BookOutlined />} 
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="Active Courses" 
            value={stats.activeCourses} 
            prefix={<CheckCircleOutlined />} 
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col span={8}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>Active Courses</div>
            <Progress 
              type="circle" 
              percent={activePercentage} 
              size={80} 
            />
          </div>
        </Col>
      </Row>

      <div style={{ marginTop: '24px' }}>
        <h4 style={{ marginBottom: '16px' }}>
          <LineChartOutlined /> Courses by HSK Level
        </h4>
        <List
          size="small"
          bordered
          dataSource={stats.coursesByHskLevel}
          renderItem={item => (
            <List.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>HSK {item.hskLevel}</span>
                <span>{item.count} courses</span>
              </div>
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
};

export default CourseStatsCard;