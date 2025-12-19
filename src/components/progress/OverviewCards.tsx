"use client";

import React from "react";
import { Card, Statistic, Spin } from "antd";
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="min-w-0">
            <div className="text-center p-5">
              <Spin size="large" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      title: "Tổng người dùng",
      value: data.totalUsers,
      icon: <UserOutlined className="text-blue-500" />,
      color: "#1890ff",
    },
    {
      title: "Đang hoạt động",
      value: data.activeUsers,
      icon: <UserOutlined className="text-green-500" />,
      color: "#52c41a",
    },
    {
      title: "Bài hoàn thành",
      value: data.totalCompletions,
      icon: <CheckCircleOutlined className="text-purple-600" />,
      color: "#722ed1",
    },
    {
      title: "Điểm trung bình",
      value: data.averageScore,
      precision: 1,
      suffix: "%",
      icon: <TrophyOutlined className="text-orange-500" />,
      color: "#fa8c16",
    },
    {
      title: "Streak TB",
      value: data.averageStreak,
      precision: 1,
      suffix: "ngày",
      icon: <FireOutlined className="text-red-500" />,
      color: "#f5222d",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <Card key={index} hoverable className="text-center min-w-0">
          <Statistic
            title={card.title}
            value={card.value}
            precision={card.precision}
            suffix={card.suffix}
            prefix={card.icon}
            valueStyle={{ color: card.color, fontWeight: "bold", fontSize: "20px" }}
          />
        </Card>
      ))}
    </div>
  );
}
