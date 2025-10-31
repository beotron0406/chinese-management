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
      <Card title="Question Setup" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Question Instruction"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Please enter the question instruction" }]}
        >
          <TextArea
            placeholder="Enter instruction for the student (e.g., 'Match the Chinese words with their English meaning')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Left Column */}
      <Card
        title="Left Column (Chinese)"
        style={{ marginBottom: '24px' }}
      >
        <Form.List
          name={["data", "leftColumn"]}
          initialValue={[{ id: "1", text: "", pinyin: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <Space
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
                    {/* ID (Number) */}
                    <Form.Item
                      {...restField}
                      name={[name, "id"]}
                      initialValue={`${index + 1}`}
                      style={{ width: "60px", marginRight: 8 }}
                    >
                      <Input
                        disabled
                        style={{ textAlign: "center", fontWeight: "bold" }}
                        placeholder="#"
                      />
                    </Form.Item>

                    {/* Chinese Text */}
                    <Form.Item
                      {...restField}
                      name={[name, "text"]}
                      rules={[{ required: true, message: "Missing text" }]}
                      style={{ width: "300px" }}
                    >
                      <Input
                        placeholder="Enter Chinese text"
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
                      Regenerate Pinyin
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
                    <div style={{ marginLeft: 68, marginTop: -8, marginBottom: 8 }}>
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
                    style={{ display: 'none' }}
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
                  Add Left Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Right Column */}
      <Card
        title="Right Column (English/Translation)"
        style={{ marginBottom: '24px' }}
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
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  {/* ID (Letter) */}
                  <Form.Item
                    {...restField}
                    name={[name, "id"]}
                    initialValue={generateRightId(index)}
                    style={{ width: "60px", marginRight: 8 }}
                  >
                    <Input
                      disabled
                      style={{ textAlign: "center", fontWeight: "bold" }}
                      placeholder="Letter"
                    />
                  </Form.Item>

                  {/* English Text */}
                  <Form.Item
                    {...restField}
                    name={[name, "text"]}
                    rules={[{ required: true, message: "Missing text" }]}
                    style={{ width: "300px" }}
                  >
                    <Input placeholder="Enter English/translation text" />
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
                  Add Right Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Correct Matches */}
      <Card
        title="Correct Matches"
        extra={
          <Text type="secondary">
            Select matching pairs from the left and right columns
          </Text>
        }
        style={{ marginBottom: '24px' }}
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
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Text strong>Match {index + 1}:</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "left"]}
                    rules={[{ required: true, message: "Select left item" }]}
                    style={{ width: "200px" }}
                  >
                    <Select placeholder="Select left item">
                      {leftItems.map((item, itemIndex) => (
                        <Option key={`left-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.text}
                          {item.pinyin && (
                            <span style={{ color: '#666', fontSize: '12px' }}>
                              {' '}({item.pinyin})
                            </span>
                          )}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Text type="secondary">matches with</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "right"]}
                    rules={[{ required: true, message: "Select right item" }]}
                    style={{ width: "200px" }}
                  >
                    <Select placeholder="Select right item">
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
                  Add Match
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Match Preview */}
        {form.getFieldValue(['data', 'correctMatches'])?.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
            <Text strong>Match Summary:</Text>
            <div style={{ marginTop: '8px' }}>
              {form.getFieldValue(['data', 'correctMatches'])?.map((match: any, index: number) => {
                const leftItem = leftItems.find(item => item.id === match.left);
                const rightItem = rightItems.find(item => item.id === match.right);
                
                if (leftItem && rightItem) {
                  return (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <Text>
                        {leftItem.id}: {leftItem.text} 
                        {leftItem.pinyin && <span style={{ color: '#666' }}> ({leftItem.pinyin})</span>}
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
      <Card title="Additional Settings" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Explanation (Optional)"
          name={['data', 'explanation']}
          help="Provide an explanation that will be shown after the student answers"
        >
          <TextArea
            rows={3}
            placeholder="Explain the matching logic or provide additional context..."
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
    </div>
  );
};

export default MatchingTextTextForm;