'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Space } from 'antd';
import { PlatformOverview } from '@/types/userprogressTypes';
import { adminProgressApi } from '@/services/userprogressApi';
import OverviewCards from '@/components/progress/OverviewCards';
import TopUsersWidget from '@/components/progress/TopUsersWidget';
import LeaderboardTabs from '@/components/progress/LeaderboardTabs';
import StudyStreakCard from './StudyStreakCard';

const { Title } = Typography;

export default function DashboardPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const data = await adminProgressApi.getOverview();
        setOverview(data);
      } catch (error) {
        message.error('Không thể tải dữ liệu tổng quan');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

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