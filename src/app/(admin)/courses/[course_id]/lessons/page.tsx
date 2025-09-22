"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Typography, Button, Space, Alert, Spin, Table, Tag, Badge } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import { courseService } from '@/services/api';
import { lessonApi } from '@/services/lessonApi';
import { Course } from '@/types';
import { Lesson } from '@/types/lessonTypes';
import { useLessonCache } from '@/context/LessonCacheContext';

const { Title, Text, Paragraph } = Typography;

export default function CourseLessonsPage() {
  const router = useRouter();
  const params = useParams();
  const { setCachedLesson } = useLessonCache();

  // Safe parameter extraction with validation
  const courseIdParam = params.course_id as string;
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : NaN;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Early return for invalid course ID
  if (!courseIdParam || isNaN(courseId)) {
    return (
      <Alert
        message="Invalid Course ID"
        description="The course ID provided in the URL is not valid."
        type="error"
        showIcon
        style={{ margin: '20px' }}
        action={
          <Button onClick={() => router.push('/courses')}>
            Back to Courses
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

        // Validate courseId
        if (!courseId || isNaN(courseId)) {
          throw new Error('Invalid course ID');
        }

        // Fetch data with individual error handling
        let courseData: Course | null = null;
        let lessonsData: Lesson[] = [];

        try {
          courseData = await courseService.getCourseById(courseId);
        } catch (courseErr) {
          console.error('Failed to fetch course:', courseErr);
          throw new Error('Failed to load course information');
        }

        try {
          lessonsData = await lessonApi.getLessonsByCourse(courseId);
        } catch (lessonsErr) {
          console.error('Failed to fetch lessons:', lessonsErr);
          // Don't throw here, just use empty array
          lessonsData = [];
        }

        setCourse(courseData);
        setLessons(lessonsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course and lessons data');
      } finally {
        setLoading(false);
      }
    };

    if (courseId && !isNaN(courseId)) {
      fetchData();
    } else {
      setError('Invalid course ID provided');
      setLoading(false);
    }
  }, [courseId]);

  const handleBackToCourses = () => {
    router.push('/courses');
  };

  const handleLessonClick = (lesson: Lesson) => {
    // Cache the lesson data before navigating
    setCachedLesson(lesson);
    router.push(`/question?lessonId=${lesson.id}`);
  };

  const columns = [
    {
      title: 'Order',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 80,
      render: (order: number) => <Tag color="blue">#{order}</Tag>
    },
    {
      title: 'Lesson Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Lesson) => (
        <div style={{ cursor: 'pointer' }} onClick={() => handleLessonClick(record)}>
          <Text strong style={{ color: '#1890ff' }}>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '0.9em' }}>
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
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) =>
        isActive ?
          <Badge status="success" text="Active" /> :
          <Badge status="error" text="Inactive" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Lesson) => (
        <Space>
          <Button
            type="link"
            icon={<BookOutlined />}
            size="small"
            onClick={() => handleLessonClick(record)}
          >
            View Items
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              // Handle edit lesson
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Data"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBackToCourses}
          style={{ marginBottom: '16px' }}
        >
          Back to Courses
        </Button>

        {course && (
          <>
            <Title level={2} style={{ margin: 0 }}>
              {course.title} - Lessons
            </Title>
            <div style={{ marginTop: '8px' }}>
              <Tag color="blue">HSK Level {course.hskLevel}</Tag>
              <Tag color={course.isActive ? 'green' : 'red'}>
                {course.isActive ? 'Active' : 'Inactive'}
              </Tag>
            </div>
            {course.description && (
              <Paragraph type="secondary" style={{ marginTop: '12px' }}>
                {course.description}
              </Paragraph>
            )}
          </>
        )}
      </div>

      {/* Course Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>{lessons.length}</Title>
            <Text type="secondary">Total Lessons</Text>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              {lessons.filter(l => l.isActive).length}
            </Title>
            <Text type="secondary">Active Lessons</Text>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
              {lessons.filter(l => !l.isActive).length}
            </Title>
            <Text type="secondary">Inactive Lessons</Text>
          </div>
        </Card>
      </div>

      {/* Lessons List */}
      <Card
        title="Lessons"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Add New Lesson
          </Button>
        }
      >
        {lessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">No lessons found for this course.</Text>
            <div style={{ marginTop: '16px' }}>
              <Button type="primary" icon={<PlusOutlined />}>
                Create First Lesson
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
              style: { cursor: 'pointer' },
              onClick: () => handleLessonClick(record),
            })}
          />
        )}
      </Card>
    </div>
  );
}