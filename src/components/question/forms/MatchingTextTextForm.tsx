"use client";
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Space,
  Select,
  Typography,
  Switch,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  BarsOutlined,
  LinkOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { MatchingTextTextQuestionData } from "@/types/questionType";
import type { FormInstance } from "antd/es/form";
import { TextContent } from "@/types/textContent";
import TextContentInput from "@/components/shared/TextContentInput";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

interface MatchingTextTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: MatchingTextTextQuestionData;
    isActive?: boolean;
  };
}

const MatchingTextTextForm: React.FC<MatchingTextTextFormProps> = ({ form, initialValues }) => {
  const [leftItems, setLeftItems] = useState<Array<{ id: string; content: TextContent }>>([]);
  const [rightItems, setRightItems] = useState<MatchingTextTextQuestionData["rightColumn"]>([]);

  const leftValues = Form.useWatch(["data", "leftColumn"], form) || [];
  const rightValues = Form.useWatch(["data", "rightColumn"], form) || [];
  const correctMatches = Form.useWatch(["data", "correctMatches"], form) || [];

  const getDisplayText = (content: TextContent): string => {
    if (content?.chinese && content.chinese.length > 0) return content.chinese.filter((c) => c).join("");
    return content?.text || "";
  };

  const getDisplayPinyin = (content: TextContent): string => {
    if (content?.pinyin && content.pinyin.length > 0) return content.pinyin.filter((p) => p).join(" ");
    return "";
  };

  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      if (data.leftColumn) {
        const converted = data.leftColumn.map((item) => ({
          id: item.id,
          content: item.content || (item.text ? (item.pinyin ? { chinese: [item.text], pinyin: [item.pinyin] } : { text: item.text }) : { text: "" }),
        }));
        setLeftItems(converted);
      }
      if (data.rightColumn) setRightItems(data.rightColumn);
    }
  }, [initialValues]);

  const generateRightId = (index: number): string => String.fromCharCode(65 + index);

  const handleLeftItemChange = (index: number, content: TextContent) => {
    const currentLeftItems = [...(form.getFieldValue(["data", "leftColumn"]) || [])];
    if (currentLeftItems[index]) {
      currentLeftItems[index] = {
        ...currentLeftItems[index],
        content,
        text: getDisplayText(content),
        pinyin: getDisplayPinyin(content),
      };
      form.setFieldsValue({ data: { ...form.getFieldValue("data"), leftColumn: currentLeftItems } });
    }
  };

  useEffect(() => {
    const updatedLeftItems = leftValues
      .map((item: any, index: number) => {
        const content = item?.content || (item?.text ? (item.pinyin ? { chinese: [item.text], pinyin: [item.pinyin] } : { text: item.text }) : { text: "" });
        return { id: item?.id || `${index + 1}`, content };
      })
      .filter((item: any) => getDisplayText(item.content));
    setLeftItems(updatedLeftItems);
  }, [leftValues]);

  useEffect(() => {
    const updatedRightItems = rightValues
      .map((item: any, index: number) => ({ id: item?.id || generateRightId(index), text: item?.text || "" }))
      .filter((item: any) => item.text);
    setRightItems(updatedRightItems);
  }, [rightValues]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Section 1: Question Setup */}
      <SectionContainer>
        <SectionHeader step={1} title="Thiết Lập Câu Hỏi" description="Nhập hướng dẫn cho học viên" icon={<QuestionCircleOutlined />} />
        <FormField label="Hướng dẫn câu hỏi" required>
          <Form.Item name={["data", "instruction"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
            <TextArea rows={2} className="rounded-lg" placeholder="VD: Ghép các từ tiếng Trung với nghĩa tiếng Việt" />
          </Form.Item>
        </FormField>
      </SectionContainer>

      {/* Section 2: Left Column */}
      <SectionContainer>
        <SectionHeader step={2} title="Cột Trái (Tiếng Trung)" description="Thêm các mục cần ghép" icon={<BarsOutlined />} />
        <Form.List name={["data", "leftColumn"]} initialValue={[{ id: "1", content: { text: "" } }]}>
          {(fields, { add, remove }) => (
            <>
              <div className="space-y-4">
                {fields.map(({ key, name, ...restField }, index) => {
                  const currentItem = form.getFieldValue(["data", "leftColumn", index]) || {};
                  const textContent: TextContent = currentItem.content || { text: "" };

                  return (
                    <div key={key} className="p-4 border-2 border-gray-200 rounded-xl bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold flex items-center justify-center">{index + 1}</span>
                          <span className="text-sm font-medium text-gray-600">Mục trái {index + 1}</span>
                        </div>
                        {fields.length > 1 && (
                          <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="rounded-lg" />
                        )}
                      </div>
                      <TextContentInput value={textContent} onChange={(content) => handleLeftItemChange(index, content)} placeholder="Nhập chữ Trung hoặc văn bản" />
                      <Form.Item {...restField} name={[name, "id"]} initialValue={`${index + 1}`} className="hidden"><Input /></Form.Item>
                      <Form.Item {...restField} name={[name, "content"]} className="hidden"><Input /></Form.Item>
                      <Form.Item {...restField} name={[name, "text"]} className="hidden"><Input /></Form.Item>
                      <Form.Item {...restField} name={[name, "pinyin"]} className="hidden"><Input /></Form.Item>
                    </div>
                  );
                })}
              </div>
              <Button type="dashed" onClick={() => add({ id: `${fields.length + 1}`, content: { text: "" } })} block icon={<PlusOutlined />} className="mt-4 h-10 rounded-lg">
                Thêm Mục Trái
              </Button>
            </>
          )}
        </Form.List>
      </SectionContainer>

      {/* Section 3: Right Column */}
      <SectionContainer>
        <SectionHeader step={3} title="Cột Phải (Tiếng Việt)" description="Thêm các mục đích" icon={<BarsOutlined />} />
        <Form.List name={["data", "rightColumn"]} initialValue={[{ id: "A", text: "" }]}>
          {(fields, { add, remove }) => (
            <>
              <div className="space-y-3">
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 font-bold flex items-center justify-center flex-shrink-0">{generateRightId(index)}</span>
                    <Form.Item {...restField} name={[name, "text"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0 flex-1">
                      <Input size="large" className="rounded-lg" placeholder="Nhập văn bản tiếng Việt/bản dịch" />
                    </Form.Item>
                    {fields.length > 1 && <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="rounded-lg" />}
                    <Form.Item {...restField} name={[name, "id"]} initialValue={generateRightId(index)} className="hidden"><Input /></Form.Item>
                  </div>
                ))}
              </div>
              <Button type="dashed" onClick={() => add({ id: generateRightId(fields.length), text: "" })} block icon={<PlusOutlined />} className="mt-4 h-10 rounded-lg">
                Thêm Mục Phải
              </Button>
            </>
          )}
        </Form.List>
      </SectionContainer>

      {/* Section 4: Correct Matches */}
      <SectionContainer>
        <SectionHeader step={4} title="Các Cặp Đúng" description="Chọn các cặp ghép đúng" icon={<LinkOutlined />} />
        <Form.List name={["data", "correctMatches"]} initialValue={[{ left: "", right: "" }]}>
          {(fields, { add, remove }) => (
            <>
              <div className="space-y-3">
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Text strong className="text-gray-600 w-16">Cặp {index + 1}:</Text>
                    <Form.Item {...restField} name={[name, "left"]} rules={[{ required: true, message: "Chọn" }]} className="mb-0 flex-1">
                      <Select placeholder="Chọn mục trái" size="large" className="rounded-lg">
                        {leftItems.map((item, itemIndex) => (
                          <Option key={`left-option-${item.id}-${itemIndex}`} value={item.id}>
                            {item.id}: {getDisplayText(item.content)} {getDisplayPinyin(item.content) && <span className="text-gray-400 text-xs">({getDisplayPinyin(item.content)})</span>}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <span className="text-gray-400">→</span>
                    <Form.Item {...restField} name={[name, "right"]} rules={[{ required: true, message: "Chọn" }]} className="mb-0 flex-1">
                      <Select placeholder="Chọn mục phải" size="large" className="rounded-lg">
                        {rightItems.map((item, itemIndex) => (
                          <Option key={`right-option-${item.id}-${itemIndex}`} value={item.id}>
                            {item.id}: {item.text}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    {fields.length > 1 && <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="rounded-lg" />}
                  </div>
                ))}
              </div>
              <Button type="dashed" onClick={() => add({ left: "", right: "" })} block icon={<PlusOutlined />} className="mt-4 h-10 rounded-lg">
                Thêm Cặp
              </Button>
            </>
          )}
        </Form.List>

        {correctMatches?.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Text strong className="text-blue-800">Tóm Tắt Các Cặp:</Text>
            <div className="mt-2 space-y-1">
              {correctMatches?.map((match: any, index: number) => {
                const leftItem = leftItems.find((item) => item.id === match.left);
                const rightItem = rightItems.find((item) => item.id === match.right);
                if (leftItem && rightItem) {
                  return (
                    <div key={index} className="text-blue-700">
                      {leftItem.id}: {getDisplayText(leftItem.content)} → {rightItem.id}: {rightItem.text}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </SectionContainer>

      {/* Section 5: Additional Settings */}
      <SectionContainer>
        <SectionHeader step={5} title="Cài Đặt Bổ Sung" description="Giải thích và trạng thái" icon={<CheckCircleOutlined />} />
        <FormField label="Giải thích" hint="Hiển thị sau khi học viên trả lời">
          <Form.Item name={["data", "explanation"]} className="mb-0">
            <TextArea rows={3} className="rounded-lg" placeholder="Giải thích logic ghép hoặc cung cấp ngữ cảnh thêm..." />
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

export default MatchingTextTextForm;