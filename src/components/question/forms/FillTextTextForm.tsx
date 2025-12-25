"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Space,
  Tag,
  Typography,
  Switch,
  Alert,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  EditOutlined,
  OrderedListOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { FillTextTextQuestionData, FillSegment, FillBlankAnswer } from "@/types/questionType";
import { TextContent } from "@/types/textContent";
import ChineseInput from "@/components/shared/ChineseInput";
import TextContentDisplay from "@/components/shared/TextContentDisplay";
import { getDisplayText } from "@/utils/textContentUtils";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { TextArea } = Input;
const { Text } = Typography;

interface FillTextTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: FillTextTextQuestionData;
    isActive?: boolean;
  };
}

const FillTextTextForm: React.FC<FillTextTextFormProps> = ({ form, initialValues }) => {
  const [segments, setSegments] = useState<FillSegment[]>([{ type: "text", content: { chinese: [""], pinyin: [""] } }]);
  const [optionBankItems, setOptionBankItems] = useState<TextContent[]>([]);
  const [blankAnswers, setBlankAnswers] = useState<FillBlankAnswer[]>([]);

  const getBlankIndices = (): number[] => segments.filter((s) => s.type === "blank" && s.blankIndex).map((s) => s.blankIndex!).sort((a, b) => a - b);
  const getNextBlankIndex = (): number => { const indices = getBlankIndices(); return indices.length === 0 ? 1 : Math.max(...indices) + 1; };

  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      if (data.segments && data.segments.length > 0) {
        setSegments(data.segments);
      } else if (data.sentence && data.sentence.length > 0) {
        const convertedSegments: FillSegment[] = data.sentence.map((part, index) => {
          const blankMatch = part.match(/^\[(\d+)\]$/);
          if (blankMatch) return { type: "blank" as const, blankIndex: parseInt(blankMatch[1]) };
          return { type: "text" as const, content: { chinese: [part], pinyin: data.pinyin?.[index] ? [data.pinyin[index]] : [""] } };
        });
        setSegments(convertedSegments);
      }
      if (data.optionBankItems && data.optionBankItems.length > 0) setOptionBankItems(data.optionBankItems);
      else if (data.optionBank && data.optionBank.length > 0) setOptionBankItems(data.optionBank.map((opt) => ({ chinese: [opt], pinyin: [""] })));
      if (data.blankAnswers && data.blankAnswers.length > 0) setBlankAnswers(data.blankAnswers);
      else if (data.blanks && data.blanks.length > 0) setBlankAnswers(data.blanks.map((blank) => ({ index: blank.index, correctAnswers: blank.correct.map((c) => ({ chinese: [c], pinyin: [""] })) })));
    }
  }, [initialValues]);

  const updateFormData = () => {
    form.setFieldsValue({ data: { ...form.getFieldValue("data"), segments, optionBankItems, blankAnswers } });
  };

  useEffect(() => { updateFormData(); }, [segments, optionBankItems, blankAnswers]);

  const addTextSegment = () => setSegments([...segments, { type: "text" as const, content: { chinese: [""], pinyin: [""] } }]);
  const addBlankSegment = () => {
    const nextIndex = getNextBlankIndex();
    setSegments([...segments, { type: "blank" as const, blankIndex: nextIndex }]);
    setBlankAnswers([...blankAnswers, { index: nextIndex, correctAnswers: [] }]);
  };
  const removeSegment = (index: number) => {
    if (segments.length <= 1) return;
    const removedSegment = segments[index];
    setSegments(segments.filter((_, i) => i !== index));
    if (removedSegment.type === "blank" && removedSegment.blankIndex) setBlankAnswers(blankAnswers.filter((ba) => ba.index !== removedSegment.blankIndex));
  };
  const updateSegmentContent = (index: number, content: TextContent) => { const newSegments = [...segments]; newSegments[index] = { ...newSegments[index], content }; setSegments(newSegments); };
  const addOptionBankItem = () => setOptionBankItems([...optionBankItems, { chinese: [""], pinyin: [""] }]);
  const removeOptionBankItem = (index: number) => setOptionBankItems(optionBankItems.filter((_, i) => i !== index));
  const updateOptionBankItem = (index: number, content: TextContent) => { const newItems = [...optionBankItems]; newItems[index] = content; setOptionBankItems(newItems); };
  const addAnswerToBlank = (blankIndex: number, content: TextContent) => {
    const newBlankAnswers = [...blankAnswers];
    const existingAnswer = newBlankAnswers.find((ba) => ba.index === blankIndex);
    if (existingAnswer) existingAnswer.correctAnswers = [...existingAnswer.correctAnswers, content];
    else newBlankAnswers.push({ index: blankIndex, correctAnswers: [content] });
    setBlankAnswers(newBlankAnswers);
  };
  const removeAnswerFromBlank = (blankIndex: number, answerIndex: number) => {
    const newBlankAnswers = [...blankAnswers];
    const existingAnswer = newBlankAnswers.find((ba) => ba.index === blankIndex);
    if (existingAnswer) existingAnswer.correctAnswers = existingAnswer.correctAnswers.filter((_, i) => i !== answerIndex);
    setBlankAnswers(newBlankAnswers);
  };
  const updateAnswerInBlank = (blankIndex: number, answerIndex: number, content: TextContent) => {
    const newBlankAnswers = [...blankAnswers];
    const existingAnswer = newBlankAnswers.find((ba) => ba.index === blankIndex);
    if (existingAnswer) existingAnswer.correctAnswers[answerIndex] = content;
    setBlankAnswers(newBlankAnswers);
  };
  const getAnswersForBlank = (blankIndex: number): TextContent[] => blankAnswers.find((ba) => ba.index === blankIndex)?.correctAnswers || [];

  return (
    <div className="max-w-2xl mx-auto">
      <Alert message="Công Cụ Tạo Câu Hỏi Điền Chỗ Trống" description="Xây dựng câu bằng các đoạn văn bản và chỗ trống." type="info" className="mb-6 rounded-xl" />

      {/* Section 1: Question Setup */}
      <SectionContainer>
        <SectionHeader step={1} title="Thiết Lập Câu Hỏi" description="Nhập hướng dẫn câu hỏi" icon={<QuestionCircleOutlined />} />
        <FormField label="Hướng dẫn" required>
          <Form.Item name={["data", "instruction"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
            <TextArea rows={2} className="rounded-lg" placeholder="VD: Điền từ tiếng Trung thích hợp vào chỗ trống" />
          </Form.Item>
        </FormField>
      </SectionContainer>

      {/* Section 2: Segment Builder */}
      <SectionContainer>
        <SectionHeader step={2} title="Xây Dựng Câu" description="Thêm văn bản và chỗ trống" icon={<EditOutlined />} />
        <div className="flex gap-2 mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={addTextSegment} className="rounded-lg">Thêm Văn Bản</Button>
          <Button icon={<PlusOutlined />} onClick={addBlankSegment} className="rounded-lg bg-orange-100 border-orange-300 text-orange-700">Thêm Chỗ Trống</Button>
        </div>
        <div className="space-y-3">
          {segments.map((segment, index) => (
            <div key={index} className={`p-4 rounded-xl border-2 ${segment.type === "blank" ? "bg-orange-50 border-orange-300" : "bg-white border-gray-200"}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-600">Đoạn {index + 1}</span>
                  {segment.type === "blank" ? <Tag color="orange">Chỗ Trống #{segment.blankIndex}</Tag> : <Tag color="blue">Văn Bản</Tag>}
                </div>
                {segments.length > 1 && <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => removeSegment(index)} danger />}
              </div>
              {segment.type === "text" ? (
                <ChineseInput value={segment.content} onChange={(content: TextContent) => updateSegmentContent(index, content)} placeholder="Nhập chữ Trung..." />
              ) : (
                <div className="py-4 px-3 bg-yellow-200 border-2 border-dashed border-orange-400 rounded-lg text-center">
                  <div className="text-lg font-bold text-yellow-700">CHỖ TRỐNG #{segment.blankIndex}</div>
                  <div className="text-xs text-yellow-600 mt-1">Học sinh sẽ điền vào đây</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <Text strong>Xem Trước Câu:</Text>
          <div className="mt-2 flex flex-wrap items-end gap-1">
            {segments.map((segment, index) => (
              <span key={index}>
                {segment.type === "text" ? <TextContentDisplay content={segment.content} /> : <span className="inline-block px-3 py-1 bg-yellow-200 border border-dashed border-orange-400 rounded text-orange-600 font-bold">____</span>}
              </span>
            ))}
          </div>
        </div>
      </SectionContainer>

      {/* Section 3: Vietnamese Translation */}
      <SectionContainer>
        <SectionHeader step={3} title="Bản Dịch" description="Nhập bản dịch tiếng Việt" icon={<EditOutlined />} />
        <FormField label="Bản dịch tiếng Việt" required>
          <Form.Item name={["data", "vietnamese"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
            <TextArea rows={2} className="rounded-lg" placeholder="VD: Tôi [1] học [2]." />
          </Form.Item>
        </FormField>
      </SectionContainer>

      {/* Section 4: Option Bank */}
      <SectionContainer>
        <SectionHeader step={4} title="Ngân Hàng Lựa Chọn" description="Thêm các từ/cụm từ gợi ý" icon={<OrderedListOutlined />} />
        <div className="space-y-3">
          {optionBankItems.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1"><ChineseInput value={item} onChange={(content: TextContent) => updateOptionBankItem(index, content)} placeholder="Nhập từ..." /></div>
              <Button type="text" icon={<DeleteOutlined />} onClick={() => removeOptionBankItem(index)} danger />
            </div>
          ))}
        </div>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addOptionBankItem} className="w-full mt-4 h-10 rounded-lg">Thêm Lựa Chọn</Button>
        {optionBankItems.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <Text strong>Lựa Chọn Hiện Có:</Text>
            <div className="mt-2 flex flex-wrap gap-2">
              {optionBankItems.map((item, index) => <Tag key={index} color="blue" className="py-1 px-2"><TextContentDisplay content={item} size="small" /></Tag>)}
            </div>
          </div>
        )}
      </SectionContainer>

      {/* Section 5: Correct Answers */}
      <SectionContainer>
        <SectionHeader step={5} title="Đáp Án Đúng" description="Xác định đáp án cho mỗi chỗ trống" icon={<CheckCircleOutlined />} />
        {getBlankIndices().length === 0 ? (
          <Alert message="Chưa có chỗ trống" description="Thêm chỗ trống trong Bước 2 để đặt đáp án." type="info" showIcon className="rounded-lg" />
        ) : (
          <div className="space-y-4">
            {getBlankIndices().map((blankIndex) => {
              const answers = getAnswersForBlank(blankIndex);
              return (
                <div key={blankIndex} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><Tag color="orange">Chỗ Trống #{blankIndex}</Tag><Text type="secondary">({answers.length} đáp án)</Text></div>
                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addAnswerToBlank(blankIndex, { text: "" })} className="rounded-lg">Thêm Đáp Án</Button>
                  </div>
                  {answers.length === 0 ? (
                    <Text type="secondary">Chưa có đáp án. Nhấn "Thêm Đáp Án" để bắt đầu.</Text>
                  ) : (
                    <div className="space-y-2">
                      {answers.map((answer, answerIndex) => (
                        <div key={answerIndex} className="flex items-start gap-2">
                          <div className="flex-1"><ChineseInput value={answer} onChange={(content: TextContent) => updateAnswerInBlank(blankIndex, answerIndex, content)} placeholder="Nhập đáp án..." compact /></div>
                          <Button type="text" icon={<DeleteOutlined />} onClick={() => removeAnswerFromBlank(blankIndex, answerIndex)} danger />
                        </div>
                      ))}
                    </div>
                  )}
                  {optionBankItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Text className="text-xs text-gray-500">Chọn nhanh từ ngân hàng:</Text>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {optionBankItems.slice(0, 5).map((item, idx) => <Button key={idx} size="small" className="text-xs rounded-lg" onClick={() => addAnswerToBlank(blankIndex, item)}>{getDisplayText(item)}</Button>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {getBlankIndices().length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <Text strong className="text-green-800">Tóm Tắt Đáp Án:</Text>
            <div className="mt-2 space-y-1">
              {getBlankIndices().map((blankIndex) => {
                const answers = getAnswersForBlank(blankIndex);
                return (
                  <div key={blankIndex} className="flex items-center gap-2">
                    <Tag color="orange">#{blankIndex}</Tag><span>→</span>
                    {answers.length > 0 ? answers.map((answer, idx) => <Tag key={idx} color="green">{getDisplayText(answer)}</Tag>) : <Tag color="red">Chưa đặt đáp án</Tag>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SectionContainer>

      {/* Section 6: Explanation */}
      <SectionContainer>
        <SectionHeader step={6} title="Cài Đặt Bổ Sung" description="Giải thích và trạng thái" icon={<CheckCircleOutlined />} />
        <FormField label="Giải thích" required>
          <Form.Item name={["data", "explanation"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
            <TextArea rows={3} className="rounded-lg" placeholder="Giải thích đáp án đúng, quy tắc ngữ pháp..." />
          </Form.Item>
        </FormField>
        <FormField label="Kích hoạt">
          <Form.Item name="isActive" valuePropName="checked" initialValue={true} className="mb-0">
            <Switch />
          </Form.Item>
        </FormField>
      </SectionContainer>
    </div>
  );
};

export default FillTextTextForm;
