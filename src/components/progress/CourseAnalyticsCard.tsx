"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Spin,
  message,
} from "antd";
import {
  BookOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { CourseAnalytics } from "@/types/userprogressTypes";
import { adminProgressApi } from "@/services/userprogressApi";
import CourseSelect from "@/components/shared/button/CourseSelect";
import { Course } from "@/types";

interface CourseAnalyticsCardProps {}

export default function CourseAnalyticsCard({}: CourseAnalyticsCardProps) {
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(
    undefined
  );

  // Auto-select first course when courses are loaded
  const handleCoursesLoaded = (courses: Course[]) => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseAnalytics(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourseAnalytics = async (courseId: number) => {
    try {
      setLoading(true);
      const data = await adminProgressApi.getCourseAnalytics(courseId);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching course analytics:", error);
      message.error("Không thể tải phân tích khóa học");
    } finally {
      setLoading(false);
    }
  };

  const lessonColumns = [
    {
      title: "Bài học",
      dataIndex: "lessonTitle",
      key: "lessonTitle",
      width: "40%",
    },
    {
      title: "Hoàn thành",
      dataIndex: "completionCount",
      key: "completionCount",
      width: "20%",
      render: (count: number) => (
        <span>
          <UserOutlined /> {count} người
        </span>
      ),
    },
    {
      title: "Điểm TB",
      dataIndex: "averageScore",
      key: "averageScore",
      width: "20%",
      render: (score: number) => (
        <span
          style={{
            color:
              score >= 80 ? "#52c41a" : score >= 60 ? "#faad14" : "#ff4d4f",
          }}
        >
          {score.toFixed(1)}%
        </span>
      ),
    },
    {
      title: "Độ khó",
      key: "difficulty",
      width: "20%",
      render: (record: any) => {
        const difficulty =
          record.averageScore >= 80
            ? "Dễ"
            : record.averageScore >= 60
              ? "Trung bình"
              : "Khó";
        const color =
          record.averageScore >= 80
            ? "green"
            : record.averageScore >= 60
              ? "orange"
              : "red";
        return <span style={{ color }}>{difficulty}</span>;
      },
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span>
            <BookOutlined /> Phân tích khóa học
          </span>
          <CourseSelect
            value={selectedCourseId}
            onChange={setSelectedCourseId}
            onCoursesLoaded={handleCoursesLoaded}
            style={{ width: 200 }}
          />
        </div>
      }
      loading={loading}
    >
      {analytics ? (
        <>
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={12} sm={6}>
              <Statistic
                title="Tổng bài học"
                value={analytics.totalLessons}
                prefix={<BookOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Người bắt đầu"
                value={analytics.usersStarted}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Hoàn thành"
                value={analytics.usersCompleted}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <div>
                <div className="mb-2">Tỷ lệ hoàn thành</div>
                <Progress
                  percent={analytics.averageCompletionRate}
                  size="small"
                  strokeColor={
                    analytics.averageCompletionRate >= 70
                      ? "#52c41a"
                      : "#faad14"
                  }
                />
              </div>
            </Col>
          </Row>

          <Table
            columns={lessonColumns}
            dataSource={analytics.lessonStats.map((lesson) => ({
              ...lesson,
              key: lesson.lessonId,
            }))}
            pagination={false}
            size="small"
            scroll={{ y: 300 }}
          />
        </>
      ) : (
        <div className="text-center p-10">
          <Spin size="large" />
        </div>
      )}
    </Card>
  );
}
