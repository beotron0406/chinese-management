"use client";

import React from "react";
import { Card, Statistic, Row, Col, Spin } from "antd";
import {
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  FireOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { PlatformOverview } from "@/types/userprogressTypes";

interface OverviewCardsProps {
  data: PlatformOverview | null;
  loading: boolean;
}

export default function OverviewCards({ data, loading }: OverviewCardsProps) {
  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Col xs={24} sm={12} lg={8} xl={4} key={i}>
            <Card>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin size="large" />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (!data) return null;

  const streakInfo = data.averageStreak;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8} xl={4}>
        <Card hoverable style={{ textAlign: "center" }}>
          <Statistic
            title="Tổng người dùng"
            value={data.totalUsers}
            prefix={<UserOutlined style={{ color: "#1890ff" }} />}
            valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={8} xl={4}>
        <Card hoverable style={{ textAlign: "center" }}>
          <Statistic
            title="Đang hoạt động"
            value={data.activeUsers}
            prefix={<UserOutlined style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={8} xl={4}>
        <Card hoverable style={{ textAlign: "center" }}>
          <Statistic
            title="Bài hoàn thành"
            value={data.totalCompletions}
            prefix={<CheckCircleOutlined style={{ color: "#722ed1" }} />}
            valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={8} xl={4}>
        <Card hoverable style={{ textAlign: "center" }}>
          <Statistic
            title="Điểm trung bình"
            value={data.averageScore}
            precision={1}
            suffix="%"
            prefix={<TrophyOutlined style={{ color: "#fa8c16" }} />}
            valueStyle={{ color: "#fa8c16", fontWeight: "bold" }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={8} xl={4}>
        <Card hoverable style={{ textAlign: "center" }}>
          <Statistic
            title="Streak TB"
            value={data.averageStreak}
            precision={1}
            suffix="ngày"
          />
        </Card>
      </Col>
    </Row>
  );
}
