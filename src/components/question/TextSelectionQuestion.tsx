import React, { useState } from 'react';
import { Radio, Space, Typography, Card, Form, Input, Button } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Question, TextSelectionQuestionData } from '@/types/questionType';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface TextSelectionQuestionProps {
  question?: Question;
  isPreview?: boolean;
  form?: any; // For Form.useForm()
  initialValues?: TextSelectionQuestionData;
}

const TextSelectionQuestion: React.FC<TextSelectionQuestionProps> = ({ 
  question, 
  isPreview = false,
  form,
  initialValues
}) => {
  // If form is provided, we're in edit mode, otherwise we're in display mode
  const isEditMode = !!form;
  
  // For display mode
  const data = question?.data as TextSelectionQuestionData;
  
  // For edit mode
  const [options, setOptions] = useState<any[]>(initialValues?.options || []);
  
  const addOption = () => {
    const newOption = {
      id: `option_${Date.now()}`,
      text: ''
    };
    
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    form.setFieldsValue({ options: newOptions });
  };
  
  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    form.setFieldsValue({ options: newOptions });
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      text: value
    };
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
          name="question"
          label="Question Text"
          rules={[{ required: true, message: 'Please enter question text' }]}
        >
          <TextArea rows={2} placeholder="Enter the question text" />
        </Form.Item>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>Options</Text>
          
          {options.map((option, index) => (
            <Card key={option.id} style={{ marginTop: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Option {index + 1}</Text>
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => removeOption(index)}
                  />
                </div>
                
                <Input
                  value={option.text}
                  onChange={e => handleOptionChange(index, e.target.value)}
                  placeholder="Option text"
                />
                
                <Form.Item>
                  <Button
                    type={form.getFieldValue('correctAnswer') === option.id ? 'primary' : 'default'}
                    onClick={() => form.setFieldsValue({ correctAnswer: option.id })}
                  >
                    {form.getFieldValue('correctAnswer') === option.id ? 'Correct Answer' : 'Mark as Correct'}
                  </Button>
                </Form.Item>
              </Space>
            </Card>
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
      <Paragraph strong style={{ fontSize: '16px', marginBottom: '16px' }}>{data?.question}</Paragraph>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <Radio.Group 
          disabled={isPreview}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {data?.options.map((option) => (
              <Radio 
                key={option.id} 
                value={option.id}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px',
                  background: isPreview && option.id === data?.correctAnswer ? '#f6ffed' : undefined,
                  border: isPreview && option.id === data?.correctAnswer ? '1px solid #b7eb8f' : undefined
                }}
              >
                <Text>{option.text}</Text>
                {isPreview && option.id === data?.correctAnswer && (
                  <Text type="success" style={{ marginLeft: 8 }}>✓ Correct</Text>
                )}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Card>
      
      {data?.explanation && isPreview && (
        <div>
          <Text strong>Explanation: </Text>
          <Paragraph>{data.explanation}</Paragraph>
        </div>
      )}
    </div>
  );
};

export default TextSelectionQuestion;