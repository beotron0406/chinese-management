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
    if (streak >= 30) return { level: "Xuất sắc", valueClassName: "!text-green-500 !text-3xl" };
    if (streak >= 20) return { level: "Tốt", valueClassName: "!text-blue-500 !text-3xl" };
    if (streak >= 10) return { level: "Khá", valueClassName: "!text-yellow-500 !text-3xl" };
    return { level: "Yếu", valueClassName: "!text-red-500 !text-3xl" };
  };

  const streakInfo = getStreakLevel(averageStreak);

  return (
    <Card
      loading={loading}
      title={
        <div className="flex items-center gap-2">
          <FireOutlined className="text-orange-500" />
          <span className="font-bold">Streak trung bình hệ thống</span>
        </div>
      }
    >
      <div className="text-center">
        <Statistic
          title="Streak trung bình"
          value={averageStreak}
          precision={1}
          suffix="ngày"
          prefix={<FireOutlined className="text-orange-500" />}
          className={`[&_.ant-statistic-content-value]:${streakInfo.valueClassName}`}
        />
      </div>
    </Card>
  );
}
  