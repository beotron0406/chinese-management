"use client";
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, Typography, Switch, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, SoundOutlined } from '@ant-design/icons';
import { pinyin } from 'pinyin-pro';
import type { FormInstance } from 'antd/es/form';
import { SelectionTextTextQuestionData } from '@/types/questionType';

const { Text } = Typography;
const { TextArea } = Input;

interface SelectionTextTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: SelectionTextTextQuestionData;
    isActive?: boolean;
  };
}

const SelectionTextTextForm: React.FC<SelectionTextTextFormProps> = ({ form, initialValues }) => {
  const [options, setOptions] = useState<SelectionTextTextQuestionData['options']>([
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
    { id: '4', text: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('1');

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      if (data.options) {
        setOptions(data.options);
      }
      if (data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
      }
    }
  }, [initialValues]);

  const generatePinyin = (chinese: string): string => {
    try {
      return pinyin(chinese, {
        toneType: 'symbol',
        type: 'array'
      }).join(' ');
    } catch (error) {
      console.warn('Failed to generate pinyin:', error);
      return '';
    }
  };

  const updateFormData = (newOptions: SelectionTextTextQuestionData['options'], newCorrectAnswer: string) => {
    form.setFieldsValue({
      data: {
        options: newOptions,
        correctAnswer: newCorrectAnswer
      }
    });
  };

  const handleTextChange = (optionId: string, value: string) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          text: value
        };
      }
      return option;
    });

    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    const newOptions = [...options, { id: newId, text: '' }];
    setOptions(newOptions);
    updateFormData(newOptions, correctAnswer);
  };

  const removeOption = (optionId: string) => {
    if (options.length <= 2) return; // Keep minimum 2 options

    const filteredOptions = options.filter(opt => opt.id !== optionId);
    setOptions(filteredOptions);

    // If removed option was correct answer, reset to first option
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === optionId) {
      newCorrectAnswer = filteredOptions[0]?.id || '1';
      setCorrectAnswer(newCorrectAnswer);
    }

    updateFormData(filteredOptions, newCorrectAnswer);
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    setCorrectAnswer(optionId);
    updateFormData(options, optionId);
  };

  return (
    <div>
      {/* Question Setup */}
      <Card title="Question Setup" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Question Instruction"
          name={['data', 'instruction']}
          rules={[{ required: true, message: 'Please enter the question instruction' }]}
        >
          <Input placeholder="e.g., Choose the correct translation for the Chinese word" />
        </Form.Item>

        <Form.Item
          label="Question Text"
          name={['data', 'question']}
          rules={[{ required: true, message: 'Please enter the question text' }]}
        >
          <TextArea
            rows={3}
            placeholder="Enter your question here"
          />
        </Form.Item>
      </Card>

      {/* Answer Options */}
      <Card
        title="Answer Options"
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addOption}
            disabled={options.length >= 6}
          >
            Add Option
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {options.map((option, index) => (
            <Card
              key={option.id}
              size="small"
              style={{
                border: correctAnswer === option.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                backgroundColor: correctAnswer === option.id ? '#f6ffed' : 'white'
              }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Option {index + 1}</span>
                  <Space>
                    <Button
                      type={correctAnswer === option.id ? 'primary' : 'default'}
                      size="small"
                      onClick={() => handleCorrectAnswerChange(option.id)}
                    >
                      {correctAnswer === option.id ? 'Correct Answer' : 'Mark as Correct'}
                    </Button>
                    {options.length > 2 && (
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeOption(option.id)}
                      />
                    )}
                  </Space>
                </div>
              }
            >
              <div>
                <Text strong>Option Text</Text>
                <Input
                  placeholder="Enter option text"
                  value={option.text}
                  onChange={(e) => handleTextChange(option.id, e.target.value)}
                  style={{ marginTop: '4px' }}
                />
              </div>

              {/* Preview */}
              {option.text && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                  <Text strong>Preview: </Text>
                  <span style={{ fontSize: '16px', color: '#1890ff' }}>{option.text}</span>
                </div>
              )}
            </Card>
          ))}
        </Space>

        {/* Correct Answer Summary */}
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
          <Text strong>Correct Answer: </Text>
          <Text>Option {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {options.find(opt => opt.id === correctAnswer)?.text && (
            <Text> - {options.find(opt => opt.id === correctAnswer)?.text}</Text>
          )}
        </div>
      </Card>

      {/* Additional Settings */}
      <Card title="Additional Settings" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Explanation (Optional)"
          name={['data', 'explanation']}
          help="Provide an explanation that will be shown after the student answers"
        >
          <TextArea
            rows={3}
            placeholder="Explain why this is the correct answer..."
          />
        </Form.Item>

        <Form.Item
          label="Active"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>

      {/* Hidden form fields for proper data structure */}
      <Form.Item name={['data', 'options']} style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name={['data', 'correctAnswer']} style={{ display: 'none' }}>
        <Input />
      </Form.Item>
    </div>
  );
};

export default SelectionTextTextForm;