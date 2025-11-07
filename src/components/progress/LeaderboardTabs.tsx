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
        return <span style={{ fontSize: '24px' }}>🥇</span>;
      case 1:
        return <span style={{ fontSize: '24px' }}>🥈</span>;
      case 2:
        return <span style={{ fontSize: '24px' }}>🥉</span>;
      default:
        return (
          <div 
            style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#666',
              minWidth: '24px',
              textAlign: 'center'
            }}
          >
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
          style={{
            padding: '12px 16px',
            backgroundColor: index < 3 ? getRankColor(index) + '20' : 'transparent',
            borderRadius: '8px',
            marginBottom: '8px',
            border: index < 3 ? `2px solid ${getRankColor(index)}` : '1px solid #f0f0f0'
          }}
          actions={[
            <Button 
              key="view"
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(user.userId, user.displayName)}
              style={{ color: '#1890ff' }}
            >
              Chi tiết
            </Button>
          ]}
        >
          <List.Item.Meta
            avatar={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: '32px', textAlign: 'center' }}>
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
                {index < 3 && (
                  <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'orange'}>
                    Top {index + 1}
                  </Tag>
                )}
              </div>
            }
            description={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {metricIcon}
                <span style={{ 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: index < 3 ? '#333' : '#888'
                }}>
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
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!leaderboard) {
    return (
      <Card title="🏆 Bảng xếp hạng">
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <span>Streak dài nhất</span>
        </span>
      ),
      children: renderUserList(
        leaderboard.byStreak || [], 
        'longestStreak', 
        ' ngày',
        <span style={{ color: '#ff4d4f' }}>🔥</span>
      ),
    },
    {
      key: 'lessons',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOutlined style={{ color: '#52c41a' }} />
          <span>Nhiều bài nhất</span>
        </span>
      ),
      children: renderUserList(
        leaderboard.byLessonsCompleted || [], 
        'lessonsCompleted', 
        ' bài',
        <span style={{ color: '#1890ff' }}>📚</span>
      ),
    },
    {
      key: 'score',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StarOutlined style={{ color: '#722ed1' }} />
          <span>Điểm cao nhất</span>
        </span>
      ),
      children: renderUserList(
        leaderboard.byAverageScore || [], 
        'averageScore', 
        '%',
        <span style={{ color: '#faad14' }}>⭐</span>
      ),
    },
  ];

  return (
    <>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Bảng xếp hạng</span>
          </div>
        }
        style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
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