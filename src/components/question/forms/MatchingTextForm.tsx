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
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { MatchingTextQuestionData } from "@/types/questionType";
import { pinyin } from "pinyin-pro";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

interface MatchingTextFormProps {
  form: any;
  initialValues?: Partial<MatchingTextQuestionData>;
}

type LeftColumnItem = MatchingTextQuestionData["leftColumn"][0];
type RightColumnItem = MatchingTextQuestionData["rightColumn"][0];

const MatchingTextForm: React.FC<MatchingTextFormProps> = ({
  form,
  initialValues,
}) => {
  const [leftItems, setLeftItems] = useState<LeftColumnItem[]>([]);
  const [rightItems, setRightItems] = useState<RightColumnItem[]>([]);

  // Watch for changes in the columns to update the select options
  const leftValues = Form.useWatch(["data", "leftColumn"], form) || [];
  const rightValues = Form.useWatch(["data", "rightColumn"], form) || [];

  // Generate pinyin for Chinese text
  const generatePinyin = (text: string): string => {
    if (!text || !text.trim()) return "";

    try {
      return pinyin(text, { toneType: "symbol" });
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
      <Form.Item
        label="Instruction"
        name={["data", "instruction"]}
        rules={[{ required: true, message: "Please enter instruction" }]}
      >
        <TextArea
          placeholder="Enter instruction for the student (e.g., 'Match the Chinese words with their English meaning')"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Card
        title="Left Column (Chinese)"
        bordered={false}
        style={{ marginBottom: 16 }}
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
                    >
                      Regenerate Pinyin
                    </Button>

                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>

                  {/* Display Pinyin Tag if exists */}
                  {form.getFieldValue([
                    "data",
                    "leftColumn",
                    index,
                    "pinyin",
                  ]) && (
                    <div style={{ marginLeft: 68, marginTop: -8 }}>
                      <Tag color="blue">
                        {form.getFieldValue([
                          "data",
                          "leftColumn",
                          index,
                          "pinyin",
                        ])}
                      </Tag>
                    </div>
                  )}
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

      <Card
        title="Right Column (English)"
        bordered={false}
        style={{ marginBottom: 16 }}
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
                    <Input placeholder="Enter English text" />
                  </Form.Item>

                  <MinusCircleOutlined onClick={() => remove(name)} />
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

      <Card
        title="Correct Matches"
        bordered={false}
        extra={
          <Text type="secondary">
            Select matching pairs from the left and right columns
          </Text>
        }
      >
        <Form.List
          name={["data", "correctMatches"]}
          initialValue={[{ left: "", right: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "left"]}
                    rules={[{ required: true, message: "Select left item" }]}
                    style={{ width: "200px" }}
                  >
                    <Select placeholder="Select left item">
                      {leftItems.map((item, index) => (
                        <Option key={`left-option-${index}`} value={item.id}>
                          {item.id}: {item.text}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Text type="secondary">matches</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "right"]}
                    rules={[{ required: true, message: "Select right item" }]}
                    style={{ width: "200px" }}
                  >
                    <Select placeholder="Select right item">
                      {rightItems.map((item, index) => (
                        <Option key={`right-option-${index}`} value={item.id}>
                          {item.id}: {item.text}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
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
      </Card>
    </div>
  );
};

export default MatchingTextForm;
