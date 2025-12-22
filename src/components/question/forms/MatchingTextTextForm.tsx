"use client";
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Select,
  Typography,
  Tag,
  Switch,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { MatchingTextTextQuestionData } from "@/types/questionType";
import type { FormInstance } from "antd/es/form";
import { TextContent } from "@/types/textContent";
import TextContentInput from "@/components/shared/TextContentInput";

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

const MatchingTextTextForm: React.FC<MatchingTextTextFormProps> = ({
  form,
  initialValues,
}) => {
  const [leftItems, setLeftItems] = useState<Array<{id: string; content: TextContent}>>([]);;
  const [rightItems, setRightItems] = useState<MatchingTextTextQuestionData['rightColumn']>([]);

  // Watch for changes in the columns to update the select options
  const leftValues = Form.useWatch(["data", "leftColumn"], form) || [];
  const rightValues = Form.useWatch(["data", "rightColumn"], form) || [];
  const correctMatches = Form.useWatch(["data", "correctMatches"], form) || [];

  // Helper functions to extract display text and pinyin from TextContent
  const getDisplayText = (content: TextContent): string => {
    if (content?.chinese && content.chinese.length > 0) {
      return content.chinese.filter(c => c).join('');
    }
    return content?.text || '';
  };

  const getDisplayPinyin = (content: TextContent): string => {
    if (content?.pinyin && content.pinyin.length > 0) {
      return content.pinyin.filter(p => p).join(' ');
    }
    return '';
  };

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      if (data.leftColumn) {
        // Convert old format to new TextContent format
        const converted = data.leftColumn.map(item => ({
          id: item.id,
          content: item.content || (item.text ? (
            item.pinyin 
              ? { chinese: [item.text], pinyin: [item.pinyin] }
              : { text: item.text }
          ) : { text: '' })
        }));
        setLeftItems(converted);
      }
      
      if (data.rightColumn) {
        setRightItems(data.rightColumn);
      }
    }
  }, [initialValues]);

  // Generate ID for right column (A, B, C...)
  const generateRightId = (index: number): string => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
  };

  // Handle left column item TextContent change
  const handleLeftItemChange = (index: number, content: TextContent) => {
    // Get current left items
    const currentLeftItems = [...(form.getFieldValue(["data", "leftColumn"]) || [])];

    // Update the item with TextContent
    if (currentLeftItems[index]) {
      currentLeftItems[index] = {
        ...currentLeftItems[index],
        content: content,
        // Also keep legacy fields for compatibility
        text: getDisplayText(content),
        pinyin: getDisplayPinyin(content),
      };

      // Update form
      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          leftColumn: currentLeftItems,
        },
      });
    }
  };

  // Update left and right items when form values change
  useEffect(() => {
    const updatedLeftItems = leftValues
      .map((item: any, index: number) => {
        const content = item?.content || (item?.text ? (
          item.pinyin 
            ? { chinese: [item.text], pinyin: [item.pinyin] }
            : { text: item.text }
        ) : { text: '' });
        return {
          id: item?.id || `${index + 1}`,
          content,
        };
      })
      .filter((item: any) => getDisplayText(item.content));

    setLeftItems(updatedLeftItems);
  }, [leftValues]);

  useEffect(() => {
    const updatedRightItems = rightValues
      .map((item: any, index: number) => ({
        id: item?.id || generateRightId(index),
        text: item?.text || "",
      }))
      .filter((item: any) => item.text);

    setRightItems(updatedRightItems);
  }, [rightValues]);

  return (
    <div>
      {/* Question Setup */}
      <Card title="Thiết Lập Câu Hỏi" className="mb-6">
        <Form.Item
          label="1. Hướng Dẫn Câu Hỏi *"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Vui lòng nhập hướng dẫn câu hỏi" }]}
        >
          <TextArea
            placeholder="Nhập hướng dẫn cho học viên (ví dụ: 'Ghép các từ tiếng Trung với nghĩa tiếng Việt của chúng')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Left Column */}
      <Card
        title="Cột Trái (Tiếng Trung)"
        className="mb-6"
      >
        <Form.List
          name={["data", "leftColumn"]}
          initialValue={[{ id: "1", content: { text: '' } }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => {
                const currentItem = form.getFieldValue(["data", "leftColumn", index]) || {};
                const textContent: TextContent = currentItem.content || { text: '' };
                
                return (
                  <div key={key} className="mb-4 p-3 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      {/* ID (Number) */}
                      <Form.Item
                        {...restField}
                        name={[name, "id"]}
                        initialValue={`${index + 1}`}
                        className="w-[60px] mb-0"
                      >
                        <Input
                          disabled
                          className="text-center font-bold"
                          placeholder="#"
                        />
                      </Form.Item>

                      {fields.length > 1 && (
                        <Button
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      )}
                    </div>

                    {/* TextContentInput for Chinese Text */}
                    <div className="mt-2">
                      <Text strong className="block mb-2">Nội dung văn bản</Text>
                      <TextContentInput
                        value={textContent}
                        onChange={(content) => handleLeftItemChange(index, content)}
                        placeholder="Nhập chữ Trung hoặc văn bản"
                      />
                    </div>

                    {/* Hidden fields for form data structure */}
                    <Form.Item
                      {...restField}
                      name={[name, "content"]}
                      className="hidden"
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "text"]}
                      className="hidden"
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "pinyin"]}
                      className="hidden"
                    >
                      <Input />
                    </Form.Item>
                  </div>
                );
              })}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({ id: `${fields.length + 1}`, content: { text: '' } })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Mục Trái
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Right Column */}
      <Card
        title="Cột Phải (Tiếng Việt/Bản Dịch)"
        className="mb-6"
      >
        <Form.List
          name={["data", "rightColumn"]}
          initialValue={[{ id: "A", text: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Space
                  key={key}
                  className="flex mb-2"
                  align="baseline"
                >
                  {/* ID (Letter) */}
                  <Form.Item
                    {...restField}
                    name={[name, "id"]}
                    initialValue={generateRightId(index)}
                    className="w-[60px] mr-2"
                  >
                    <Input
                      disabled
                      className="text-center font-bold"
                      placeholder="Chữ Cái"
                    />
                  </Form.Item>

                  {/* English Text */}
                  <Form.Item
                    {...restField}
                    name={[name, "text"]}
                    rules={[{ required: true, message: "Thiếu văn bản" }]}
                    className="w-[300px]"
                  >
                    <Input placeholder="Nhập văn bản tiếng Việt/bản dịch" />
                  </Form.Item>

                  {fields.length > 1 && (
                    <Button
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  )}
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      id: generateRightId(fields.length),
                      text: "",
                    })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Mục Phải
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Correct Matches */}
      <Card
        title="Các Cặp Đúng"
        extra={
          <Text type="secondary">
            Chọn các cặp ghép từ cột trái và cột phải
          </Text>
        }
        className="mb-6"
      >
        <Form.List
          name={["data", "correctMatches"]}
          initialValue={[{ left: "", right: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Space
                  key={key}
                  className="flex mb-2"
                  align="baseline"
                >
                  <Text strong>Cặp {index + 1}:</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "left"]}
                    rules={[{ required: true, message: "Chọn mục bên trái" }]}
                    className="w-[200px]"
                  >
                    <Select placeholder="Chọn mục bên trái">
                      {leftItems.map((item, itemIndex) => {
                        const displayText = getDisplayText(item.content);
                        const displayPinyin = getDisplayPinyin(item.content);
                        return (
                          <Option key={`left-option-${item.id}-${itemIndex}`} value={item.id}>
                            {item.id}: {displayText}
                            {displayPinyin && (
                              <span className="text-gray-500 text-xs">
                                {' '}({displayPinyin})
                              </span>
                            )}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                  <Text type="secondary">ghép với</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "right"]}
                    rules={[{ required: true, message: "Chọn mục bên phải" }]}
                    className="w-[200px]"
                  >
                    <Select placeholder="Chọn mục bên phải">
                      {rightItems.map((item, itemIndex) => (
                        <Option key={`right-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.text}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  {fields.length > 1 && (
                    <Button
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  )}
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ left: "", right: "" })}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Cặp
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Match Preview */}
        {correctMatches?.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <Text strong>Tóm Tắt Các Cặp:</Text>
            <div className="mt-2">
              {correctMatches?.map((match: any, index: number) => {
                const leftItem = leftItems.find(item => item.id === match.left);
                const rightItem = rightItems.find(item => item.id === match.right);
                
                if (leftItem && rightItem) {
                  const leftText = getDisplayText(leftItem.content);
                  const leftPinyin = getDisplayPinyin(leftItem.content);
                  return (
                    <div key={index} className="mb-1">
                      <Text>
                        {leftItem.id}: {leftText} 
                        {leftPinyin && <span className="text-gray-500"> ({leftPinyin})</span>}
                        {' → '}
                        {rightItem.id}: {rightItem.text}
                      </Text>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Additional Settings */}
      <Card title="Cài Đặt Thêm" className="mb-6">
        <Form.Item
          label="2. Giải Thích (Tùy Chọn)"
          name={['data', 'explanation']}
          help="Cung cấp giải thích sẽ được hiển thị sau khi học viên trả lời"
        >
          <TextArea
            rows={3}
            placeholder="Giải thích logic ghép hoặc cung cấp ngữ cảnh thêm..."
          />
        </Form.Item>

        <Form.Item
          label="3. Kích Hoạt"
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

export default MatchingTextTextForm;