'use client';

import React, { useState, useEffect } from 'react';
import { Card, Select, Row, Col, Statistic, Table, Spin, message } from 'antd';
import { FileTextOutlined, UserOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { LessonAnalytics } from '@/types/userprogressTypes';
import { adminProgressApi } from '@/services/userprogressApi';
import { Column } from '@ant-design/plots';

const { Option } = Select;

interface LessonAnalyticsCardProps {
  lessons?: Array<{ id: number; title: string; courseId: number }>;
}

export default function LessonAnalyticsCard({ lessons = [] }: LessonAnalyticsCardProps) {
  const [analytics, setAnalytics] = useState<LessonAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  // Default lessons if not provided
  const defaultLessons = [
    { id: 1, title: 'Introduction to Pinyin', courseId: 1 },
    { id: 2, title: 'Basic Tones', courseId: 1 },
    { id: 3, title: 'Simple Greetings', courseId: 1 },
    { id: 4, title: 'Numbers 1-10', courseId: 1 },
    { id: 5, title: 'Colors and Objects', courseId: 2 },
  ];

  const lessonList = lessons.length > 0 ? lessons : defaultLessons;

  useEffect(() => {
    if (lessonList.length > 0 && !selectedLessonId) {
      setSelectedLessonId(lessonList[0].id);
    }
  }, [lessonList]);

  useEffect(() => {
    if (selectedLessonId) {
      fetchLessonAnalytics(selectedLessonId);
    }
  }, [selectedLessonId]);

  const fetchLessonAnalytics = async (lessonId: number) => {
    try {
      setLoading(true);
      const data = await adminProgressApi.getLessonAnalytics(lessonId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching lesson analytics:', error);
      message.error('Không thể tải phân tích bài học');
    } finally {
      setLoading(false);
    }
  };

  const recentColumns = [
    {
      title: 'Học viên',
      dataIndex: 'displayName',
      key: 'displayName',
      width: '30%',
    },
    {
      title: 'Điểm số',
      dataIndex: 'scorePercentage',
      key: 'scorePercentage',
      width: '25%',
      render: (score: number) => (
        <span style={{ color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f' }}>
          {score}%
        </span>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: '45%',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
  ];

  const getScoreDistributionData = () => {
    if (!analytics) return [];
    return analytics.scoreDistribution.map(item => ({
      range: item.range,
      count: item.count,
    }));
  };

  const config = {
    data: getScoreDistributionData(),
    xField: 'range',
    yField: 'count',
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    color: '#1890ff',
    meta: {
      range: { alias: 'Khoảng điểm' },
      count: { alias: 'Số lượng' },
    },
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span><FileTextOutlined /> Phân tích bài học</span>
          <Select
            style={{ width: 250 }}
            placeholder="Chọn bài học"
            value={selectedLessonId}
            onChange={setSelectedLessonId}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
            }
          >
            {lessonList.map(lesson => (
              <Option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </Option>
            ))}
          </Select>
        </div>
      }
      loading={loading}
    >
      {analytics ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8}>
              <Statistic
                title="Tổng lượt hoàn thành"
                value={analytics.totalCompletions}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic
                title="Điểm trung bình"
                value={analytics.averageScore}
                precision={1}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ 
                  color: analytics.averageScore >= 80 ? '#52c41a' : 
                         analytics.averageScore >= 60 ? '#faad14' : '#ff4d4f' 
                }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <div>
                <div style={{ marginBottom: 8, color: '#666' }}>Độ khó bài học</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: analytics.averageScore >= 80 ? '#52c41a' : 
                         analytics.averageScore >= 60 ? '#faad14' : '#ff4d4f' 
                }}>
                  {analytics.averageScore >= 80 ? '🟢 Dễ' : 
                   analytics.averageScore >= 60 ? '🟡 Trung bình' : '🔴 Khó'}
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Phân bố điểm số" size="small">
                <Column {...config} height={200} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Hoàn thành gần đây" size="small">
                <Table
                  columns={recentColumns}
                  dataSource={analytics.recentCompletions.map((completion, index) => ({
                    ...completion,
                    key: index,
                  }))}
                  pagination={false}
                  size="small"
                  scroll={{ y: 200 }}
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      )}
    </Card>
  );
}