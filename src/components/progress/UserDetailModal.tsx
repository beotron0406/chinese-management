"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  Progress,
  Spin,
  message,
} from "antd";
import {
  UserOutlined,
  TrophyOutlined,
  FireOutlined,
  BookOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { UserProgressDetail } from "@/types/userprogressTypes";
import { adminProgressApi } from "@/services/userprogressApi";

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number | null;
  userName?: string;
}

export default function UserDetailModal({
  visible,
  onClose,
  userId,
  userName,
}: UserDetailModalProps) {
  const [userDetail, setUserDetail] = useState<UserProgressDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      fetchUserDetail(userId);
    }
  }, [visible, userId]);

  const fetchUserDetail = async (id: number) => {
    try {
      setLoading(true);
      const data = await adminProgressApi.getUserProgress(id);
      setUserDetail(data);
    } catch (error) {
      console.error("Error fetching user detail:", error);
      message.error("Không thể tải chi tiết người dùng");
    } finally {
      setLoading(false);
    }
  };

  const lessonColumns = [
    {
      title: "Bài học",
      dataIndex: "lessonTitle",
      key: "lessonTitle",
      width: "25%",
    },
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      width: "25%",
    },
    {
      title: "Điểm số",
      dataIndex: "scorePercentage",
      key: "scorePercentage",
      width: "15%",
      render: (score: number) => (
        <Tag color={score >= 80 ? "green" : score >= 60 ? "orange" : "red"}>
          {score}%
        </Tag>
      ),
    },
    {
      title: "Hoàn thành",
      dataIndex: "completedAt",
      key: "completedAt",
      width: "35%",
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
  ];

  const courseColumns = [
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      width: "40%",
    },
    {
      title: "Tiến trình",
      key: "progress",
      width: "30%",
      render: (record: any) => (
        <Progress
          percent={Math.round(
            (record.completedLessons / record.totalLessons) * 100
          )}
          size="small"
          format={() => `${record.completedLessons}/${record.totalLessons}`}
        />
      ),
    },
    {
      title: "Điểm TB",
      dataIndex: "averageScore",
      key: "averageScore",
      width: "30%",
      render: (score: number) => (
        <span
          className={
            score >= 80
              ? "text-green-500"
              : score >= 60
                ? "text-yellow-500"
                : "text-red-500"
          }
        >
          {score.toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <UserOutlined className="text-blue-500" />
          <span>
            Chi tiết học viên: {userName || userDetail?.user.displayName}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnClose
    >
      {loading ? (
        <div className="text-center p-10">
          <Spin size="large" />
        </div>
      ) : userDetail ? (
        <>
          {/* User Info */}
          <Descriptions bordered column={2} className="mb-6">
            <Descriptions.Item label="Tên hiển thị" span={1}>
              {userDetail.user.displayName}
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={1}>
              {userDetail.user.email}
            </Descriptions.Item>
            <Descriptions.Item label="Cấp độ HSK" span={1}>
              <Tag color="blue">HSK {userDetail.user.currentHskLevel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày học gần nhất" span={1}>
              {userDetail.studyInfo.lastStudyDate
                ? new Date(
                    userDetail.studyInfo.lastStudyDate
                  ).toLocaleDateString("vi-VN")
                : "Chưa học"}
            </Descriptions.Item>
          </Descriptions>

          {/* Study Statistics */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={12} sm={6}>
              <Statistic
                title="Streak hiện tại"
                value={userDetail.studyInfo.currentStreak}
                suffix="ngày"
                prefix={<FireOutlined className="text-orange-500" />}
                className="[&_.ant-statistic-content-value]:!text-orange-500"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Streak dài nhất"
                value={userDetail.studyInfo.longestStreak}
                suffix="ngày"
                prefix={<TrophyOutlined className="text-yellow-400" />}
                className="[&_.ant-statistic-content-value]:!text-yellow-400"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Tổng ngày học"
                value={userDetail.studyInfo.totalStudyDays}
                suffix="ngày"
                prefix={<CalendarOutlined className="text-green-500" />}
                className="[&_.ant-statistic-content-value]:!text-green-500"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Bài hoàn thành"
                value={userDetail.completedLessons.length}
                suffix="bài"
                prefix={<BookOutlined className="text-blue-500" />}
                className="[&_.ant-statistic-content-value]:!text-blue-500"
              />
            </Col>
          </Row>

          {/* Course Progress */}
          <div className="mb-6">
            <h3 className="font-semibold text-base mb-3">
              Tiến trình khóa học
            </h3>
            <Table
              columns={courseColumns}
              dataSource={userDetail.courseBreakdown.map((course) => ({
                ...course,
                key: course.courseId,
              }))}
              pagination={false}
              size="small"
            />
          </div>

          {/* Recent Lessons */}
          <div>
            <h3 className="font-semibold text-base mb-3">Bài học gần đây</h3>
            <Table
              columns={lessonColumns}
              dataSource={userDetail.completedLessons
                .sort(
                  (a, b) =>
                    new Date(b.completedAt).getTime() -
                    new Date(a.completedAt).getTime()
                )
                .slice(0, 10)
                .map((lesson, index) => ({
                  ...lesson,
                  key: index,
                }))}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </div>
        </>
      ) : null}
    </Modal>
  );
}
