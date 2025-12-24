"use client";
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, Typography, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import { SelectionTextTextQuestionData, TextOption } from '@/types/questionType';
import { TextContent } from '@/types/textContent';
import TextContentInput from '@/components/shared/TextContentInput';
import { getDisplayText } from '@/utils/textContentUtils';

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
  const [options, setOptions] = useState<TextOption[]>([
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('1');
  const [questionContent, setQuestionContent] = useState<TextContent>({ text: '' });

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      // Handle options (support both legacy and new format)
      if (data.options) {
        const normalizedOptions: TextOption[] = data.options.map(opt => ({
          id: opt.id,
          content: opt.content || (opt.text ? { text: opt.text } : undefined),
          text: opt.text, // Keep legacy field for backward compatibility
        }));
        setOptions(normalizedOptions);
      }
      
      // Handle question content (support both legacy and new format)
      if (data.questionContent) {
        setQuestionContent(data.questionContent);
      } else if (data.question) {
        setQuestionContent({ text: data.question });
      }
      
      if (data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
      }
    }
  }, [initialValues]);

  const updateFormData = (
    newOptions: TextOption[], 
    newCorrectAnswer: string,
    newQuestionContent?: TextContent
  ) => {
    const qContent = newQuestionContent || questionContent;
    form.setFieldsValue({
      data: {
        questionContent: qContent,
        options: newOptions,
        correctAnswer: newCorrectAnswer
      }
    });
  };

  const handleQuestionContentChange = (content: TextContent) => {
    setQuestionContent(content);
    updateFormData(options, correctAnswer, content);
  };

  const handleOptionContentChange = (optionId: string, content: TextContent) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          content: content,
        };
      }
      return option;
    });

    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    const newOptions = [...options, { id: newId }];
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

  // Get display text for an option
  const getOptionDisplayText = (option: TextOption): string => {
    if (option.content) {
      return getDisplayText(option.content);
    }
    return option.text || '';
  };

  return (
    <div>
      {/* Question Setup */}
      <Card title="Thiết Lập Câu Hỏi" className="mb-6">
        <Form.Item
          label="1. Hướng Dẫn Câu Hỏi *"
          name={['data', 'instruction']}
          rules={[{ required: true, message: 'Vui lòng nhập hướng dẫn câu hỏi' }]}
        >
          <Input placeholder="VD: Chọn bản dịch đúng cho từ tiếng Trung" />
        </Form.Item>

        <Form.Item
          label="2. Nội Dung Câu Hỏi *"
          required
        >
          <TextContentInput
            value={questionContent}
            onChange={handleQuestionContentChange}
            placeholder="Nhập câu hỏi của bạn tại đây"
            multiline
            rows={3}
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
                <div className="mt-2">
                  <TextContentInput
                    value={option.content}
                    onChange={(content) => handleOptionContentChange(option.id, content)}
                    placeholder="Nhập nội dung lựa chọn"
                  />
                </div>
              </div>
            </Card>
          ))}
        </Space>

        {/* Correct Answer Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <Text strong>Đáp Án Đúng: </Text>
          <Text>Lựa Chọn {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {getOptionDisplayText(options.find(opt => opt.id === correctAnswer) || {id: ''}) && (
            <Text> - {getOptionDisplayText(options.find(opt => opt.id === correctAnswer) || {id: ''})}</Text>
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
      <Form.Item name={['data', 'questionContent']} className="hidden">
        <Input />
      </Form.Item>
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