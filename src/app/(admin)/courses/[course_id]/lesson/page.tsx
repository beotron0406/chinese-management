"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  Typography,
  Button,
  Space,
  Alert,
  Spin,
  Table,
  Tag,
  Badge,
  Modal,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  UndoOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { courseService } from "@/services/api";
import { lessonApi } from "@/services/lessonApi";
import { Course } from "@/types";
import { Lesson } from "@/types/lessonTypes";
import { useLessonCache } from "@/context/LessonCacheContext";
import LessonFormModal from "@/components/lessons/LessonFormModal";

const { Title, Text, Paragraph } = Typography;

export default function CourseLessonsPage() {
  const router = useRouter();
  const params = useParams();
  const { setCachedLesson } = useLessonCache();

  const courseIdParam = params.course_id as string;
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : NaN;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  if (!courseIdParam || isNaN(courseId)) {
    return (
      <Alert
        message="ID khóa học không hợp lệ"
        description="ID khóa học được cung cấp trong URL không hợp lệ."
        type="error"
        showIcon
        className="m-5"
        action={
          <Button onClick={() => router.push("/courses")}>
            Quay lại trang khóa học
          </Button>
        }
      />
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!courseId || isNaN(courseId)) {
          throw new Error("ID khóa học không hợp lệ");
        }

        let courseData: Course | null = null;
        let lessonsData: Lesson[] = [];

        try {
          courseData = await courseService.getCourseById(courseId);
        } catch (courseErr) {
          throw new Error("Không thể tải thông tin khóa học");
        }

        try {
          lessonsData = await lessonApi.getAllLessonsByCourse(courseId);
        } catch (lessonsErr) {
          lessonsData = [];
        }

        setCourse(courseData);
        setLessons(lessonsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải dữ liệu khóa học và bài học"
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId && !isNaN(courseId)) {
      fetchData();
    } else {
      setError("ID khóa học không hợp lệ");
      setLoading(false);
    }
  }, [courseId]);

  const handleBackToCourses = () => {
    router.push("/courses");
  };

  const handleLessonClick = (lesson: Lesson) => {
    setCachedLesson(lesson);
    router.push(`/courses/${courseId}/lesson/${lesson.id}/items`);
  };

  const handleAddNewLesson = () => {
    setSelectedLesson(null);
    setLessonModalVisible(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonModalVisible(true);
  };

  const handleLessonModalClose = (refreshData: boolean) => {
    setLessonModalVisible(false);
    setSelectedLesson(null);
    if (refreshData) {
      const fetchLessons = async () => {
        try {
          setLoading(true);
          const lessonsData = await lessonApi.getAllLessonsByCourse(courseId);
          setLessons(lessonsData);
        } catch (error) {
        } finally {
          setLoading(false);
        }
      };
      fetchLessons();
    }
  };

  const handleDeactivateLesson = (lesson: Lesson) => {
    Modal.confirm({
      title: "Vô hiệu hóa bài học",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn vô hiệu hóa bài học "${lesson.name}"? Bài học sẽ được đánh dấu là không hoạt động.`,
      okText: "Vô hiệu hóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await lessonApi.deleteLesson(lesson.id);
          message.success("Vô hiệu hóa bài học thành công");
          // Refresh lessons list
          const lessonsData = await lessonApi.getAllLessonsByCourse(courseId);
          setLessons(lessonsData);
        } catch (error) {
          message.error("Có lỗi khi vô hiệu hóa bài học");
        }
      },
    });
  };

  const handleRestoreLesson = (lesson: Lesson) => {
    Modal.confirm({
      title: "Khôi phục bài học",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn khôi phục bài học "${lesson.name}"?`,
      okText: "Khôi phục",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await lessonApi.restoreLesson(lesson.id);
          message.success("Khôi phục bài học thành công");
          // Refresh lessons list
          const lessonsData = await lessonApi.getAllLessonsByCourse(courseId);
          setLessons(lessonsData);
        } catch (error) {
          message.error("Có lỗi khi khôi phục bài học");
        }
      },
    });
  };

  const handleHardDeleteLesson = (lesson: Lesson) => {
    Modal.confirm({
      title: "Xóa vĩnh viễn bài học",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa vĩnh viễn bài học "{lesson.name}"?</p>
          <p className="text-red-500 font-bold">
            Hành động này KHÔNG THỂ HOÀN TÁC!
          </p>
        </div>
      ),
      okText: "Xóa vĩnh viễn",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await lessonApi.hardDeleteLesson(lesson.id);
          message.success("Xóa vĩnh viễn bài học thành công");
          // Refresh lessons list
          const lessonsData = await lessonApi.getAllLessonsByCourse(courseId);
          setLessons(lessonsData);
        } catch (error) {
          message.error("Có lỗi khi xóa vĩnh viễn bài học");
        }
      },
    });
  };

  const columns = [
    {
      title: "Order",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: 80,
      render: (order: number) => <Tag color="blue">#{order}</Tag>,
    },
    {
      title: "Tên bài học",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Lesson) => (
        <div
          className="cursor-pointer"
          onClick={() => handleLessonClick(record)}
        >
          <Text strong className="text-blue-500">
            {text}
          </Text>
          {record.description && (
            <div>
              <Text type="secondary" className="text-sm">
                {record.description.length > 80
                  ? `${record.description.substring(0, 80)}...`
                  : record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) =>
        isActive ? (
          <Badge status="success" text="Hoạt động" />
        ) : (
          <Badge status="error" text="Không hoạt động" />
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 300,
      render: (_: any, record: Lesson) => (
        <Space>
          <Button
            type="link"
            icon={<BookOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleLessonClick(record);
            }}
          ></Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEditLesson(record);
            }}
          ></Button>
          {record.isActive ? (
            <Button
              danger
              icon={<StopOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeactivateLesson(record);
              }}
            ></Button>
          ) : (
            <>
              <Button
                type="primary"
                icon={<UndoOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestoreLesson(record);
                }}
              ></Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHardDeleteLesson(record);
                }}
              >
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={error}
        type="error"
        showIcon
        className="m-5"
      />
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBackToCourses}
          className="mb-4"
        >
          Quay lại khóa học
        </Button>

        {course && (
          <>
            <Title level={2} className="!m-0">
              Bài học: {course.title}
            </Title>
            <div className="mt-2">
              <Tag color="blue">HSK Level {course.hskLevel}</Tag>
              <Tag color={course.isActive ? "green" : "red"}>
                {course.isActive ? "Hoạt động" : "Không hoạt động"}
              </Tag>
            </div>
            {course.description && (
              <Paragraph type="secondary" className="mt-3">
                {course.description}
              </Paragraph>
            )}
          </>
        )}
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
        <Card size="small">
          <div className="text-center">
            <Title level={3} className="!m-0 !text-blue-500">
              {lessons?.length || 0}
            </Title>
            <Text type="secondary">Tổng số bài học</Text>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <Title level={3} className="!m-0 !text-green-500">
              {lessons?.filter((l) => l.isActive).length || 0}
            </Title>
            <Text type="secondary">Bài học hoạt động</Text>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <Title level={3} className="!m-0 !text-orange-500">
              {lessons?.filter((l) => !l.isActive).length || 0}
            </Title>
            <Text type="secondary">Bài học không hoạt động</Text>
          </div>
        </Card>
      </div>

      {/* Lessons List */}
      <Card
        title="Lessons"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNewLesson}
          >
            Thêm bài học mới
          </Button>
        }
      >
        {!lessons || lessons.length === 0 ? (
          <div className="text-center p-10">
            <Text type="secondary">
              Không tìm thấy bài học nào cho khóa học này.
            </Text>
            <div className="mt-4">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddNewLesson}
              >
                Tạo bài học đầu tiên
              </Button>
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={lessons}
            rowKey="id"
            pagination={false}
            size="middle"
            onRow={(record) => ({
              className: "cursor-pointer",
              onClick: () => handleLessonClick(record),
            })}
          />
        )}
      </Card>

      {/* Add/Edit Lesson Modal */}
      <LessonFormModal
        visible={lessonModalVisible}
        onClose={handleLessonModalClose}
        lesson={selectedLesson}
        courseId={courseId}
      />
    </div>
  );
}
