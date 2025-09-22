import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { List, Typography, Spin, Button, Empty, Card, Space, Tag, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { questionApi } from '@/services/questionApi';
import { QuestionType } from '@/enums/question-type.enum';
import { Question } from '@/types/questionType';
import QuestionCard from './QuestionCard';

const { Title, Text } = Typography;

interface QuestionListProps {
  lessonId: number;
  editable?: boolean;
  onAddQuestion?: () => void;
  onEditQuestion?: (question: Question) => void;
  onDeleteQuestion?: (questionId: number) => void;
  onView?: (question: Question) => void;
  courseId?: number;
}

export interface QuestionListRef {
  fetchQuestions: () => Promise<void>;
}

const QuestionList = forwardRef<QuestionListRef, QuestionListProps>(({
  lessonId,
  editable = false,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onView,
  courseId,
}, ref) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await questionApi.getQuestionsByLesson(lessonId);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Expose the fetchQuestions method to parent components
  useImperativeHandle(ref, () => ({
    fetchQuestions
  }));

  useEffect(() => {
    if (lessonId) {
      fetchQuestions();
    }
  }, [lessonId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: 10 }}>Loading questions...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Text type="danger">{error}</Text>
        <Button onClick={fetchQuestions} style={{ marginTop: 10 }}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <Empty 
        description="No questions found for this lesson" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        {editable && onAddQuestion && (
          <Button type="primary" onClick={onAddQuestion} icon={<PlusOutlined />}>
            Add Question
          </Button>
        )}
      </Empty>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>Lesson Questions ({questions.length})</Title>
        {editable && onAddQuestion && (
          <Button type="primary" onClick={onAddQuestion} icon={<PlusOutlined />}>
            Add Question
          </Button>
        )}
      </div>

      <List
        dataSource={questions}
        renderItem={(question) => (
          <QuestionCard
            question={question}
            onEdit={editable ? onEditQuestion : undefined}
            onDelete={editable ? onDeleteQuestion : undefined}
            onView={onView}
            courseId={courseId}
          />
        )}
      />
    </div>
  );
});

QuestionList.displayName = 'QuestionList';

export default QuestionList;