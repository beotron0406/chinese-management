'use client';

import React from 'react';
import { Card, List, Avatar, Typography, Tag } from 'antd';
import { TrophyOutlined, CrownOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
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
        return <span style={{ fontSize: '20px' }}>🥇</span>; // Vàng
      case 1:
        return <span style={{ fontSize: '20px' }}>🥈</span>; // Bạc
      case 2:
        return <span style={{ fontSize: '20px' }}>🥉</span>; // Đồng
      default:
        return null;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'gold';
      case 1:
        return 'cyan';
      case 2:
        return 'orange';
      default:
        return 'default';
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      '#FFD700', // Vàng cho #1
      '#C0C0C0', // Bạc cho #2  
      '#CD7F32', // Đồng cho #3
      '#87CEEB', // Sky blue
      '#DDA0DD', // Plum
      '#98FB98', // Pale green
      '#F0E68C', // Khaki
      '#FF69B4'  // Hot pink
    ];
    return colors[index] || '#1890ff';
  };

  const getBackgroundColor = (index: number) => {
    switch (index) {
      case 0:
        return '#FFF7E6'; // Vàng nhạt
      case 1:
        return '#E6FFFB'; // Cyan nhạt
      case 2:
        return '#FFF2E8'; // Cam nhạt
      default:
        return '#FAFAFA'; // Xám nhạt
    }
  };

  const getBorderColor = (index: number) => {
    switch (index) {
      case 0:
        return '#FFD700'; // Vàng
      case 1:
        return '#13C2C2'; // Cyan
      case 2:
        return '#FA8C16'; // Cam
      default:
        return '#F0F0F0'; // Xám
    }
  };

  if (loading) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined style={{ color: '#faad14', fontSize: '18px' }} />
            <span style={{ fontWeight: 'bold' }}>Top người dùng theo streak</span>
          </div>
        }
        loading={true}
        style={{ borderRadius: '8px' }}
      />
    );
  }

  if (!topUsers || topUsers.length === 0) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined style={{ color: '#faad14', fontSize: '18px' }} />
            <span style={{ fontWeight: 'bold' }}>Top người dùng theo streak</span>
          </div>
        }
        style={{ borderRadius: '8px' }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ color: '#faad14', fontSize: '18px' }} />
          <span style={{ fontWeight: 'bold' }}>Top người dùng theo streak</span>
        </div>
      }
      style={{ 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <List
        itemLayout="horizontal"
        dataSource={topUsers}
        renderItem={(user, index) => (
          <List.Item
            style={{
              backgroundColor: getBackgroundColor(index),
              border: `2px solid ${getBorderColor(index)}`,
              borderRadius: '8px',
              marginBottom: '8px',
              padding: '12px 16px',
              transition: 'all 0.3s ease'
            }}
          >
            <List.Item.Meta
              avatar={
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Rank number hoặc medal */}
                  <div style={{ minWidth: '32px', textAlign: 'center' }}>
                    {index < 3 ? (
                      getRankIcon(index)
                    ) : (
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#666',
                        fontSize: '16px' 
                      }}>
                        #{index + 1}
                      </div>
                    )}
                  </div>
                  
                  {/* Avatar */}
                  <Avatar 
                    size="large" 
                    style={{ 
                      backgroundColor: getAvatarColor(index),
                      fontSize: '16px',
                      fontWeight: 'bold',
                      border: index < 3 ? `2px solid ${getBorderColor(index)}` : 'none'
                    }}
                  >
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                </div>
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text 
                    strong 
                    style={{ 
                      fontSize: '16px',
                      color: index < 3 ? '#333' : '#666'
                    }}
                  >
                    {user.displayName || 'Unknown User'}
                  </Text>
                  <Tag 
                    color={getRankColor(index)}
                    style={{ fontWeight: 'bold' }}
                  >
                    #{index + 1}
                  </Tag>
                </div>
              }
              description={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FireOutlined style={{ color: '#ff4d4f' }} />
                  <Text style={{ 
                    fontWeight: 'bold',
                    color: index < 3 ? '#333' : '#888'
                  }}>
                    Streak: {user.metric || 0} ngày
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}