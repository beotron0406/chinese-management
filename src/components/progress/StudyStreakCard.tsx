'use client';

import React from 'react';
import { Card, Statistic, Progress } from 'antd';
import { FireOutlined, TrophyOutlined } from '@ant-design/icons';

interface StudyStreakCardProps {
  averageStreak: number;
  loading: boolean;
}

export default function StudyStreakCard({ averageStreak, loading }: StudyStreakCardProps) {
  // Calculate progress percentage (assuming 30 days is 100%)
  const progressPercent = Math.min((averageStreak / 30) * 100, 100);
  
  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: 'Xuất sắc', color: '#52c41a' };
    if (streak >= 20) return { level: 'Tốt', color: '#1890ff' };
    if (streak >= 10) return { level: 'Khá', color: '#faad14' };
    return { level: 'Cần cải thiện', color: '#ff4d4f' };
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
      <div style={{ textAlign: 'center' }}>
        <Statistic
          title="Streak trung bình"
          value={averageStreak}
          precision={1}
          suffix="ngày"
          prefix={<FireOutlined style={{ color: '#fa541c' }} />}
          valueStyle={{ color: streakInfo.color, fontSize: '32px' }}
        />
        
        <div style={{ marginTop: 16 }}>
          <Progress
            type="circle"
            percent={progressPercent}
            format={() => streakInfo.level}
            strokeColor={streakInfo.color}
            size={120}
          />
        </div>

        <div style={{ marginTop: 16, color: '#666' }}>
          <TrophyOutlined /> Mục tiêu: 30 ngày streak
        </div>
      </div>
    </Card>
  );
}