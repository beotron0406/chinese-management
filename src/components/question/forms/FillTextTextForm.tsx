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
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { FillTextTextQuestionData } from "@/types/questionType";

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
  const [sentenceText, setSentenceText] = useState<string>("");
  const [generatedPinyin, setGeneratedPinyin] = useState<string>("");
  const [correctAnswerText, setCorrectAnswerText] = useState<string>("");

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      if (data.sentence) {
        setSentenceText(data.sentence);
      }
      
      if (data.pinyin) {
        setGeneratedPinyin(data.pinyin);
      }
      
      if (data.correctAnswer) {
        setCorrectAnswerText(data.correctAnswer);
      }
    }
  }, [initialValues]);

  // Generate pinyin for the sentence
  const generateSentencePinyin = (text: string) => {
    if (!text.trim()) return "";

    try {
      const pinyinText = pinyin(text, { 
        toneType: "symbol",
        type: 'array'
      }).join(' ');
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
      const pinyinText = pinyin(text, { 
        toneType: "symbol",
        type: 'array'
      }).join(' ');

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
      const pinyinText = pinyin(text, { 
        toneType: "symbol",
        type: 'array'
      }).join(' ');

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
      {/* Question Setup */}
      <Card title="Question Setup" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Question Instruction"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Please enter the question instruction" }]}
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
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="Pinyin will be auto-generated"
                value={generatedPinyin}
                style={{ width: 400 }}
                readOnly
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
          help="Optional English translation of the complete sentence"
        >
          <Input placeholder="Enter the English translation of the sentence" />
        </Form.Item>
      </Card>

      {/* Answer Options */}
      <Card 
        title="Answer Options" 
        extra={
          <Text type="secondary">
            Provide multiple choice options for the blank
          </Text>
        }
        style={{ marginBottom: '24px' }}
      >
        <Form.List 
          name={["data", "options"]}
          initialValue={[{ text: "", pinyin: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  size="small"
                  style={{ marginBottom: '12px' }}
                  title={`Option ${index + 1}`}
                  extra={
                    fields.length > 1 && (
                      <Button
                        danger
                        size="small"
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    )
                  }
                >
                  <Form.Item
                    {...restField}
                    label="Option Text"
                    name={[name, "text"]}
                    rules={[{ required: true, message: "Missing option text" }]}
                  >
                    <Input
                      placeholder="Enter option text (Chinese)"
                      style={{ fontSize: '16px' }}
                      onChange={(e) =>
                        generateOptionPinyin(name, e.target.value)
                      }
                    />
                  </Form.Item>

                  {/* Show pinyin for this option if available */}
                  {form.getFieldValue(["data", "options"]) &&
                    form.getFieldValue(["data", "options"])[name]?.pinyin && (
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Pinyin: </Text>
                        <Tag color="blue">
                          {form.getFieldValue(["data", "options"])[name].pinyin}
                        </Tag>
                      </div>
                    )}
                    
                  {/* Hidden form field for option pinyin */}
                  <Form.Item
                    {...restField}
                    name={[name, "pinyin"]}
                    style={{ display: "none" }}
                  >
                    <Input />
                  </Form.Item>
                </Card>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ text: "", pinyin: "" })}
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

      {/* Correct Answer */}
      <Card title="Correct Answer" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Correct Answer Text"
          name={["data", "correctAnswer"]}
          rules={[
            { required: true, message: "Please specify the correct answer" },
          ]}
        >
          <Input 
            placeholder="Enter the text of the correct answer" 
            onChange={(e) => handleCorrectAnswerChange(e.target.value)}
            style={{ fontSize: '16px' }}
          />
        </Form.Item>

        <Form.Item
          label="Correct Answer Pinyin"
          name={["data", "correctAnswerPinyin"]}
        >
          <Input 
            placeholder="Pinyin will be auto-generated when you type the correct answer" 
            readOnly
          />
        </Form.Item>

        {/* Preview */}
        {correctAnswerText && (
          <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
            <Text strong>Preview: </Text>
            <span style={{ fontSize: '16px', color: '#52c41a' }}>{correctAnswerText}</span>
            {form.getFieldValue(['data', 'correctAnswerPinyin']) && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Pinyin: {form.getFieldValue(['data', 'correctAnswerPinyin'])}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Additional Settings */}
      <Card title="Additional Settings" style={{ marginBottom: '24px' }}>
        <Form.Item 
          label="Explanation (Optional)" 
          name={["data", "explanation"]}
          help="Provide an explanation that will be shown after the student answers"
        >
          <TextArea
            placeholder="Explain why this is the correct answer or provide additional context..."
            autoSize={{ minRows: 2, maxRows: 4 }}
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

      {/* Preview Section */}
      {sentenceText && (
        <Card title="Question Preview" style={{ marginBottom: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
            <div style={{ marginBottom: '12px' }}>
              <Text strong>Sentence: </Text>
              <span style={{ fontSize: '18px' }}>{sentenceText}</span>
            </div>
            {generatedPinyin && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Pinyin: </Text>
                <span style={{ fontSize: '16px', color: '#1890ff' }}>{generatedPinyin}</span>
              </div>
            )}
            {form.getFieldValue(['data', 'english']) && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong>English: </Text>
                <span style={{ fontSize: '16px', color: '#666' }}>
                  {form.getFieldValue(['data', 'english'])}
                </span>
              </div>
            )}
            {correctAnswerText && (
              <div>
                <Text strong>Correct Answer: </Text>
                <span style={{ fontSize: '16px', color: '#52c41a' }}>{correctAnswerText}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default FillTextTextForm;