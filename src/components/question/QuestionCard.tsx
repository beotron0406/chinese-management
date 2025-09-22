import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Divider, Tag, Space, Button } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { QuestionType } from '@/enums/question-type.enum';
import AudioImageQuestion from './AudioImageQuestion';
import MatchingTextQuestion from './MatchingTextQuestion';
import TextSelectionQuestion from './TextSelectionQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import AudioBoolQuestion from './AudioBoolQuestion';
import { Question } from '@/types/questionType';

interface QuestionCardProps {
  question: Question;
  onEdit?: (question: Question) => void;
  onDelete?: (questionId: number) => void;
  onView?: (question: Question) => void;
  preview?: boolean;
  courseId?: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onEdit,
  onDelete,
  onView,
  preview = false,
  courseId,
}) => {
  const router = useRouter();
  const renderQuestionContent = () => {
    switch (question.questionType) {
      case QuestionType.AUDIO_IMAGE:
        return <AudioImageQuestion question={question} isPreview={preview} />;
      case QuestionType.TEXT_SELECTION:
        return <TextSelectionQuestion question={question} isPreview={preview} />;
      case QuestionType.MATCHING_TEXT:
        return <MatchingTextQuestion question={question} isPreview={preview} />;
      case QuestionType.FILL_BLANK:
        return <FillBlankQuestion question={question} isPreview={preview} />;
      case QuestionType.AUDIO_BOOL:
        return <AudioBoolQuestion question={question} isPreview={preview} />;
      case QuestionType.MATCHING_AUDIO:
        return <div>Matching Audio Question (Not implemented yet)</div>;
      default:
        return <div>Unknown Question Type</div>;
    }
  };

  const getQuestionTypeDisplay = (type: QuestionType) => {
    switch (type) {
      case QuestionType.AUDIO_IMAGE:
        return 'Audio to Image';
      case QuestionType.TEXT_SELECTION:
        return 'Multiple Choice';
      case QuestionType.MATCHING_TEXT:
        return 'Matching Text';
      case QuestionType.FILL_BLANK:
        return 'Fill in the Blank';
      case QuestionType.AUDIO_BOOL:
        return 'Audio True/False';
      case QuestionType.MATCHING_AUDIO:
        return 'Matching Audio';
      default:
        return 'Unknown Type';
    }
  };

  const getTagColor = (type: QuestionType) => {
    const typeColors: Record<QuestionType, string> = {
      [QuestionType.AUDIO_IMAGE]: 'blue',
      [QuestionType.TEXT_SELECTION]: 'green',
      [QuestionType.MATCHING_TEXT]: 'purple',
      [QuestionType.MATCHING_AUDIO]: 'cyan',
      [QuestionType.FILL_BLANK]: 'orange',
      [QuestionType.AUDIO_BOOL]: 'magenta',
    };
    
    return typeColors[type] || 'default';
  };

  return (
    <Card
      title={`Question #${question.orderIndex}`}
      extra={
        <Space>
          <Tag color={getTagColor(question.questionType)}>
            {getQuestionTypeDisplay(question.questionType)}
          </Tag>
          {!preview && (
            <>
              <EyeOutlined onClick={() => onView && onView(question)} />
              <EditOutlined
                onClick={() => {
                  if (onEdit) {
                    onEdit(question);
                  } else {
                    // Navigate to edit page with course context
                    const editUrl = courseId
                      ? `/question/edit/${question.id}?lessonId=${question.lessonId}&courseId=${courseId}`
                      : `/question/edit/${question.id}?lessonId=${question.lessonId}`;
                    router.push(editUrl);
                  }
                }}
              />
              <DeleteOutlined
                onClick={() => onDelete && onDelete(question.id)}
                style={{ color: 'red' }}
              />
            </>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {renderQuestionContent()}
      {question.data && 'explanation' in question.data && preview && (
        <>
          <Divider />
          <div>
            <strong>Explanation:</strong> {question.data.explanation as string}
          </div>
        </>
      )}
      {onView && (
  <Button 
    type="text" 
    icon={<EyeOutlined />} 
    onClick={() => onView(question)}
  >
    View
  </Button>
)}
    </Card>
    
  );
};

export default QuestionCard;