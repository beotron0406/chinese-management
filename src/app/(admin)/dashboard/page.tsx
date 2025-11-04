'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Space } from 'antd';
import { PlatformOverview } from '@/types/userprogressTypes';
import { adminProgressApi } from '@/services/userprogressApi';
import OverviewCards from '@/components/progress/OverviewCards';
import TopUsersWidget from '@/components/progress/TopUsersWidget';
import LeaderboardTabs from '@/components/progress/LeaderboardTabs';
import StudyStreakCard from '@/components/progress/StudyStreakCard';

const { Title } = Typography;

export default function DashboardPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching dashboard overview...');
        const data = await adminProgressApi.getOverview();
        console.log('✅ Dashboard data received:', data);
        
        setOverview(data);
      } catch (error: any) {
        console.error('❌ Dashboard fetch error:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu tổng quan';
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (error && !loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Dashboard - Tổng quan hệ thống</Title>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Typography.Text type="danger">
              {error}
            </Typography.Text>
          </div>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>Dashboard - Tổng quan hệ thống</Title>
        </div>

        {/* Overview Cards */}
        <OverviewCards data={overview} loading={loading} />

        <Row gutter={[16, 16]}>
          {/* Top Users */}
          <Col xs={24} lg={12}>
            <TopUsersWidget 
              topUsers={overview?.topUsers || []} 
              loading={loading} 
            />
          </Col>

          {/* Study Streak Summary */}
          <Col xs={24} lg={12}>
            <StudyStreakCard 
              averageStreak={overview?.averageStreak || 0}
              loading={loading}
            />
          </Col>
        </Row>

        {/* Leaderboard */}
        <Row>
          <Col span={24}>
            <LeaderboardTabs />
          </Col>
        </Row>
      </Space>
    </div>
  );
}