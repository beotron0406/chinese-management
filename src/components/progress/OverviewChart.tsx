"use client";

import React from "react";
import { Card, Spin } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import { Column } from "@ant-design/plots";
import { PlatformOverview } from "@/types/userprogressTypes";

interface OverviewChartProps {
  data: PlatformOverview | null;
  loading: boolean;
}

export default function OverviewChart({ data, loading }: OverviewChartProps) {
  if (loading) {
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-blue-500 text-lg" />
            <span className="font-bold">Biểu đồ tổng quan</span>
          </div>
        }
        className="rounded-lg shadow-sm"
      >
        <div className="text-center p-10">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const chartData = [
    {
      category: "Tổng người dùng",
      value: data.totalUsers,
      type: "users",
    },
    {
      category: "Đang hoạt động",
      value: data.activeUsers,
      type: "users",
    },
    {
      category: "Bài hoàn thành",
      value: data.totalCompletions,
      type: "completions",
    },
    {
      category: "Điểm TB (%)",
      value: data.averageScore,
      type: "score",
    },
    {
      category: "Streak TB (ngày)",
      value: Math.round(data.averageStreak * 10) / 10,
      type: "streak",
    },
  ];

  const config = {
    data: chartData,
    xField: "category",
    yField: "value",
    colorField: "category",
    color: ["#1890ff", "#52c41a", "#722ed1", "#fa8c16", "#f5222d"],
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
    label: {
      text: (d: any) => `${d.value}`,
      textBaseline: "bottom" as const,
      style: {
        fontWeight: "bold",
        fontSize: 12,
      },
    },
    axis: {
      x: {
        title: false,
        labelAutoRotate: true,
        labelFormatter: (text: string) => {
          // Truncate long labels on mobile
          if (text.length > 12) {
            return text.substring(0, 10) + "...";
          }
          return text;
        },
      },
      y: {
        title: false,
        grid: true,
      },
    },
    legend: false,
    tooltip: {
      title: "category",
      items: [
        {
          channel: "y",
          name: "Giá trị",
          valueFormatter: (value: number) => value.toLocaleString("vi-VN"),
        },
      ],
    },
    interaction: {
      elementHighlight: true,
    },
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <BarChartOutlined className="text-blue-500 text-lg" />
          <span className="font-bold">Biểu đồ tổng quan</span>
        </div>
      }
      className="rounded-lg shadow-sm"
    >
      <Column {...config} height={300} />
    </Card>
  );
}
