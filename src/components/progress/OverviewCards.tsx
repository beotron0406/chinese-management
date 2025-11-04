'use client';

import React from 'react';
import { Card, Statistic, Row, Col, Spin } from 'antd';
import { UserOutlined, BookOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import { PlatformOverview } from '@/types/userprogressTypes';

interface OverviewCardsProps {
  data: PlatformOverview | null;
  loading: boolean;
}

export default function OverviewCards({ data, loading }: OverviewCardsProps) {
  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card>
              <Spin size="large" />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (!data) return null;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tổng số người dùng"
            value={data.totalUsers}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Người dùng hoạt động"
            value={data.activeUsers}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tổng bài học hoàn thành"
            value={data.totalCompletions}
            prefix={<BookOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Điểm trung bình"
            value={data.averageScore}
            precision={1}
            suffix="%"
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
    </Row>
  );
}