"use client";

import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Table, Spin, message, Space } from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { LessonAnalytics } from "@/types/userprogressTypes";
import { adminProgressApi } from "@/services/userprogressApi";
import { Column } from "@ant-design/plots";
import CourseSelect from "@/components/shared/button/CourseSelect";
import LessonSelect, {
  ILessonByCourse,
} from "@/components/shared/button/LessonSelect";
import { Course } from "@/types";

interface LessonAnalyticsCardProps {}

export default function LessonAnalyticsCard({}: LessonAnalyticsCardProps) {
  const [analytics, setAnalytics] = useState<LessonAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(
    undefined
  );
  const [selectedLessonId, setSelectedLessonId] = useState<number | undefined>(
    undefined
  );

  // Auto-select first course when courses are loaded
  const handleCoursesLoaded = (courses: Course[]) => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  };

  // Auto-select first lesson when lessons are loaded
  const handleLessonsLoaded = (lessons: ILessonByCourse[]) => {
    if (lessons.length > 0) {
      setSelectedLessonId(lessons[0].id);
    }
  };

  // Reset lesson selection when course changes
  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(undefined);
    setAnalytics(null);
  };

  useEffect(() => {
    if (selectedLessonId) {
      fetchLessonAnalytics(selectedLessonId);
    }
  }, [selectedLessonId]);

  const fetchLessonAnalytics = async (lessonId: number) => {
    try {
      setLoading(true);
      const data = await adminProgressApi.getLessonAnalytics(lessonId);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching lesson analytics:", error);
      message.error("Không thể tải phân tích bài học");
    } finally {
      setLoading(false);
    }
  };

  const recentColumns = [
    {
      title: "Học viên",
      dataIndex: "displayName",
      key: "displayName",
      width: "30%",
    },
    {
      title: "Điểm số",
      dataIndex: "scorePercentage",
      key: "scorePercentage",
      width: "25%",
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
          {score}%
        </span>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "completedAt",
      key: "completedAt",
      width: "45%",
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
  ];

  const getScoreDistributionData = () => {
    if (!analytics) return [];
    return analytics.scoreDistribution.map((item) => ({
      range: item.range,
      count: item.count,
    }));
  };

  const config = {
    data: getScoreDistributionData(),
    xField: "range",
    yField: "count",
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    color: "#1890ff",
    meta: {
      range: { alias: "Khoảng điểm" },
      count: { alias: "Số lượng" },
    },
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span>
            <FileTextOutlined /> Phân tích bài học
          </span>
          <Space size="small">
            <CourseSelect
              value={selectedCourseId}
              onChange={handleCourseChange}
              onCoursesLoaded={handleCoursesLoaded}
              className="w-[180px]"
              placeholder="Chọn khóa học"
            />
            <LessonSelect
              courseId={selectedCourseId}
              value={selectedLessonId}
              onChange={setSelectedLessonId}
              onLessonsLoaded={handleLessonsLoaded}
              className="w-[200px]"
              disabled={!selectedCourseId}
              placeholder="Chọn bài học"
            />
          </Space>
        </div>
      }
      loading={loading}
    >
      {analytics ? (
        <>
          {/* Lesson Info */}
          <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12}>
                <div className="text-gray-500 text-xs">Bài học</div>
                <div className="font-semibold text-base text-blue-600">
                  #{analytics.lesson.id} - {analytics.lesson.title}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="text-gray-500 text-xs">Thuộc khóa học</div>
                <div className="font-medium text-base">
                  {analytics.lesson.courseTitle}
                </div>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={12} sm={8}>
              <Statistic
                title="Tổng lượt hoàn thành"
                value={analytics.totalCompletions}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic
                title="Điểm trung bình"
                value={analytics.averageScore}
                precision={0}
                prefix={<TrophyOutlined />}
                className={`[&_.ant-statistic-content-value]:${analytics.averageScore >= 80 ? "!text-green-500" : analytics.averageScore >= 60 ? "!text-yellow-500" : "!text-red-500"}`}
              />
            </Col>
            <Col xs={24} sm={8}>
              <div>
                <div className="mb-2 text-gray-500">Độ khó bài học</div>
                <div
                  className={`text-base font-bold ${
                    analytics.averageScore >= 80
                      ? "text-green-500"
                      : analytics.averageScore >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                >
                  {analytics.averageScore >= 80
                    ? "🟢 Dễ"
                    : analytics.averageScore >= 60
                      ? "🟡 Trung bình"
                      : "🔴 Khó"}
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Phân bố điểm số" size="small">
                <Column {...config} height={200} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Hoàn thành gần đây" size="small">
                <Table
                  columns={recentColumns}
                  dataSource={analytics.recentCompletions.map(
                    (completion, index) => ({
                      ...completion,
                      key: index,
                    })
                  )}
                  pagination={false}
                  size="small"
                  scroll={{ y: 200 }}
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div className="text-center p-10">
          <Spin size="large" />
        </div>
      )}
    </Card>
  );
}
