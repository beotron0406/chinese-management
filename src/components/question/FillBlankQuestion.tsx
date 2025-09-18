import React, { useState } from 'react';
import { Typography, Card, Button, Select, Space, Tag, Form, Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Question, FillBlankQuestionData } from '@/types/questionType';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface FillBlankQuestionProps {
  question?: Question;
  isPreview?: boolean;
  form?: any; // For Form.useForm()
  initialValues?: FillBlankQuestionData;
}

const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({ 
  question, 
  isPreview = false,
  form,
  initialValues
}) => {
  // If form is provided, we're in edit mode, otherwise we're in display mode
  const isEditMode = !!form;
  
  // For display mode
  const data = question?.data as FillBlankQuestionData;
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  // For edit mode
  const [options, setOptions] = useState<string[]>(initialValues?.options || []);
  
  // Display mode functions
  const renderSentenceWithBlank = () => {
    if (!data) return null;
    
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
  
  // Edit mode functions
  const addOption = () => {
    const newOptions = [...options, ''];
    setOptions(newOptions);
    form.setFieldsValue({ options: newOptions });
  };
  
  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    form.setFieldsValue({ options: newOptions });
    
    // If removed option is the correct answer, reset it
    if (form.getFieldValue('correctAnswer') === options[index]) {
      form.setFieldsValue({ correctAnswer: undefined });
    }
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    form.setFieldsValue({ options: newOptions });
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
          name="sentence"
          label="Sentence (use _____ to mark the blank)"
          rules={[
            { required: true, message: 'Please enter the sentence' },
            { 
              validator: (_, value) => {
                if (!value || !value.includes('_____')) {
                  return Promise.reject('Sentence must include _____ to mark the blank');
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <TextArea rows={2} placeholder="Enter the sentence with _____ for the blank" />
        </Form.Item>
        
        <Form.Item
          name="pinyin"
          label="Pinyin"
          rules={[{ required: true, message: 'Please enter pinyin' }]}
        >
          <Input placeholder="Enter pinyin for the sentence" />
        </Form.Item>
        
        <Form.Item
          name="english"
          label="English Translation"
          rules={[{ required: true, message: 'Please enter English translation' }]}
        >
          <Input placeholder="Enter English translation of the sentence" />
        </Form.Item>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>Options</Text>
          
          {options.map((option, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginTop: 8,
                gap: 8
              }}
            >
              <Input
                value={option}
                onChange={e => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                style={{ flex: 1 }}
              />
              
              <Button
                type={form.getFieldValue('correctAnswer') === option ? 'primary' : 'default'}
                onClick={() => form.setFieldsValue({ correctAnswer: option })}
              >
                {form.getFieldValue('correctAnswer') === option ? '✓' : 'Mark Correct'}
              </Button>
              
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => removeOption(index)}
              />
            </div>
          ))}
          
          <Button 
            type="dashed" 
            onClick={addOption} 
            style={{ width: '100%', marginTop: 16 }}
            icon={<PlusOutlined />}
          >
            Add Option
          </Button>
        </div>
        
        <Form.Item
          name="correctAnswer"
          label="Correct Answer"
          hidden
          rules={[{ required: true, message: 'Please select a correct answer' }]}
        >
          <Input />
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
        <div style={{ marginBottom: 8 }}>
          {renderSentenceWithBlank()}
        </div>
        
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">{data?.pinyin}</Text>
        </div>
        
        <div>
          <Text italic>{data?.english}</Text>
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
          {data?.options.map((option, index) => (
            <Option key={index} value={option}>
              {option}
              {isPreview && option === data?.correctAnswer && ' ✓'}
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
              onClick={() => data?.correctAnswer && setUserAnswer(data.correctAnswer)}
            >
              Show Answer
            </Button>
          )}
        </Space>
      )}
      
      {isPreview && userAnswer === data?.correctAnswer && data?.explanation && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Explanation: </Text>
          <Paragraph>{data.explanation}</Paragraph>
        </div>
      )}
    </div>
  );
};

export default FillBlankQuestion;