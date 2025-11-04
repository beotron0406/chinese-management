'use client';

import React from 'react';
import { Card, List, Avatar, Typography, Tag } from 'antd';
import { TrophyOutlined, CrownOutlined, MailOutlined } from '@ant-design/icons';
import { PlatformOverview } from '@/types/userprogressTypes';

const { Text, Title } = Typography;

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

  return (
    <Card
      title={
        <div>
          <TrophyOutlined /> Top người dùng theo streak
        </div>
      }
      loading={loading}
    >
      <List
        itemLayout="horizontal"
        dataSource={topUsers}
        renderItem={(user, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <div style={{ position: 'relative' }}>
                  <Avatar size="large">{user.displayName.charAt(0).toUpperCase()}</Avatar>
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
                  <Text strong>{user.displayName}</Text>
                  <Tag color={getRankColor(index)}>#{index + 1}</Tag>
                </div>
              }
              description={`Streak: ${user.metric} ngày`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}