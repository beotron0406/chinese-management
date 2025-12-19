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
          <div className="flex items-center gap-2">
            <TrophyOutlined className="text-yellow-500 text-lg" />
            <span className="font-bold">Top người dùng theo streak</span>
          </div>
        }
        loading={true}
        className="rounded-lg"
      />
    );
  }

  if (!topUsers || topUsers.length === 0) {
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <TrophyOutlined className="text-yellow-500 text-lg" />
            <span className="font-bold">Top người dùng theo streak</span>
          </div>
        }
        className="rounded-lg"
      >
        <div className="text-center p-5">
          <Text type="secondary">Chưa có dữ liệu người dùng</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <TrophyOutlined className="text-yellow-500 text-lg" />
          <span className="font-bold">Top người dùng theo streak</span>
        </div>
      }
      className="rounded-lg shadow-md"
    >
      <List
        itemLayout="horizontal"
        dataSource={topUsers}
        renderItem={(user, index) => (
          <List.Item
            className={`rounded-lg mb-2 px-4 py-3 transition-all duration-300 ${
              index === 0 ? 'bg-yellow-50 border-2 border-yellow-400' :
              index === 1 ? 'bg-cyan-50 border-2 border-cyan-400' :
              index === 2 ? 'bg-orange-50 border-2 border-orange-400' :
              'bg-gray-50 border border-gray-200'
            }`}
          >
            <List.Item.Meta
              avatar={
                <div className="relative flex items-center gap-3">
                  {/* Rank number or medal */}
                  <div className="min-w-[32px] text-center">
                    {index < 3 ? (
                      getRankIcon(index)
                    ) : (
                      <div className="font-bold text-gray-500 text-base">
                        #{index + 1}
                      </div>
                    )}
                  </div>
                  
                  {/* Avatar */}
                  <Avatar 
                    size="large" 
                    style={{ 
                      backgroundColor: getAvatarColor(index),
                      border: index < 3 ? `2px solid ${getBorderColor(index)}` : 'none'
                    }}
                    className="text-base font-bold"
                  >
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                </div>
              }
              title={
                <div className="flex items-center gap-2">
                  <Text 
                    strong 
                    className={`text-base ${index < 3 ? 'text-gray-800' : 'text-gray-500'}`}
                  >
                    {user.displayName || 'Unknown User'}
                  </Text>
                  <Tag 
                    color={getRankColor(index)}
                    className="font-bold"
                  >
                    #{index + 1}
                  </Tag>
                </div>
              }
              description={
                <div className="flex items-center gap-1.5">
                  <FireOutlined className="text-red-500" />
                  <Text className={`font-bold ${index < 3 ? 'text-gray-800' : 'text-gray-400'}`}>
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