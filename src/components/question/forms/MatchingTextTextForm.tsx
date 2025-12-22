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
  ReloadOutlined,
} from "@ant-design/icons";
import { MatchingTextTextQuestionData } from "@/types/questionType";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";

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
  const [leftItems, setLeftItems] = useState<MatchingTextTextQuestionData['leftColumn']>([]);
  const [rightItems, setRightItems] = useState<MatchingTextTextQuestionData['rightColumn']>([]);

  // Watch for changes in the columns to update the select options
  const leftValues = Form.useWatch(["data", "leftColumn"], form) || [];
  const rightValues = Form.useWatch(["data", "rightColumn"], form) || [];

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      if (data.leftColumn) {
        setLeftItems(data.leftColumn);
      }
      
      if (data.rightColumn) {
        setRightItems(data.rightColumn);
      }
    }
  }, [initialValues]);

  // Generate pinyin for Chinese text
  const generatePinyin = (text: string): string => {
    if (!text || !text.trim()) return "";

    try {
      return pinyin(text, { 
        toneType: "symbol",
        type: 'array'
      }).join(' ');
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
      return "";
    }
  };

  // Generate ID for right column (A, B, C...)
  const generateRightId = (index: number): string => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
  };

  // Handle left column item change
  const handleLeftItemChange = (index: number, value: string) => {
    if (!value.trim()) return;

    // Generate pinyin
    const pinyinText = generatePinyin(value);

    // Get current left items
    const leftItems = [...(form.getFieldValue(["data", "leftColumn"]) || [])];

    // Update the pinyin
    if (leftItems[index]) {
      leftItems[index] = {
        ...leftItems[index],
        text: value,
        pinyin: pinyinText,
      };

      // Update form
      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          leftColumn: leftItems,
        },
      });
    }
  };

  // Update left and right items when form values change
  useEffect(() => {
    const updatedLeftItems = leftValues
      .map((item: any, index: number) => ({
        id: item?.id || `${index + 1}`, // Using numbers starting from 1
        text: item?.text || "",
        pinyin: item?.pinyin || "",
      }))
      .filter((item: any) => item.text);

    setLeftItems(updatedLeftItems);
  }, [leftValues]);

  useEffect(() => {
    const updatedRightItems = rightValues
      .map((item: any, index: number) => ({
        id: item?.id || generateRightId(index), // Using letters A, B, C...
        text: item?.text || "",
      }))
      .filter((item: any) => item.text);

    setRightItems(updatedRightItems);
  }, [rightValues]);

  // Regenerate pinyin for an item
  const regeneratePinyin = (index: number) => {
    const leftItems = [...(form.getFieldValue(["data", "leftColumn"]) || [])];
    const item = leftItems[index];

    if (item && item.text) {
      const pinyinText = generatePinyin(item.text);
      leftItems[index] = { ...item, pinyin: pinyinText };

      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          leftColumn: leftItems,
        },
      });
    }
  };

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
            placeholder="Nhập hướng dẫn cho học viên (ví dụ: 'Ghép các từ tiếng Trung với nghĩa tiếng Anh của chúng')"
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
          initialValue={[{ id: "1", text: "", pinyin: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div key={key} className="mb-4">
                  <Space
                    className="flex mb-2"
                    align="baseline"
                  >
                    {/* ID (Number) */}
                    <Form.Item
                      {...restField}
                      name={[name, "id"]}
                      initialValue={`${index + 1}`}
                      className="w-[60px] mr-2"
                    >
                      <Input
                        disabled
                        className="text-center font-bold"
                        placeholder="#"
                      />
                    </Form.Item>

                    {/* Chinese Text */}
                    <Form.Item
                      {...restField}
                      name={[name, "text"]}
                      rules={[{ required: true, message: "Thiếu văn bản" }]}
                      className="w-[300px]"
                    >
                      <Input
                        placeholder="Nhập chữ Trung"
                        onChange={(e) =>
                          handleLeftItemChange(index, e.target.value)
                        }
                      />
                    </Form.Item>

                    {/* Regenerate Pinyin Button */}
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => regeneratePinyin(index)}
                      size="small"
                      type="default"
                    >
                      Tạo Lại Pinyin
                    </Button>

                    {fields.length > 1 && (
                      <Button
                        danger
                        size="small"
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    )}
                  </Space>

                  {/* Display Pinyin Tag if exists */}
                  {form.getFieldValue([
                    "data",
                    "leftColumn",
                    index,
                    "pinyin",
                  ]) && (
                    <div className="ml-[68px] -mt-2 mb-2">
                      <Tag color="blue">
                        Pinyin: {form.getFieldValue([
                          "data",
                          "leftColumn",
                          index,
                          "pinyin",
                        ])}
                      </Tag>
                    </div>
                  )}

                  {/* Hidden pinyin field */}
                  <Form.Item
                    {...restField}
                    name={[name, "pinyin"]}
                    className="hidden"
                  >
                    <Input />
                  </Form.Item>
                </div>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({ id: `${fields.length + 1}`, text: "", pinyin: "" })
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
        title="Cột Phải (Tiếng Anh/Bản Dịch)"
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
                    <Input placeholder="Nhập văn bản tiếng Anh/bản dịch" />
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
                      {leftItems.map((item, itemIndex) => (
                        <Option key={`left-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.text}
                          {item.pinyin && (
                            <span className="text-gray-500 text-xs">
                              {' '}({item.pinyin})
                            </span>
                          )}
                        </Option>
                      ))}
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
        {form.getFieldValue(['data', 'correctMatches'])?.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <Text strong>Tóm Tắt Các Cặp:</Text>
            <div className="mt-2">
              {form.getFieldValue(['data', 'correctMatches'])?.map((match: any, index: number) => {
                const leftItem = leftItems.find(item => item.id === match.left);
                const rightItem = rightItems.find(item => item.id === match.right);
                
                if (leftItem && rightItem) {
                  return (
                    <div key={index} className="mb-1">
                      <Text>
                        {leftItem.id}: {leftItem.text} 
                        {leftItem.pinyin && <span className="text-gray-500"> ({leftItem.pinyin})</span>}
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