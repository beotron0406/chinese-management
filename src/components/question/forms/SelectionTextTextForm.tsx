"use client";
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Space, Typography, Switch } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  OrderedListOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { SelectionTextTextQuestionData, TextOption } from "@/types/questionType";
import { TextContent } from "@/types/textContent";
import TextContentInput from "@/components/shared/TextContentInput";
import { getDisplayText } from "@/utils/textContentUtils";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

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
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("1");
  const [questionContent, setQuestionContent] = useState<TextContent>({ text: "" });

  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;

      if (data.options) {
        const normalizedOptions: TextOption[] = data.options.map((opt) => ({
          id: opt.id,
          content: opt.content || (opt.text ? { text: opt.text } : undefined),
          text: opt.text,
        }));
        setOptions(normalizedOptions);
      }

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
        correctAnswer: newCorrectAnswer,
      },
    });
  };

  const handleQuestionContentChange = (content: TextContent) => {
    setQuestionContent(content);
    updateFormData(options, correctAnswer, content);
  };

  const handleOptionContentChange = (optionId: string, content: TextContent) => {
    const updatedOptions = options.map((option) => {
      if (option.id === optionId) {
        return { ...option, content };
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
    if (options.length <= 2) return;

    const filteredOptions = options.filter((opt) => opt.id !== optionId);
    setOptions(filteredOptions);

    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === optionId) {
      newCorrectAnswer = filteredOptions[0]?.id || "1";
      setCorrectAnswer(newCorrectAnswer);
    }

    updateFormData(filteredOptions, newCorrectAnswer);
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    setCorrectAnswer(optionId);
    updateFormData(options, optionId);
  };

  const getOptionDisplayText = (option: TextOption): string => {
    if (option.content) {
      return getDisplayText(option.content);
    }
    return option.text || "";
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Section 1: Question Setup */}
      <SectionContainer>
        <SectionHeader
          step={1}
          title="Thiết Lập Câu Hỏi"
          description="Nhập hướng dẫn và nội dung câu hỏi"
          icon={<QuestionCircleOutlined />}
        />

        <FormField label="Hướng dẫn câu hỏi" required>
          <Form.Item
            name={["data", "instruction"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            className="mb-0"
          >
            <Input
              size="large"
              className="rounded-lg"
              placeholder="VD: Chọn bản dịch đúng cho từ tiếng Trung"
            />
          </Form.Item>
        </FormField>

        <FormField label="Nội dung câu hỏi" required>
          <TextContentInput
            value={questionContent}
            onChange={handleQuestionContentChange}
            placeholder="Nhập câu hỏi của bạn tại đây"
            multiline
            rows={3}
          />
        </FormField>
      </SectionContainer>

      {/* Section 2: Answer Options */}
      <SectionContainer>
        <SectionHeader
          step={2}
          title="Các Lựa Chọn Trả Lời"
          description="Thêm các đáp án và chọn đáp án đúng"
          icon={<OrderedListOutlined />}
        />

        <div className="space-y-4">
          {options.map((option, index) => (
            <div
              key={option.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                correctAnswer === option.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-600">
                  Lựa chọn {index + 1}
                </span>
                <Space>
                  <Button
                    type={correctAnswer === option.id ? "primary" : "default"}
                    size="small"
                    onClick={() => handleCorrectAnswerChange(option.id)}
                    className="rounded-lg"
                    icon={correctAnswer === option.id ? <CheckCircleOutlined /> : null}
                  >
                    {correctAnswer === option.id ? "Đáp án đúng" : "Đánh dấu đúng"}
                  </Button>
                  {options.length > 2 && (
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeOption(option.id)}
                      className="rounded-lg"
                    />
                  )}
                </Space>
              </div>
              <TextContentInput
                value={option.content}
                onChange={(content) => handleOptionContentChange(option.id, content)}
                placeholder="Nhập nội dung lựa chọn"
              />
            </div>
          ))}
        </div>

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addOption}
          disabled={options.length >= 6}
          className="w-full mt-4 h-10 rounded-lg"
        >
          Thêm lựa chọn
        </Button>

        {/* Correct Answer Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Text strong className="text-blue-800">
            Đáp án đúng:{" "}
          </Text>
          <Text className="text-blue-700">
            Lựa chọn {options.findIndex((opt) => opt.id === correctAnswer) + 1}
            {getOptionDisplayText(
              options.find((opt) => opt.id === correctAnswer) || { id: "" }
            ) && (
              <span>
                {" "}
                -{" "}
                {getOptionDisplayText(
                  options.find((opt) => opt.id === correctAnswer) || { id: "" }
                )}
              </span>
            )}
          </Text>
        </div>
      </SectionContainer>

      {/* Section 3: Additional Settings */}
      <SectionContainer>
        <SectionHeader
          step={3}
          title="Cài Đặt Bổ Sung"
          description="Giải thích và trạng thái câu hỏi"
          icon={<CheckCircleOutlined />}
        />

        <FormField label="Giải thích" hint="Hiển thị sau khi học viên trả lời">
          <Form.Item name={["data", "explanation"]} className="mb-0">
            <TextArea
              rows={3}
              className="rounded-lg"
              placeholder="Giải thích tại sao đây là đáp án đúng..."
            />
          </Form.Item>
        </FormField>

        <FormField label="Kích hoạt">
          <Form.Item
            name="isActive"
            valuePropName="checked"
            initialValue={true}
            className="mb-0"
          >
            <Switch />
          </Form.Item>
        </FormField>
      </SectionContainer>

      {/* Hidden form fields */}
      <Form.Item name={["data", "questionContent"]} className="hidden">
        <Input />
      </Form.Item>
      <Form.Item name={["data", "options"]} className="hidden">
        <Input />
      </Form.Item>
      <Form.Item name={["data", "correctAnswer"]} className="hidden">
        <Input />
      </Form.Item>
    </div>
  );
};

export default SelectionTextTextForm;