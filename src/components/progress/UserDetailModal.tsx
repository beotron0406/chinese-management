'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Table, Tag, Row, Col, Statistic, Progress, Spin, message } from 'antd';
import { UserOutlined, TrophyOutlined, FireOutlined, BookOutlined, CalendarOutlined } from '@ant-design/icons';
import { UserProgressDetail } from '@/types/userprogressTypes';
import { adminProgressApi } from '@/services/userprogressApi';

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number | null;
  userName?: string;
}

export default function UserDetailModal({ visible, onClose, userId, userName }: UserDetailModalProps) {
  const [userDetail, setUserDetail] = useState<UserProgressDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      fetchUserDetail(userId);
    }
  }, [visible, userId]);

  const fetchUserDetail = async (id: number) => {
    try {
      setLoading(true);
      const data = await adminProgressApi.getUserProgress(id);
      setUserDetail(data);
    } catch (error) {
      console.error('Error fetching user detail:', error);
      message.error('Không thể tải chi tiết người dùng');
    } finally {
      setLoading(false);
    }
  };

  const lessonColumns = [
    {
      title: 'Bài học',
      dataIndex: 'lessonTitle',
      key: 'lessonTitle',
      width: '25%',
    },
    {
      title: 'Khóa học',
      dataIndex: 'courseTitle',
      key: 'courseTitle',
      width: '25%',
    },
    {
      title: 'Điểm số',
      dataIndex: 'scorePercentage',
      key: 'scorePercentage',
      width: '15%',
      render: (score: number) => (
        <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
          {score}%
        </Tag>
      ),
    },
    {
      title: 'Hoàn thành',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: '35%',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
  ];

  const courseColumns = [
    {
      title: 'Khóa học',
      dataIndex: 'courseTitle',
      key: 'courseTitle',
      width: '40%',
    },
    {
      title: 'Tiến trình',
      key: 'progress',
      width: '30%',
      render: (record: any) => (
        <Progress 
          percent={Math.round((record.completedLessons / record.totalLessons) * 100)}
          size="small"
          format={() => `${record.completedLessons}/${record.totalLessons}`}
        />
      ),
    },
    {
      title: 'Điểm TB',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: '30%',
      render: (score: number) => (
        <span style={{ color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f' }}>
          {score.toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div>
          <UserOutlined /> Chi tiết học viên: {userName || userDetail?.user.displayName}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : userDetail ? (
        <>
          {/* User Info */}
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Tên hiển thị" span={1}>
              {userDetail.user.displayName}
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={1}>
              {userDetail.user.email}
            </Descriptions.Item>
            <Descriptions.Item label="Cấp độ HSK" span={1}>
              <Tag color="blue">HSK {userDetail.user.currentHskLevel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày học gần nhất" span={1}>
              {userDetail.studyInfo.lastStudyDate ? 
                new Date(userDetail.studyInfo.lastStudyDate).toLocaleDateString('vi-VN') : 
                'Chưa học'
              }
            </Descriptions.Item>
          </Descriptions>

          {/* Study Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Streak hiện tại"
                value={userDetail.studyInfo.currentStreak}
                suffix="ngày"
                prefix={<FireOutlined style={{ color: '#fa541c' }} />}
                valueStyle={{ color: '#fa541c' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Streak dài nhất"
                value={userDetail.studyInfo.longestStreak}
                suffix="ngày"
                prefix={<TrophyOutlined style={{ color: '#fadb14' }} />}
                valueStyle={{ color: '#fadb14' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Tổng ngày học"
                value={userDetail.studyInfo.totalStudyDays}
                suffix="ngày"
                prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Bài hoàn thành"
                value={userDetail.completedLessons.length}
                suffix="bài"
                prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>

          {/* Course Progress */}
          <div style={{ marginBottom: 24 }}>
            <h3>Tiến trình khóa học</h3>
            <Table
              columns={courseColumns}
              dataSource={userDetail.courseBreakdown.map(course => ({
                ...course,
                key: course.courseId,
              }))}
              pagination={false}
              size="small"
            />
          </div>

          {/* Recent Lessons */}
          <div>
            <h3>Bài học gần đây</h3>
            <Table
              columns={lessonColumns}
              dataSource={userDetail.completedLessons
                .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .slice(0, 10)
                .map((lesson, index) => ({
                  ...lesson,
                  key: index,
                }))}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </div>
        </>
      ) : null}
    </Modal>
  );
}