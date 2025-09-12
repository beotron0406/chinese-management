'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Spin, Space, Button, Select, message, Modal, Tooltip, Tabs, Empty, Typography } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ExclamationCircleOutlined, 
  SyncOutlined, 
  ArrowLeftOutlined, 
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import { lessonApi } from '@/services/lessonApi';
import { questionApi } from '@/services/questionApi';
import CourseSelect from '@/components/shared/button/CourseSelect';
import LessonSelect from '@/components/shared/button/LessonSelect';
import QuestionList from '@/components/question/QuestionList';
import { Question } from '@/types/questionType';
import QuestionFormModal from '@/components/question/QuestionFormModal';
import QuestionCard from '@/components/question/QuestionCard';
import { Lesson } from '@/types/lessonTypes';

const { confirm } = Modal;
const { Title, Paragraph, Text } = Typography;

// Define the interface for the QuestionList ref
interface QuestionListRef {
  fetchQuestions: () => Promise<void>;
}

const LessonQuestionsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonIdParam = searchParams.get('lesson_id');
  const lessonId = lessonIdParam ? Number(lessonIdParam) : undefined;
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseId, setCourseId] = useState<number | undefined>(undefined);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');
  
  // Fixed: Use the correct interface for the ref
  const questionListRef = useRef<QuestionListRef>(null);

  // Fetch lesson details when lessonId changes
  const fetchLessonDetails = useCallback(async () => {
    if (!lessonId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const lessonData = await lessonApi.getLesson(lessonId);
      setLesson(lessonData);
      setCourseId(lessonData.courseId);
    } catch (error) {
      console.error('Failed to fetch lesson details:', error);
      setError('Failed to load lesson details. Please try again later.');
      message.error('Failed to load lesson details');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLessonDetails();
  }, [fetchLessonDetails]);

  // Handle course change
  const handleCourseChange = useCallback((newCourseId: number) => {
    setCourseId(newCourseId);
    // Reset lesson selection when course changes
    if (courseId !== newCourseId) {
      router.push('/question');
    }
  }, [courseId, router]);

  // Handle lesson change
  const handleLessonChange = useCallback((newLessonId: number) => {
    router.push(`/question?lesson_id=${newLessonId}`);
  }, [router]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (lessonId) {
      router.push(`/lessons/${lessonId}`);
    } else {
      router.push('/lessons');
    }
  }, [lessonId, router]);

  // Question management handlers
  const handleAddQuestion = useCallback(() => {
    setEditingQuestion(null);
    setShowAddQuestionModal(true);
  }, []);

  const handleEditQuestion = useCallback((question: Question) => {
    setEditingQuestion(question);
    setShowAddQuestionModal(true);
  }, []);

  const handleViewQuestion = useCallback((question: Question) => {
    setPreviewQuestion(question);
    setActiveTab('preview');
  }, []);

  const handleModalClose = useCallback(() => {
    setShowAddQuestionModal(false);
    setEditingQuestion(null);
  }, []);

  const handleQuestionSaveSuccess = useCallback(() => {
    message.success({
      content: editingQuestion ? 'Question updated successfully' : 'Question added successfully',
      key: 'questionSave'
    });
    handleModalClose();
    
    // Refresh questions list
    if (questionListRef.current) {
      questionListRef.current.fetchQuestions();
    }
  }, [editingQuestion, handleModalClose]);

  const handleDeleteQuestion = useCallback(async (questionId: number) => {
    confirm({
      title: 'Are you sure you want to delete this question?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setActionLoading(true);
          message.loading({ content: 'Deleting question...', key: 'deleteQuestion' });
          await questionApi.deleteQuestion(questionId);
          message.success({ content: 'Question deleted successfully', key: 'deleteQuestion' });
          
          // Close preview if the deleted question is being previewed
          if (previewQuestion && previewQuestion.id === questionId) {
            setPreviewQuestion(null);
            setActiveTab('list');
          }
          
          // Refresh questions list
          if (questionListRef.current) {
            questionListRef.current.fetchQuestions();
          }
        } catch (error) {
          console.error('Failed to delete question:', error);
          message.error({ content: 'Failed to delete question', key: 'deleteQuestion' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  }, [previewQuestion]);

  const handleRefreshQuestions = useCallback(() => {
    if (questionListRef.current) {
      message.loading({ content: 'Refreshing questions...', key: 'refreshQuestions', duration: 0.5 });
      questionListRef.current.fetchQuestions();
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading lesson data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Title level={3}>Error Loading Data</Title>
        <Paragraph type="danger">{error}</Paragraph>
        <Button type="primary" onClick={fetchLessonDetails} icon={<SyncOutlined />}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="lesson-questions-page">
      <PageHeader
        title={`Questions - ${lesson?.name || 'Select a Lesson'}`}
        subtitle="Manage questions for this lesson"
        extra={[
          <Tooltip key="refresh" title="Refresh questions list">
            <Button 
              onClick={handleRefreshQuestions}
              icon={<SyncOutlined spin={actionLoading} />}
              disabled={!lessonId || actionLoading}
            >
              Refresh
            </Button>
          </Tooltip>,
          <Tooltip key="add" title="Add a new question to this lesson">
            <Button 
              type="primary" 
              onClick={handleAddQuestion}
              disabled={!lessonId || actionLoading}
              icon={<PlusOutlined />}
            >
              Add Question
            </Button>
          </Tooltip>,
          <Button key="back" onClick={handleBack} icon={<ArrowLeftOutlined />}>
            {lessonId ? 'Back to Lesson' : 'Back to Lessons'}
          </Button>
        ]}
      />

      {/* Course and Lesson Selection */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: '300px', maxWidth: '100%' }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Course:</label>
              <CourseSelect 
                value={courseId} 
                onChange={handleCourseChange}
                style={{ width: '100%' }}
                placeholder="Select a course"
                disabled={actionLoading}
              />
            </div>
            <div style={{ width: '300px', maxWidth: '100%' }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Lesson:</label>
              <LessonSelect 
                courseId={courseId}
                value={lessonId} 
                onChange={handleLessonChange}
                style={{ width: '100%' }}
                placeholder="Select a lesson"
                disabled={!courseId || actionLoading}
              />
            </div>
          </div>
          
          {lesson ? (
            <div className="lesson-info">
              <Title level={4}>{lesson.name}</Title>
              <Paragraph>
                {lesson.description || 'No description available'}
              </Paragraph>
              {lesson.orderIndex !== undefined && (
                <Text type="secondary">Order: {lesson.orderIndex}</Text>
              )}
            </div>
          ) : courseId ? (
            <Empty description="Please select a lesson" />
          ) : (
            <Empty description="Please select a course first" />
          )}
        </Space>
      </Card>

      {/* Questions Content */}
      {lessonId ? (
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'list',
              label: 'Questions List',
              children: (
                <QuestionList 
                  lessonId={lessonId} 
                  editable={true}
                  onAddQuestion={handleAddQuestion}
                  onEditQuestion={handleEditQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onView={handleViewQuestion}
                  ref={questionListRef}
                />
              )
            },
            {
              key: 'preview',
              label: 'Question Preview',
              disabled: !previewQuestion,
              children: previewQuestion ? (
                <div style={{ padding: '20px 0' }}>
                  <Title level={3}>Question Preview</Title>
                  <Card>
                    <QuestionCard 
                      question={previewQuestion} 
                      preview={true} 
                    />
                  </Card>
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setActiveTab('list')} icon={<ArrowLeftOutlined />}>
                      Back to List
                    </Button>
                    <Space>
                      <Button 
                        onClick={() => handleEditQuestion(previewQuestion)} 
                        type="primary"
                        icon={<EditOutlined />}
                      >
                        Edit Question
                      </Button>
                      <Button 
                        onClick={() => handleDeleteQuestion(previewQuestion.id)} 
                        danger
                        icon={<DeleteOutlined />}
                        disabled={actionLoading}
                      >
                        Delete
                      </Button>
                    </Space>
                  </div>
                </div>
              ) : (
                <Empty description="Select a question to preview" style={{ padding: '40px 0' }} />
              )
            }
          ]}
        />
      ) : (
        <Card>
          <Empty 
            description="Please select a lesson to manage its questions" 
            style={{ padding: '40px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}

      {/* Question Form Modal */}
      {showAddQuestionModal && lessonId && (
        <QuestionFormModal
          lessonId={lessonId}
          question={editingQuestion}
          visible={showAddQuestionModal}
          onClose={handleModalClose}
          onSuccess={handleQuestionSaveSuccess}
        />
      )}

      <style jsx global>{`
        .lesson-questions-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .lesson-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }
        @media (max-width: 768px) {
          .lesson-questions-page {
            padding: 0 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default LessonQuestionsPage;