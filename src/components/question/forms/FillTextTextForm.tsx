"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Tag,
  Typography,
  Switch,
  Alert,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { FillTextTextQuestionData, FillSegment, FillBlankAnswer } from "@/types/questionType";
import { TextContent } from "@/types/textContent";
import ChineseInput from "@/components/shared/ChineseInput";
import TextContentDisplay from "@/components/shared/TextContentDisplay";
import { getDisplayText } from "@/utils/textContentUtils";

const { TextArea } = Input;
const { Text, Title } = Typography;

interface FillTextTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: FillTextTextQuestionData;
    isActive?: boolean;
  };
}

const FillTextTextForm: React.FC<FillTextTextFormProps> = ({
  form,
  initialValues,
}) => {
  // State for segments
  const [segments, setSegments] = useState<FillSegment[]>([
    { type: 'text', content: { chinese: [''], pinyin: [''] } }
  ]);
  
  // State for option bank
  const [optionBankItems, setOptionBankItems] = useState<TextContent[]>([]);
  
  // State for blank answers
  const [blankAnswers, setBlankAnswers] = useState<FillBlankAnswer[]>([]);

  // Get all blank indices from segments
  const getBlankIndices = (): number[] => {
    return segments
      .filter(s => s.type === 'blank' && s.blankIndex)
      .map(s => s.blankIndex!)
      .sort((a, b) => a - b);
  };

  // Get next available blank index
  const getNextBlankIndex = (): number => {
    const indices = getBlankIndices();
    if (indices.length === 0) return 1;
    return Math.max(...indices) + 1;
  };

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      // Handle new format
      if (data.segments && data.segments.length > 0) {
        setSegments(data.segments);
      } else if (data.sentence && data.sentence.length > 0) {
        // Convert legacy format to new format
        const convertedSegments: FillSegment[] = data.sentence.map((part, index) => {
          const blankMatch = part.match(/^\[(\d+)\]$/);
          if (blankMatch) {
            return {
              type: 'blank' as const,
              blankIndex: parseInt(blankMatch[1])
            };
          }
          return {
            type: 'text' as const,
            content: {
              chinese: [part],
              pinyin: data.pinyin?.[index] ? [data.pinyin[index]] : ['']
            }
          };
        });
        setSegments(convertedSegments);
      }
      
      // Handle option bank
      if (data.optionBankItems && data.optionBankItems.length > 0) {
        setOptionBankItems(data.optionBankItems);
      } else if (data.optionBank && data.optionBank.length > 0) {
        // Convert legacy format
        const converted: TextContent[] = data.optionBank.map(opt => ({
          chinese: [opt],
          pinyin: ['']
        }));
        setOptionBankItems(converted);
      }
      
      // Handle blank answers
      if (data.blankAnswers && data.blankAnswers.length > 0) {
        setBlankAnswers(data.blankAnswers);
      } else if (data.blanks && data.blanks.length > 0) {
        // Convert legacy format
        const converted: FillBlankAnswer[] = data.blanks.map(blank => ({
          index: blank.index,
          correctAnswers: blank.correct.map(c => ({
            chinese: [c],
            pinyin: ['']
          }))
        }));
        setBlankAnswers(converted);
      }
    }
  }, [initialValues]);

  // Update form data whenever state changes
  const updateFormData = () => {
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        segments,
        optionBankItems,
        blankAnswers,
      }
    });
  };

  useEffect(() => {
    updateFormData();
  }, [segments, optionBankItems, blankAnswers]);

  // Segment handlers
  const addTextSegment = () => {
    const newSegments = [...segments, { type: 'text' as const, content: { chinese: [''], pinyin: [''] } }];
    setSegments(newSegments);
  };

  const addBlankSegment = () => {
    const newSegments = [...segments, { type: 'blank' as const, blankIndex: getNextBlankIndex() }];
    setSegments(newSegments);
    
    // Also add a blank answer entry
    const newBlankAnswers = [...blankAnswers, { index: getNextBlankIndex(), correctAnswers: [] }];
    setBlankAnswers(newBlankAnswers);
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 1) return;
    
    const removedSegment = segments[index];
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    
    // If removing a blank, also remove its answer entry
    if (removedSegment.type === 'blank' && removedSegment.blankIndex) {
      const newBlankAnswers = blankAnswers.filter(ba => ba.index !== removedSegment.blankIndex);
      setBlankAnswers(newBlankAnswers);
    }
  };

  const updateSegmentContent = (index: number, content: TextContent) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], content };
    setSegments(newSegments);
  };

  // Option bank handlers
  const addOptionBankItem = () => {
    setOptionBankItems([...optionBankItems, { chinese: [''], pinyin: [''] }]);
  };

  const removeOptionBankItem = (index: number) => {
    const newItems = optionBankItems.filter((_, i) => i !== index);
    setOptionBankItems(newItems);
  };

  const updateOptionBankItem = (index: number, content: TextContent) => {
    const newItems = [...optionBankItems];
    newItems[index] = content;
    setOptionBankItems(newItems);
  };

  // Answer handlers
  const addAnswerToBlank = (blankIndex: number, content: TextContent) => {
    const newBlankAnswers = [...blankAnswers];
    const existingAnswer = newBlankAnswers.find(ba => ba.index === blankIndex);
    
    if (existingAnswer) {
      existingAnswer.correctAnswers = [...existingAnswer.correctAnswers, content];
    } else {
      newBlankAnswers.push({ index: blankIndex, correctAnswers: [content] });
    }
    
    setBlankAnswers(newBlankAnswers);
  };

  const removeAnswerFromBlank = (blankIndex: number, answerIndex: number) => {
    const newBlankAnswers = [...blankAnswers];
    const existingAnswer = newBlankAnswers.find(ba => ba.index === blankIndex);
    
    if (existingAnswer) {
      existingAnswer.correctAnswers = existingAnswer.correctAnswers.filter((_, i) => i !== answerIndex);
    }
    
    setBlankAnswers(newBlankAnswers);
  };

  const updateAnswerInBlank = (blankIndex: number, answerIndex: number, content: TextContent) => {
    const newBlankAnswers = [...blankAnswers];
    const existingAnswer = newBlankAnswers.find(ba => ba.index === blankIndex);
    
    if (existingAnswer) {
      existingAnswer.correctAnswers[answerIndex] = content;
    }
    
    setBlankAnswers(newBlankAnswers);
  };

  // Get answers for a specific blank
  const getAnswersForBlank = (blankIndex: number): TextContent[] => {
    return blankAnswers.find(ba => ba.index === blankIndex)?.correctAnswers || [];
  };

  return (
    <div>
      {/* Instructions */}
      <Alert
        message="Công Cụ Tạo Câu Hỏi Điền Chỗ Trống"
        description="Xây dựng câu bằng các đoạn văn bản và chỗ trống. Sử dụng TextContent để nhập chữ Trung với pinyin."
        type="info"
        className="mb-6"
      />

      {/* Step 1: Question Setup */}
      <Card title="Bước 1: Thiết Lập Câu Hỏi" className="mb-6">
        <Form.Item
          label="1. Hướng Dẫn *"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Vui lòng nhập hướng dẫn" }]}
        >
          <TextArea
            placeholder="Nhập hướng dẫn (ví dụ: 'Điền từ tiếng Trung thích hợp vào chỗ trống.')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Step 2: Segment Builder */}
      <Card
        title="Bước 2: Xây Dựng Câu"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addTextSegment}
            >
              Thêm Văn Bản
            </Button>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={addBlankSegment}
              className="bg-orange-100 border-orange-300"
            >
              Thêm Chỗ Trống
            </Button>
          </Space>
        }
        className="mb-6"
      >
        <div className="mb-4">
          <Text type="secondary">
            Xây dựng câu bằng các đoạn văn bản và chỗ trống. Mỗi đoạn có thể là văn bản đơn giản hoặc chữ Trung với pinyin.
          </Text>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          {segments.map((segment, index) => (
            <Card
              key={index}
              size="small"
              className={`w-[280px] ${segment.type === 'blank' ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Đoạn {index + 1}</span>
                    {segment.type === 'blank' && (
                      <Tag color="orange">Chỗ Trống #{segment.blankIndex}</Tag>
                    )}
                    {segment.type === 'text' && (
                      <Tag color="blue">Văn Bản</Tag>
                    )}
                  </div>
                  {segments.length > 1 && (
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeSegment(index)}
                      danger
                    />
                  )}
                </div>
              }
            >
              {segment.type === 'text' ? (
                <ChineseInput
                  value={segment.content}
                  onChange={(content: TextContent) => updateSegmentContent(index, content)}
                  placeholder="Nhập chữ Trung..."
                />
              ) : (
                <div className="py-4 px-3 bg-yellow-200 border-2 border-dashed border-orange-400 rounded-md text-center">
                  <div className="text-lg font-bold text-yellow-700">
                    CHỖ TRỐNG #{segment.blankIndex}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    Học sinh sẽ điền vào đây
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Preview */}
        <div className="p-4 bg-gray-50 rounded-md">
          <Text strong>Xem Trước Câu:</Text>
          <div className="mt-2 flex flex-wrap items-end gap-1">
            {segments.map((segment, index) => (
              <span key={index}>
                {segment.type === 'text' ? (
                  <TextContentDisplay content={segment.content} />
                ) : (
                  <span className="inline-block px-3 py-1 bg-yellow-200 border border-dashed border-orange-400 rounded text-orange-600 font-bold">
                    ____
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>


      </Card>

      {/* Step 3: Vietnamese Translation */}
      <Card title="Bước 3: Bản Dịch Tiếng Việt" className="mb-6">
        <Form.Item
          label="2. Bản Dịch Tiếng Việt *"
          name={["data", "vietnamese"]}
          rules={[{ required: true, message: "Vui lòng nhập bản dịch tiếng Việt" }]}
        >
          <TextArea
            placeholder="Nhập bản dịch tiếng Việt (ví dụ: 'Tôi [1] học [2].')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Step 4: Option Bank */}
      <Card
        title="Bước 4: Ngân Hàng Lựa Chọn"
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addOptionBankItem}
          >
            Thêm Lựa Chọn
          </Button>
        }
        className="mb-6"
      >
        <div className="mb-3">
          <Text type="secondary">
            Thêm các từ/cụm từ làm gợi ý cho học sinh. Mỗi lựa chọn có thể có pinyin.
          </Text>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          {optionBankItems.map((item, index) => (
            <Card
              key={index}
              size="small"
              className="w-[250px]"
              title={
                <div className="flex items-center justify-between">
                  <span>Lựa Chọn {index + 1}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeOptionBankItem(index)}
                    danger
                  />
                </div>
              }
            >
              <ChineseInput
                value={item}
                onChange={(content: TextContent) => updateOptionBankItem(index, content)}
                placeholder="Nhập từ..."
              />
            </Card>
          ))}
        </div>

        {/* Preview */}
        {optionBankItems.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-md">
            <Text strong>Lựa Chọn Hiện Có:</Text>
            <div className="mt-2 flex flex-wrap gap-2">
              {optionBankItems.map((item, index) => (
                <Tag key={index} color="blue" className="text-sm py-1 px-2">
                  <TextContentDisplay content={item} size="small" />
                </Tag>
              ))}
            </div>
          </div>
        )}


      </Card>

      {/* Step 5: Set Correct Answers */}
      <Card title="Bước 5: Đặt Đáp Án Đúng" className="mb-6">
        <div className="mb-3">
          <Text type="secondary">
            Xác định đáp án đúng cho mỗi chỗ trống. Bạn có thể thêm nhiều đáp án đúng cho mỗi chỗ trống.
          </Text>
        </div>

        {getBlankIndices().length === 0 ? (
          <Alert
            message="Chưa có chỗ trống"
            description="Thêm chỗ trống trong Bước 2 để đặt đáp án."
            type="info"
            showIcon
          />
        ) : (
          <div className="space-y-4">
            {getBlankIndices().map((blankIndex) => {
              const answers = getAnswersForBlank(blankIndex);
              
              return (
                <Card
                  key={blankIndex}
                  size="small"
                  className="bg-gray-50"
                  title={
                    <div className="flex items-center gap-2">
                      <Tag color="orange">Chỗ Trống #{blankIndex}</Tag>
                      <Text type="secondary">
                        ({answers.length} đáp án)
                      </Text>
                    </div>
                  }
                  extra={
                    <Button
                      type="dashed"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => addAnswerToBlank(blankIndex, { text: '' })}
                    >
                      Thêm Đáp Án
                    </Button>
                  }
                >
                  {answers.length === 0 ? (
                    <Text type="secondary">Chưa có đáp án. Nhấn "Thêm Đáp Án" để bắt đầu.</Text>
                  ) : (
                    <div className="space-y-2">
                      {answers.map((answer, answerIndex) => (
                        <div key={answerIndex} className="flex items-start gap-2">
                          <div className="flex-1">
                            <ChineseInput
                              value={answer}
                              onChange={(content: TextContent) => updateAnswerInBlank(blankIndex, answerIndex, content)}
                              placeholder="Nhập đáp án..."
                              compact
                            />
                          </div>
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeAnswerFromBlank(blankIndex, answerIndex)}
                            danger
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Quick add from option bank */}
                  {optionBankItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Text className="text-xs text-gray-500">Chọn nhanh từ ngân hàng:</Text>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {optionBankItems.slice(0, 5).map((item, idx) => (
                          <Button
                            key={idx}
                            size="small"
                            className="text-xs"
                            onClick={() => addAnswerToBlank(blankIndex, item)}
                          >
                            {getDisplayText(item)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {getBlankIndices().length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <Text strong>Tóm Tắt Đáp Án:</Text>
            <div className="mt-2 space-y-1">
              {getBlankIndices().map((blankIndex) => {
                const answers = getAnswersForBlank(blankIndex);
                return (
                  <div key={blankIndex} className="flex items-center gap-2">
                    <Tag color="orange">#{blankIndex}</Tag>
                    <span>→</span>
                    {answers.length > 0 ? (
                      answers.map((answer, idx) => (
                        <Tag key={idx} color="green">
                          {getDisplayText(answer)}
                        </Tag>
                      ))
                    ) : (
                      <Tag color="red">Chưa đặt đáp án</Tag>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


      </Card>

      {/* Step 6: Explanation */}
      <Card title="Bước 6: Giải Thích" className="mb-6">
        <Form.Item
          label="3. Giải Thích *"
          name={["data", "explanation"]}
          rules={[{ required: true, message: "Vui lòng nhập giải thích" }]}
        >
          <TextArea
            placeholder="Giải thích đáp án đúng, quy tắc ngữ pháp và ý nghĩa từ..."
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>
      </Card>

      {/* Additional Settings */}
      <Card title="Cài Đặt Bổ Sung" className="mb-6">
        <Form.Item
          label="Kích Hoạt"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>
    </div>
  );
};

export default FillTextTextForm;
