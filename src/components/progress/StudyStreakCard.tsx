"use client";

import React from "react";
import { Card, Statistic, Progress } from "antd";
import { FireOutlined, TrophyOutlined } from "@ant-design/icons";

interface StudyStreakCardProps {
  averageStreak: number;
  loading: boolean;
}

export default function StudyStreakCard({
  averageStreak,
  loading,
}: StudyStreakCardProps) {
  const progressPercent = Math.min((averageStreak / 30) * 100, 100);

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: "Xuất sắc", color: "#52c41a" };
    if (streak >= 20) return { level: "Tốt", color: "#1890ff" };
    if (streak >= 10) return { level: "Khá", color: "#faad14" };
    return { level: "Yếu", color: "#ff4d4f" };
  };

  const streakInfo = getStreakLevel(averageStreak);

  return (
    <Card
      loading={loading}
      title={
        <div>
          <FireOutlined /> Streak trung bình hệ thống
        </div>
      }
    >
      <div className="text-center">
        <Statistic
          title="Streak trung bình"
          value={averageStreak}
          precision={1}
          suffix="ngày"
          prefix={<FireOutlined className="text-orange-600" />}
          valueStyle={{ color: streakInfo.color, fontSize: "32px" }}
        />
      </div>
    </Card>
  );
}
  