'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, List, Avatar, Typography, Tag, Spin, message, Button } from 'antd';
import { TrophyOutlined, BookOutlined, StarOutlined, EyeOutlined } from '@ant-design/icons';
import { LeaderboardData } from '@/types/userprogressTypes';
import { adminProgressApi } from '@/services/userprogressApi';
import UserDetailModal from './UserDetailModal';

const { Text } = Typography;

export default function LeaderboardTabs() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

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

  const handleViewUser = (userId: number, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
    setModalVisible(true);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <span className="text-2xl">🥇</span>;
      case 1:
        return <span className="text-2xl">🥈</span>;
      case 2:
        return <span className="text-2xl">🥉</span>;
      default:
        return (
          <div className="text-sm font-bold text-gray-500 min-w-[24px] text-center">
            #{index + 1}
          </div>
        );
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return '#FFD700'; // Vàng
      case 1:
        return '#C0C0C0'; // Bạc
      case 2:
        return '#CD7F32'; // Đồng
      default:
        return '#f0f0f0'; // Xám nhạt
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#f56565', '#9f7aea', '#ed8936', '#48bb78'];
    return colors[index % colors.length];
  };

  const renderUserList = (users: any[], metricKey: string, suffix: string = '', metricIcon?: React.ReactNode) => (
    <List
      itemLayout="horizontal"
      dataSource={users}
      renderItem={(user, index) => (
        <List.Item
          className={`p-3 rounded-lg mb-2 ${
            index < 3 
              ? `bg-opacity-20 border-2 ${
                  index === 0 ? 'bg-yellow-100 border-yellow-400' :
                  index === 1 ? 'bg-gray-100 border-gray-400' :
                  'bg-orange-100 border-orange-400'
                }`
              : 'border border-gray-100'
          }`}
          actions={[
            <Button 
              key="view"
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(user.userId, user.displayName)}
              className="text-blue-500"
            >
              Chi tiết
            </Button>
          ]}
        >
          <List.Item.Meta
            avatar={
              <div className="flex items-center gap-3">
                <div className="min-w-[32px] text-center">
                  {getRankIcon(index)}
                </div>
                <Avatar 
                  style={{ 
                    backgroundColor: getAvatarColor(index),
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                  size={40}
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
                {index < 3 && (
                  <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'orange'}>
                    Top {index + 1}
                  </Tag>
                )}
              </div>
            }
            description={
              <div className="flex items-center gap-1.5">
                {metricIcon}
                <span className={`text-sm font-bold ${index < 3 ? 'text-gray-800' : 'text-gray-400'}`}>
                  {user[metricKey] || 0}{suffix}
                </span>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  if (loading) {
    return (
      <Card title="🏆 Bảng xếp hạng">
        <div className="text-center p-10">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!leaderboard) {
    return (
      <Card title="🏆 Bảng xếp hạng">
        <div className="text-center p-10">
          <Text type="secondary">Không có dữ liệu</Text>
        </div>
      </Card>
    );
  }

  const tabItems = [
    {
      key: 'streak',
      label: (
        <span className="flex items-center gap-1.5">
          <TrophyOutlined className="text-yellow-500" />
          <span>Streak dài nhất</span>
        </span>
      ),
      children: renderUserList(
        leaderboard.byStreak || [], 
        'longestStreak', 
        ' ngày',
        <span className="text-red-500">🔥</span>
      ),
    },
    {
      key: 'lessons',
      label: (
        <span className="flex items-center gap-1.5">
          <BookOutlined className="text-green-500" />
          <span>Nhiều bài nhất</span>
        </span>
      ),
      children: renderUserList(
        leaderboard.byLessonsCompleted || [], 
        'lessonsCompleted', 
        ' bài',
        <span className="text-blue-500">📚</span>
      ),
    },
    {
      key: 'score',
      label: (
        <span className="flex items-center gap-1.5">
          <StarOutlined className="text-purple-600" />
          <span>Điểm cao nhất</span>
        </span>
      ),
      children: renderUserList(
        leaderboard.byAverageScore || [], 
        'averageScore', 
        '%',
        <span className="text-yellow-500">⭐</span>
      ),
    },
  ];

  return (
    <>
      <Card 
        title={
          <div className="flex items-center gap-2">
            <TrophyOutlined className="text-yellow-500 text-xl" />
            <span className="text-lg font-bold">Bảng xếp hạng</span>
          </div>
        }
        className="shadow-md rounded-lg"
      >
        <Tabs 
          items={tabItems} 
          size="large"
          tabBarStyle={{
            marginBottom: '24px'
          }}
        />
      </Card>

      <UserDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </>
  );
}