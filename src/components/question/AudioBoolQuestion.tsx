import React, { useState } from 'react';
import { Typography, Card, Button, Radio, Space } from 'antd';
import { Question, AudioBoolQuestionData } from '@/types/questionType';
import AudioPlayer from './AudioPlayer';

const { Text, Paragraph } = Typography;

interface AudioBoolQuestionProps {
  question: Question;
  isPreview?: boolean;
}

const AudioBoolQuestion: React.FC<AudioBoolQuestionProps> = ({ 
  question, 
  isPreview = false 
}) => {
  const data = question.data as AudioBoolQuestionData;
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  
  const checkAnswer = () => {
    return userAnswer === data.correctAnswer;
  };
  
  return (
    <div>
      <Paragraph>{data.instruction}</Paragraph>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <AudioPlayer audioUrl={data.audio} />
        
        {(isPreview || userAnswer !== null) && (
          <>
            <div style={{ marginTop: 12 }}>
              <Text strong>Transcript: </Text>
              <Text>{data.transcript}</Text>
            </div>
            
            <div>
              <Text strong>Pinyin: </Text>
              <Text>{data.pinyin}</Text>
            </div>
            
            <div>
              <Text strong>English: </Text>
              <Text>{data.english}</Text>
            </div>
          </>
        )}
      </Card>
      
      <div style={{ marginBottom: 16 }}>
        <Radio.Group 
          onChange={e => setUserAnswer(e.target.value)}
          value={userAnswer}
          disabled={isPreview}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio 
              value={true}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px',
                background: isPreview && data.correctAnswer === true ? '#f6ffed' : undefined,
                border: isPreview && data.correctAnswer === true ? '1px solid #b7eb8f' : undefined
              }}
            >
              <Text>True</Text>
              {isPreview && data.correctAnswer === true && (
                <Text type="success" style={{ marginLeft: 8 }}>✓ Correct</Text>
              )}
            </Radio>
            <Radio 
              value={false}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px',
                background: isPreview && data.correctAnswer === false ? '#f6ffed' : undefined,
                border: isPreview && data.correctAnswer === false ? '1px solid #b7eb8f' : undefined
              }}
            >
              <Text>False</Text>
              {isPreview && data.correctAnswer === false && (
                <Text type="success" style={{ marginLeft: 8 }}>✓ Correct</Text>
              )}
            </Radio>
          </Space>
        </Radio.Group>
      </div>
      
      {!isPreview && userAnswer !== null && (
        <div>
          <Button onClick={() => setUserAnswer(null)}>Clear</Button>
          <Button 
            type="primary" 
            style={{ marginLeft: 8 }}
            onClick={() => setUserAnswer(data.correctAnswer)}
          >
            Show Answer
          </Button>
        </div>
      )}
      
      {data.explanation && isPreview && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Explanation: </Text>
          <Paragraph>{data.explanation}</Paragraph>
        </div>
      )}
    </div>
  );
};

export default AudioBoolQuestion;