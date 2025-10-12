import React, { useState } from "react";
import { Form, Input, Button, Card, Space, Tag, Typography } from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { FillBlankQuestionData } from "@/types/questionType";
import { pinyin } from "pinyin-pro";

const { TextArea } = Input;
const { Text } = Typography;

interface FillBlankFormProps {
  form: any;
}

const FillBlankForm: React.FC<FillBlankFormProps> = ({ form }) => {
  const [sentenceText, setSentenceText] = useState<string>("");
  const [generatedPinyin, setGeneratedPinyin] = useState<string>("");
  const [correctAnswerText, setCorrectAnswerText] = useState<string>("");

  // Generate pinyin for the sentence
  const generateSentencePinyin = (text: string) => {
    if (!text.trim()) return "";

    try {
      const pinyinText = pinyin(text, { toneType: "symbol" });
      setGeneratedPinyin(pinyinText);

      // Update form
      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          pinyin: pinyinText,
        },
      });

      return pinyinText;
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
      return "";
    }
  };

  // Handle sentence change
  const handleSentenceChange = (value: string) => {
    setSentenceText(value);
    generateSentencePinyin(value);
  };

  // Generate pinyin for correct answer
  const generateCorrectAnswerPinyin = (text: string) => {
    if (!text.trim()) return;

    try {
      const pinyinText = pinyin(text, { toneType: "symbol" });

      // Update form
      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          correctAnswerPinyin: pinyinText,
        },
      });

      return pinyinText;
    } catch (error) {
      console.warn("Failed to generate correct answer pinyin:", error);
    }
  };

  // Handle correct answer change
  const handleCorrectAnswerChange = (value: string) => {
    setCorrectAnswerText(value);
    generateCorrectAnswerPinyin(value);
  };

  // Generate pinyin for an option
  const generateOptionPinyin = (optionIndex: number, text: string) => {
    if (!text.trim()) return;

    try {
      const pinyinText = pinyin(text, { toneType: "symbol" });

      // Get current options or initialize empty array
      const options = [...(form.getFieldValue(["data", "options"]) || [])];
      
      // Update the pinyin for this option
      if (!options[optionIndex]) {
        options[optionIndex] = { text, pinyin: pinyinText };
      } else {
        options[optionIndex] = { 
          ...options[optionIndex], 
          text, 
          pinyin: pinyinText 
        };
      }

      // Update form
      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          options,
        },
      });

      return pinyinText;
    } catch (error) {
      console.warn("Failed to generate option pinyin:", error);
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
          placeholder="Enter instruction for the student (e.g., 'Fill in the blank with the correct word')"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Form.Item
        label="Sentence (use ___ for the blank)"
        name={["data", "sentence"]}
        rules={[
          { required: true, message: "Please enter the sentence" },
          {
            pattern: /___/,
            message: "Sentence must contain ___ to indicate the blank",
          },
        ]}
      >
        <TextArea
          placeholder="Enter the sentence with ___ for the blank (e.g., '我喜欢吃___。')"
          autoSize={{ minRows: 2, maxRows: 4 }}
          onChange={(e) => handleSentenceChange(e.target.value)}
          style={{ fontSize: "16px" }}
        />
      </Form.Item>

      {/* Pinyin with simplified control */}
      <Form.Item label="Pinyin">
        <Space>
          <Form.Item
            name={["data", "pinyin"]}
            rules={[{ required: true, message: "Please enter the pinyin" }]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="Enter the pinyin for the sentence"
              value={generatedPinyin}
              style={{ width: 300 }}
            />
          </Form.Item>
          {sentenceText && (
            <Button
              icon={<ReloadOutlined />}
              onClick={() => generateSentencePinyin(sentenceText)}
            >
              Regenerate Pinyin
            </Button>
          )}
        </Space>
      </Form.Item>

      {/* Pinyin Preview */}
      {generatedPinyin && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ margin: "8px 0" }}>
            <Text strong>Generated Pinyin:</Text>
          </div>
          <div
            style={{
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "6px",
              fontSize: "16px",
              color: "#1890ff",
            }}
          >
            {generatedPinyin}
          </div>
        </div>
      )}

      <Form.Item
        label="English Translation"
        name={["data", "english"]}
        rules={[
          { required: true, message: "Please enter the English translation" },
        ]}
      >
        <Input placeholder="Enter the English translation of the sentence" />
      </Form.Item>

      {/* Options matching the FillBlankQuestionData structure */}
      <Card title="Options" bordered={false}>
        <Form.List name={["data", "options"]}>
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
                    name={[name, "text"]}
                    rules={[{ required: true, message: "Missing option text" }]}
                  >
                    <Input
                      placeholder="Option text"
                      style={{ width: 300 }}
                      onChange={(e) =>
                        generateOptionPinyin(name, e.target.value)
                      }
                    />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />

                  {/* Show pinyin for this option if available */}
                  {form.getFieldValue(["data", "options"]) &&
                    form.getFieldValue(["data", "options"])[name]?.pinyin && (
                      <Tag color="green">
                        {form.getFieldValue(["data", "options"])[name].pinyin}
                      </Tag>
                    )}
                    
                  {/* Hidden form field for option pinyin */}
                  <Form.Item
                    {...restField}
                    name={[name, "pinyin"]}
                    style={{ display: "none" }}
                  >
                    <Input />
                  </Form.Item>
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Option
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Form.Item
        label="Correct Answer"
        name={["data", "correctAnswer"]}
        rules={[
          { required: true, message: "Please specify the correct answer" },
        ]}
      >
        <Input 
          placeholder="Enter the text of the correct answer" 
          onChange={(e) => handleCorrectAnswerChange(e.target.value)}
        />
      </Form.Item>

      <Form.Item
        label="Correct Answer Pinyin"
        name={["data", "correctAnswerPinyin"]}
        rules={[
          { required: true, message: "Please enter the pinyin for the correct answer" },
        ]}
      >
        <Input placeholder="Pinyin will be auto-generated when you type the correct answer" />
      </Form.Item>

      <Form.Item label="Explanation" name={["data", "explanation"]}>
        <TextArea
          placeholder="Enter explanation that will be shown after answering"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>
    </div>
  );
};

export default FillBlankForm;