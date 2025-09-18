import React, { useState } from 'react';
import { Typography, Card, Button, Radio, Space, Form, Input, Upload, Switch } from 'antd';
import { Question, AudioBoolQuestionData } from '@/types/questionType';
import AudioPlayer from './AudioPlayer';
import { UploadOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AudioBoolQuestionProps {
  question?: Question;
  isPreview?: boolean;
  form?: any; // For Form.useForm()
  initialValues?: AudioBoolQuestionData;
}

const AudioBoolQuestion: React.FC<AudioBoolQuestionProps> = ({ 
  question, 
  isPreview = false,
  form,
  initialValues
}) => {
  // If form is provided, we're in edit mode, otherwise we're in display mode
  const isEditMode = !!form;
  
  // For display mode
  const data = question?.data as AudioBoolQuestionData;
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  
  const checkAnswer = () => {
    return userAnswer === data?.correctAnswer;
  };
  
  // If we're in edit mode, render the form for creating/editing a question
  if (isEditMode) {
    return (
      <>
        <Form.Item
          name="instruction"
          label="Instruction"
          rules={[{ required: true, message: 'Please enter instruction' }]}
        >
          <TextArea rows={2} placeholder="Enter the instruction for this question" />
        </Form.Item>
        
        <Form.Item
          name="audio"
          label="Audio"
          rules={[{ required: true, message: 'Please upload audio' }]}
        >
          <Upload
            maxCount={1}
            beforeUpload={() => false} // Prevent auto upload
          >
            <Button icon={<UploadOutlined />}>Upload Audio</Button>
          </Upload>
        </Form.Item>
        
        <Form.Item
          name="transcript"
          label="Chinese Transcript"
          rules={[{ required: true, message: 'Please enter transcript' }]}
        >
          <Input placeholder="Enter Chinese text" />
        </Form.Item>
        
        <Form.Item
          name="pinyin"
          label="Pinyin"
          rules={[{ required: true, message: 'Please enter pinyin' }]}
        >
          <Input placeholder="Enter pinyin" />
        </Form.Item>
        
        <Form.Item
          name="english"
          label="English Translation"
          rules={[{ required: true, message: 'Please enter English translation' }]}
        >
          <Input placeholder="Enter English translation" />
        </Form.Item>
        
        <Form.Item
          name="correctAnswer"
          label="Correct Answer"
          valuePropName="checked"
          rules={[{ required: true, message: 'Please select correct answer' }]}
        >
          <Switch checkedChildren="True" unCheckedChildren="False" />
        </Form.Item>
        
        <Form.Item
          name="explanation"
          label="Explanation"
        >
          <TextArea rows={3} placeholder="Enter an explanation (optional)" />
        </Form.Item>
      </>
    );
  }
  
  // Display mode (original component logic)
  return (
    <div>
      <Paragraph>{data?.instruction}</Paragraph>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <AudioPlayer audioUrl={data?.audio} />
        
        {(isPreview || userAnswer !== null) && (
          <>
            <div style={{ marginTop: 12 }}>
              <Text strong>Transcript: </Text>
              <Text>{data?.transcript}</Text>
            </div>
            
            <div>
              <Text strong>Pinyin: </Text>
              <Text>{data?.pinyin}</Text>
            </div>
            
            <div>
              <Text strong>English: </Text>
              <Text>{data?.english}</Text>
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
                background: isPreview && data?.correctAnswer === true ? '#f6ffed' : undefined,
                border: isPreview && data?.correctAnswer === true ? '1px solid #b7eb8f' : undefined
              }}
            >
              <Text>True</Text>
              {isPreview && data?.correctAnswer === true && (
                <Text type="success" style={{ marginLeft: 8 }}>✓ Correct</Text>
              )}
            </Radio>
            <Radio 
              value={false}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px',
                background: isPreview && data?.correctAnswer === false ? '#f6ffed' : undefined,
                border: isPreview && data?.correctAnswer === false ? '1px solid #b7eb8f' : undefined
              }}
            >
              <Text>False</Text>
              {isPreview && data?.correctAnswer === false && (
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
            onClick={() => setUserAnswer(data?.correctAnswer)}
          >
            Show Answer
          </Button>
        </div>
      )}
      
      {data?.explanation && isPreview && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Explanation: </Text>
          <Paragraph>{data.explanation}</Paragraph>
        </div>
      )}
    </div>
  );
};

export default AudioBoolQuestion;