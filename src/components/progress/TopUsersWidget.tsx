'use client';

import React from 'react';
import { Card, List, Avatar, Typography, Tag } from 'antd';
import { TrophyOutlined, CrownOutlined, MailOutlined } from '@ant-design/icons';
import { PlatformOverview } from '@/types/userprogressTypes';

const { Text } = Typography;

interface TopUsersWidgetProps {
  topUsers: PlatformOverview['topUsers'];
  loading: boolean;
}

export default function TopUsersWidget({ topUsers, loading }: TopUsersWidgetProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <CrownOutlined style={{ color: '#fadb14' }} />;
      case 1:
        return <TrophyOutlined style={{ color: '#d4edda' }} />;
      case 2:
        return <MailOutlined style={{ color: '#cd7f32' }} />;
      default:
        return null;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'gold';
      case 1:
        return 'silver';
      case 2:
        return 'bronze';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card
        title={
          <div>
            <TrophyOutlined /> Top người dùng theo streak
          </div>
        }
        loading={true}
      />
    );
  }

  if (!topUsers || topUsers.length === 0) {
    return (
      <Card
        title={
          <div>
            <TrophyOutlined /> Top người dùng theo streak
          </div>
        }
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="secondary">Chưa có dữ liệu người dùng</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div>
          <TrophyOutlined /> Top người dùng theo streak
        </div>
      }
    >
      <List
        itemLayout="horizontal"
        dataSource={topUsers}
        renderItem={(user, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <div style={{ position: 'relative' }}>
                  <Avatar size="large">
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  {index < 3 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        fontSize: '16px',
                      }}
                    >
                      {getRankIcon(index)}
                    </div>
                  )}
                </div>
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>{user.displayName || 'Unknown User'}</Text>
                  <Tag color={getRankColor(index)}>#{index + 1}</Tag>
                </div>
              }
              description={`Streak: ${user.metric || 0} ngày`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}