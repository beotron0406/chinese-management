import React from 'react';
import { Radio, Space, Typography, Card } from 'antd';
import { Question, TextSelectionQuestionData } from '@/types/questionType';

const { Text, Paragraph } = Typography;

interface TextSelectionQuestionProps {
  question: Question;
  isPreview?: boolean;
}

const TextSelectionQuestion: React.FC<TextSelectionQuestionProps> = ({ 
  question, 
  isPreview = false 
}) => {
  const data = question.data as TextSelectionQuestionData;
  
  return (
    <div>
      <Paragraph>{data.instruction}</Paragraph>
      <Paragraph strong style={{ fontSize: '16px', marginBottom: '16px' }}>{data.question}</Paragraph>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <Radio.Group 
          disabled={isPreview}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {data.options.map((option) => (
              <Radio 
                key={option.id} 
                value={option.id}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px',
                  background: isPreview && option.id === data.correctAnswer ? '#f6ffed' : undefined,
                  border: isPreview && option.id === data.correctAnswer ? '1px solid #b7eb8f' : undefined
                }}
              >
                <Text>{option.text}</Text>
                {isPreview && option.id === data.correctAnswer && (
                  <Text type="success" style={{ marginLeft: 8 }}>✓ Correct</Text>
                )}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Card>
      
      {data.explanation && isPreview && (
        <div>
          <Text strong>Explanation: </Text>
          <Paragraph>{data.explanation}</Paragraph>
        </div>
      )}
    </div>
  );
};

export default TextSelectionQuestion;