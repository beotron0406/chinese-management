"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, Typography, Button, Form, Space, Alert, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { QuestionType } from '@/enums/question-type.enum';
import { lessonApi } from '@/services/lessonApi';
import { questionApi } from '@/services/questionApi';
import { Lesson } from '@/types/lessonTypes';
import { Question } from '@/types/questionType';
import MultipleChoiceForm from '@/components/question/forms/MultipleChoiceForm';
import JsonPreviewCard from '@/components/question/JsonPreviewCard';

const { Title, Text } = Typography;

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const questionId = parseInt(params.id as string);
  const lessonId = parseInt(searchParams.get('lessonId') || '1');
  const courseId = parseInt(searchParams.get('courseId') || '1');

  const [form] = Form.useForm();
  const [question, setQuestion] = useState<Question | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>({});

  // Watch form values for JSON preview
  const watchedValues = Form.useWatch([], form);

  useEffect(() => {
    setFormValues(watchedValues || {});
  }, [watchedValues]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [questionData, lessonData] = await Promise.all([
          questionApi.getQuestion(questionId),
          lessonApi.getLesson(lessonId)
        ]);

        setQuestion(questionData);
        setLesson(lessonData);

        // Populate form with existing data
        form.setFieldsValue({
          lessonId: questionData.lessonId,
          questionType: questionData.questionType,
          orderIndex: questionData.orderIndex,
          isActive: questionData.isActive,
          data: questionData.data
        });
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load question data');
      } finally {
        setLoading(false);
      }
    };

    if (questionId && lessonId) {
      fetchData();
    }
  }, [questionId, lessonId, form]);

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const updateData = {
        // orderIndex managed by drag-and-drop, not form input
        isActive: values.isActive,
        data: values.data
      };

      await questionApi.updateQuestion(questionId, updateData);

      // Navigate back to lesson questions page
      router.push(`/courses/${courseId}/lessons/${lessonId}/questions`);
    } catch (err) {
      console.error('Failed to update question:', err);
      setError('Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  // Generate preview data for JSON card
  const getPreviewData = () => {
    return {
      id: questionId,
      lessonId,
      questionType: question?.questionType,
      orderIndex: question?.orderIndex || "Managed by drag & drop",
      isActive: formValues.isActive ?? question?.isActive ?? true,
      data: formValues.data || question?.data || {}
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
    if (!question) return null;

    switch (question.questionType) {
      case QuestionType.TEXT_SELECTION:
        return <MultipleChoiceForm form={form} initialValues={question.data} />;
      default:
        return (
          <Alert
            message="Question Type Not Implemented"
            description={`The ${getQuestionTypeTitle(question.questionType)} form is not yet implemented for editing.`}
            type="warning"
            showIcon
          />
        );
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

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
          Edit {question ? getQuestionTypeTitle(question.questionType) : 'Question'}
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
                  loading={saving}
                  icon={<SaveOutlined />}
                >
                  Update Question
                </Button>
              </Space>
            </div>
          </Form>
        </Card>

        {/* Right Column - JSON Preview */}
        <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
          <JsonPreviewCard
            data={getPreviewData()}
            title="JSON Preview - Data to be sent to Backend"
          />
        </div>
      </div>
    </div>
  );
}