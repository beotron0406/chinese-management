"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Typography, Button, Form, Space, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { QuestionType } from '@/enums/question-type.enum';
import { lessonApi } from '@/services/lessonApi';
import { questionApi } from '@/services/questionApi';
import { Lesson } from '@/types/lessonTypes';
import { QuestionFormValues } from '@/types/questionType';
import MultipleChoiceForm from '@/components/question/forms/MultipleChoiceForm';
import JsonPreviewCard from '@/components/question/JsonPreviewCard';

const { Title, Text } = Typography;

export default function CreateQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = parseInt(searchParams.get('lessonId') || '1');
  const courseId = parseInt(searchParams.get('courseId') || '1');
  const questionType = searchParams.get('type') as QuestionType || QuestionType.TEXT_SELECTION;

  const [form] = Form.useForm();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>({});

  // Watch form values for JSON preview
  const watchedValues = Form.useWatch([], form);

  useEffect(() => {
    setFormValues(watchedValues || {});
  }, [watchedValues]);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const lessonData = await lessonApi.getLesson(lessonId);
        setLesson(lessonData);
      } catch (err) {
        console.error('Failed to fetch lesson:', err);
        setError('Failed to load lesson data');
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const questionData: QuestionFormValues = {
        lessonId,
        questionType,
        orderIndex: 0, // Will be auto-assigned by backend
        isActive: values.isActive ?? true,
        data: values.data
      };

      await questionApi.createQuestion(questionData);

      // Navigate back to lesson questions page
      router.push(`/courses/${courseId}/lessons/${lessonId}/questions`);
    } catch (err) {
      console.error('Failed to create question:', err);
      setError('Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  // Generate preview data for JSON card
  const getPreviewData = () => {
    return {
      lessonId,
      questionType,
      orderIndex: "Auto-assigned by backend",
      isActive: formValues.isActive ?? true,
      data: formValues.data || {}
    };
  };

  const handleCancel = () => {
    router.push(`/courses/${courseId}/lessons/${lessonId}/questions`);
  };

  const getQuestionTypeTitle = (type: QuestionType) => {
    switch (type) {
      case QuestionType.TEXT_SELECTION:
        return 'Multiple Choice Question';
      case QuestionType.AUDIO_IMAGE:
        return 'Audio to Image Question';
      case QuestionType.MATCHING_TEXT:
        return 'Matching Text Question';
      case QuestionType.FILL_BLANK:
        return 'Fill in the Blank Question';
      case QuestionType.AUDIO_BOOL:
        return 'Audio True/False Question';
      default:
        return 'Question';
    }
  };

  const renderQuestionForm = () => {
    switch (questionType) {
      case QuestionType.TEXT_SELECTION:
        return <MultipleChoiceForm form={form} />;
      default:
        return (
          <Alert
            message="Question Type Not Implemented"
            description={`The ${getQuestionTypeTitle(questionType)} form is not yet implemented.`}
            type="warning"
            showIcon
          />
        );
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleCancel}
          style={{ marginBottom: '16px' }}
        >
          Back to Lesson Questions
        </Button>

        <Title level={2} style={{ margin: 0 }}>
          Create {getQuestionTypeTitle(questionType)}
        </Title>

        {lesson && (
          <Text type="secondary">
            Lesson: {lesson.name} • Course: {lesson.course?.title}
          </Text>
        )}
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Question Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column - Main Form */}
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              lessonId,
              questionType,
              isActive: true
            }}
          >
            {renderQuestionForm()}

            {/* Form Actions */}
            <div style={{ marginTop: '32px', textAlign: 'right' }}>
              <Space>
                <Button onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  Create Question
                </Button>
              </Space>
            </div>
          </Form>
        </Card>

        {/* Right Column - JSON Preview */}
        <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
          <JsonPreviewCard data={getPreviewData()} />
        </div>
      </div>
    </div>
  );
}