"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, Typography, message, Space, Tabs } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { PlatformOverview } from "@/types/userprogressTypes";
import { adminProgressApi } from "@/services/userprogressApi";
import OverviewCards from "@/components/progress/OverviewCards";
import TopUsersWidget from "@/components/progress/TopUsersWidget";
import LeaderboardTabs from "@/components/progress/LeaderboardTabs";
import CourseAnalyticsCard from "@/components/progress/CourseAnalyticsCard";
import LessonAnalyticsCard from "@/components/progress/LessonAnalyticsCard";

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

        const data = await adminProgressApi.getOverview();

        if (data !== null && data !== undefined) {
          const safeData: PlatformOverview = {
            totalUsers: data.totalUsers || 0,
            activeUsers: data.activeUsers || 0,
            totalCompletions: data.totalCompletions || 0,
            averageScore: data.averageScore || 0,
            averageStreak: data.averageStreak || 0,
            topUsers: data.topUsers || [],
          };

          setOverview(safeData);
        } else {
          throw new Error("API trả về dữ liệu null/undefined");
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải dữ liệu tổng quan";
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
      <div style={{ padding: "24px" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title level={2}>Dashboard - Quản lý hệ thống học tập</Title>
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              background: "#fff2f0",
              border: "1px solid #ffccc7",
              borderRadius: "6px",
            }}
          >
            <Typography.Text type="danger" style={{ fontSize: "16px" }}>
              {error}
            </Typography.Text>
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#1890ff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Thử lại
              </button>
            </div>
          </div>
        </Space>
      </div>
    );
  }

  const tabItems = [
    {
      key: "overview",
      label: (
        <span>
          <DashboardOutlined /> Tổng quan
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* 1. Platform Overview */}
          <OverviewCards data={overview} loading={loading} />

          <Row gutter={[16, 16]}>
            {/* Top Users */}
            <Col xs={24} lg={12}>
              <TopUsersWidget
                topUsers={overview?.topUsers || []}
                loading={loading}
              />
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: "leaderboard",
      label: (
        <span>
          <TrophyOutlined /> Bảng xếp hạng
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <LeaderboardTabs />
        </Space>
      ),
    },
    {
      key: "course-analytics",
      label: (
        <span>
          <BookOutlined /> Phân tích khóa học
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <CourseAnalyticsCard />
        </Space>
      ),
    },
    {
      key: "lesson-analytics",
      label: (
        <span>
          <FileTextOutlined /> Phân tích bài học
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <LessonAnalyticsCard />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={2}>Dashboard - Quản lý hệ thống học tập</Title>
        </div>

        <Tabs items={tabItems} defaultActiveKey="overview" size="large" />
      </Space>
    </div>
  );
}
