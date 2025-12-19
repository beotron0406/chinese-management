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
      <Card title="Thiết Lập Câu Hỏi" className="mb-6">
        <Form.Item
          label="Hướng Dẫn Câu Hỏi"
          name={['data', 'instruction']}
          rules={[{ required: true, message: 'Vui lòng nhập hướng dẫn câu hỏi' }]}
        >
          <Input placeholder="VD: Chọn bản dịch đúng cho từ tiếng Trung" />
        </Form.Item>

        <Form.Item
          label="Nội Dung Câu Hỏi"
          name={['data', 'question']}
          rules={[{ required: true, message: 'Vui lòng nhập nội dung câu hỏi' }]}
        >
          <TextArea
            rows={3}
            placeholder="Nhập câu hỏi của bạn tại đây"
          />
        </Form.Item>
      </Card>

      {/* Answer Options */}
      <Card
        title="Các Lựa Chọn Trả Lời"
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addOption}
            disabled={options.length >= 6}
          >
            Thêm Lựa Chọn
          </Button>
        }
        className="mb-6"
      >
        <Space direction="vertical" className="w-full" size="large">
          {options.map((option, index) => (
            <Card
              key={option.id}
              size="small"
              className={`${correctAnswer === option.id ? 'border-2 border-blue-500 bg-green-50' : 'border border-gray-300 bg-white'}`}
              title={
                <div className="flex justify-between items-center">
                  <span>Lựa Chọn {index + 1}</span>
                  <Space>
                    <Button
                      type={correctAnswer === option.id ? 'primary' : 'default'}
                      size="small"
                      onClick={() => handleCorrectAnswerChange(option.id)}
                    >
                      {correctAnswer === option.id ? 'Đáp Án Đúng' : 'Đánh Dấu Đúng'}
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
                <Text strong>Nội Dung Lựa Chọn</Text>
                <Input
                  placeholder="Nhập nội dung lựa chọn"
                  value={option.text}
                  onChange={(e) => handleTextChange(option.id, e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Preview */}
              {/* {option.text && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                  <Text strong>Xem Trước: </Text>
                  <span style={{ fontSize: '16px', color: '#1890ff' }}>{option.text}</span>
                </div>
              )} */}
            </Card>
          ))}
        </Space>

        {/* Correct Answer Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <Text strong>Đáp Án Đúng: </Text>
          <Text>Lựa Chọn {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {options.find(opt => opt.id === correctAnswer)?.text && (
            <Text> - {options.find(opt => opt.id === correctAnswer)?.text}</Text>
          )}
        </div>
      </Card>

      {/* Additional Settings */}
      <Card title="Cài Đặt Bổ Sung" className="mb-6">
        <Form.Item
          label="Giải Thích (Tùy Chọn)"
          name={['data', 'explanation']}
          help="Cung cấp giải thích sẽ được hiển thị sau khi học viên trả lời"
        >
          <TextArea
            rows={3}
            placeholder="Giải thích tại sao đây là đáp án đúng..."
          />
        </Form.Item>

        <Form.Item
          label="Kích Hoạt"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>

      {/* Hidden form fields for proper data structure */}
      <Form.Item name={['data', 'options']} className="hidden">
        <Input />
      </Form.Item>
      <Form.Item name={['data', 'correctAnswer']} className="hidden">
        <Input />
      </Form.Item>
    </div>
  );
};

export default SelectionTextTextForm;