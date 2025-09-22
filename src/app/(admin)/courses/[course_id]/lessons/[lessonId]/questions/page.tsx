"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Typography, Button, Space, Alert, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, BookOutlined } from '@ant-design/icons';
import { courseService } from '@/services/api';
import { lessonApi } from '@/services/lessonApi';
import { QuestionType } from '@/enums/question-type.enum';
import { Course } from '@/types';
import { Lesson } from '@/types/lessonTypes';
import QuestionList from '@/components/question/QuestionList';

const { Title, Text, Paragraph } = Typography;

export default function LessonQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.course_id as string);
  const lessonId = parseInt(params.lessonId as string);

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseData, lessonData] = await Promise.all([
          courseService.getCourseById(courseId),
          lessonApi.getLesson(lessonId)
        ]);

        setCourse(courseData);
        setLesson(lessonData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load lesson and course data');
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) {
      fetchData();
    }
  }, [courseId, lessonId]);

  const handleBackToLessons = () => {
    router.push(`/courses/${courseId}/lessons`);
  };

  const handleAddQuestion = () => {
    // Show question type selection modal or navigate to create page
    setIsModalVisible(true);
  };

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleQuestionTypeSelect = (questionType: QuestionType) => {
    setIsModalVisible(false);
    router.push(`/question/create?lessonId=${lessonId}&type=${questionType}&courseId=${courseId}`);
  };

  const questionTypeOptions = Object.entries(QuestionType).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value: value
  }));

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
    <div style={{ display: 'flex', height: '100vh', gap: '16px', padding: '16px' }}>
      {/* Left Panel - Lesson Info (300px fixed) */}
      <div style={{ flex: '0 0 300px' }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOutlined />
              <span>Lesson Info</span>
            </div>
          }
          bordered={true}
          style={{ height: 'fit-content' }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToLessons}
            style={{ marginBottom: '16px', width: '100%' }}
          >
            Back to Lessons
          </Button>

          {lesson && (
            <>
              <Title level={4} style={{ marginTop: 0 }}>
                {lesson.name}
              </Title>

              <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
                {lesson.description || 'No description available'}
              </Paragraph>

              <div style={{ marginBottom: '12px' }}>
                <Text strong>Course: </Text>
                <Text>{course?.title || 'Unknown Course'}</Text>
              </div>

              {course?.hskLevel && (
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>HSK Level: </Text>
                  <Tag color="blue">HSK {course.hskLevel}</Tag>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <Text strong>Lesson Order: </Text>
                <Text>{lesson.orderIndex}</Text>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text strong>Status: </Text>
                <Tag color={lesson.isActive ? 'green' : 'red'}>
                  {lesson.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Right Panel - Question Management (flex: 1) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>
            Question Management
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddQuestion}
            size="large"
          >
            Add Question
          </Button>
        </div>

        {/* Question List Component */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <QuestionList lessonId={lessonId} courseId={courseId} />
        </div>
      </div>

      {/* Question Type Selection Modal */}
      {isModalVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <Card
            title="Select Question Type"
            style={{ width: 600, maxHeight: '80vh', overflow: 'auto' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px 0' }}>
              {questionTypeOptions.map(option => (
                <Button
                  key={option.value}
                  size="large"
                  style={{ height: '60px', textAlign: 'left' }}
                  onClick={() => handleQuestionTypeSelect(option.value as QuestionType)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}