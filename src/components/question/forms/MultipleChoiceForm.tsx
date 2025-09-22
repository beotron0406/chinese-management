"use client";
import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, Typography, Divider, Switch, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, SoundOutlined } from '@ant-design/icons';
import { pinyin } from 'pinyin-pro';
import type { FormInstance } from 'antd/es/form';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Option {
  id: string;
  text: string;
  chinese?: string;
  pinyin?: string;
  translation?: string;
}

interface MultipleChoiceFormProps {
  form: FormInstance;
  initialValues?: any;
}

const MultipleChoiceForm: React.FC<MultipleChoiceFormProps> = ({ form, initialValues }) => {
  const [options, setOptions] = useState<Option[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
    { id: '4', text: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('1');

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

  const handleChineseTextChange = (optionId: string, value: string) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        const generatedPinyin = generatePinyin(value);
        return {
          ...option,
          chinese: value,
          pinyin: generatedPinyin,
          text: value // Keep text as the main field for compatibility
        };
      }
      return option;
    });

    setOptions(updatedOptions);

    // Update form values
    form.setFieldsValue({
      data: {
        options: updatedOptions.map(opt => ({
          id: opt.id,
          text: opt.text
        })),
        correctAnswer: correctAnswer
      }
    });
  };

  const handlePinyinChange = (optionId: string, value: string) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return { ...option, pinyin: value };
      }
      return option;
    });
    setOptions(updatedOptions);
  };

  const handleTranslationChange = (optionId: string, value: string) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return { ...option, translation: value };
      }
      return option;
    });
    setOptions(updatedOptions);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (optionId: string) => {
    if (options.length <= 2) return; // Keep minimum 2 options

    const filteredOptions = options.filter(opt => opt.id !== optionId);
    setOptions(filteredOptions);

    // If removed option was correct answer, reset to first option
    if (correctAnswer === optionId) {
      setCorrectAnswer(filteredOptions[0]?.id || '1');
    }
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    setCorrectAnswer(optionId);
    form.setFieldsValue({
      data: {
        correctAnswer: optionId
      }
    });
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
            placeholder="Enter your question here. You can include Chinese characters, they will be automatically processed."
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
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Chinese Text</Text>
                    <Input
                      placeholder="Enter Chinese characters"
                      value={option.chinese || ''}
                      onChange={(e) => handleChineseTextChange(option.id, e.target.value)}
                      style={{ marginTop: '4px' }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Pinyin (Auto-generated)</Text>
                    <Input
                      placeholder="Pinyin will be generated automatically"
                      value={option.pinyin || ''}
                      onChange={(e) => handlePinyinChange(option.id, e.target.value)}
                      style={{ marginTop: '4px' }}
                      addonAfter={<SoundOutlined />}
                    />
                  </div>
                </Col>
              </Row>

              <div>
                <Text strong>English Translation</Text>
                <Input
                  placeholder="Enter English translation"
                  value={option.translation || ''}
                  onChange={(e) => handleTranslationChange(option.id, e.target.value)}
                  style={{ marginTop: '4px' }}
                />
              </div>

              {/* Preview how the option will look */}
              {option.chinese && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                  <Text strong>Preview: </Text>
                  <span style={{ fontSize: '16px', color: '#1890ff' }}>{option.chinese}</span>
                  {option.pinyin && <span style={{ color: '#666', marginLeft: '8px' }}>({option.pinyin})</span>}
                  {option.translation && <span style={{ color: '#999', marginLeft: '8px' }}>- {option.translation}</span>}
                </div>
              )}
            </Card>
          ))}
        </Space>

        {/* Correct Answer Summary */}
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
          <Text strong>Correct Answer: </Text>
          <Text>Option {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {options.find(opt => opt.id === correctAnswer)?.chinese && (
            <Text> - {options.find(opt => opt.id === correctAnswer)?.chinese}</Text>
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

      {/* Hidden form fields for data structure */}
      <Form.Item name={['data', 'options']} style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name={['data', 'correctAnswer']} style={{ display: 'none' }}>
        <Input />
      </Form.Item>
    </div>
  );
};

export default MultipleChoiceForm;