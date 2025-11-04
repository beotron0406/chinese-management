'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, List, Avatar, Typography, Tag, Spin, message } from 'antd';
import { TrophyOutlined, BookOutlined, StarOutlined } from '@ant-design/icons';
import { LeaderboardData } from '@/types/userprogressTypes';
import { adminProgressApi } from '@/services/userprogressApi';

const { Text } = Typography;

export default function LeaderboardTabs() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await adminProgressApi.getLeaderboard(10);
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        message.error('Không thể tải bảng xếp hạng');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}.`;
    }
  };

  const renderUserList = (users: any[], metricKey: string, suffix: string = '') => (
    <List
      itemLayout="horizontal"
      dataSource={users}
      renderItem={(user, index) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '18px', minWidth: '30px' }}>
                  {getRankIcon(index)}
                </span>
                <Avatar>{user.displayName?.charAt(0)?.toUpperCase() || 'U'}</Avatar>
              </div>
            }
            title={<Text strong>{user.displayName || 'Unknown User'}</Text>}
            description={`${user[metricKey] || 0}${suffix}`}
          />
        </List.Item>
      )}
    />
  );

  if (loading) {
    return (
      <Card title="Bảng xếp hạng">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!leaderboard) {
    return (
      <Card title="Bảng xếp hạng">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="secondary">Không có dữ liệu</Text>
        </div>
      </Card>
    );
  }

  const tabItems = [
    {
      key: 'streak',
      label: (
        <span>
          <TrophyOutlined /> Streak dài nhất
        </span>
      ),
      children: renderUserList(leaderboard.byStreak || [], 'longestStreak', ' ngày'),
    },
    {
      key: 'lessons',
      label: (
        <span>
          <BookOutlined /> Nhiều bài nhất
        </span>
      ),
      children: renderUserList(leaderboard.byLessonsCompleted || [], 'lessonsCompleted', ' bài'),
    },
    {
      key: 'score',
      label: (
        <span>
          <StarOutlined /> Điểm cao nhất
        </span>
      ),
      children: renderUserList(leaderboard.byAverageScore || [], 'averageScore', '%'),
    },
  ];

  return (
    <Card title="Bảng xếp hạng" extra={<TrophyOutlined />}>
      <Tabs items={tabItems} />
    </Card>
  );
}