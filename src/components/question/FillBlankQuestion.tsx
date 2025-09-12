import React, { useState } from 'react';
import { Typography, Card, Button, Select, Space, Tag } from 'antd';
import { Question, FillBlankQuestionData } from '@/types/questionType';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface FillBlankQuestionProps {
  question: Question;
  isPreview?: boolean;
}

const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({ 
  question, 
  isPreview = false 
}) => {
  const data = question.data as FillBlankQuestionData;
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  // Function to highlight the blank in the sentence
  const renderSentenceWithBlank = () => {
    const parts = data.sentence.split('_____');
    
    if (parts.length === 1) {
      return <Text>{data.sentence}</Text>;
    }
    
    return (
      <Text>
        {parts[0]}
        <Tag 
          color={isPreview && userAnswer === data.correctAnswer ? 'success' : 'blue'}
          style={{ 
            padding: '2px 12px', 
            fontSize: '14px',
            minWidth: '80px',
            textAlign: 'center'
          }}
        >
          {userAnswer || '_____'}
        </Tag>
        {parts[1]}
      </Text>
    );
  };
  
  return (
    <div>
      <Paragraph>{data.instruction}</Paragraph>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          {renderSentenceWithBlank()}
        </div>
        
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">{data.pinyin}</Text>
        </div>
        
        <div>
          <Text italic>{data.english}</Text>
        </div>
      </Card>
      
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="Select the correct word for the blank"
          style={{ width: '100%' }}
          onChange={value => setUserAnswer(value)}
          value={userAnswer || undefined}
          disabled={isPreview}
        >
          {data.options.map((option, index) => (
            <Option key={index} value={option}>
              {option}
              {isPreview && option === data.correctAnswer && ' ✓'}
            </Option>
          ))}
        </Select>
      </div>
      
      {(!isPreview || (isPreview && userAnswer)) && (
        <Space>
          <Button onClick={() => setUserAnswer('')}>Clear</Button>
          {!isPreview && (
            <Button 
              type="primary"
              onClick={() => setUserAnswer(data.correctAnswer)}
            >
              Show Answer
            </Button>
          )}
        </Space>
      )}
      
      {isPreview && userAnswer === data.correctAnswer && data.explanation && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Explanation: </Text>
          <Paragraph>{data.explanation}</Paragraph>
        </div>
      )}
    </div>
  );
};

export default FillBlankQuestion;