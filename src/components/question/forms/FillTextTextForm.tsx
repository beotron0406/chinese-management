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
  Select,
  Row,
  Col,
  Divider,
  Alert,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { FillTextTextQuestionData } from "@/types/questionType";

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

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
  const [sentenceParts, setSentenceParts] = useState<string[]>([""]);
  const [pinyinParts, setPinyinParts] = useState<string[]>([""]);
  const [optionBankItems, setOptionBankItems] = useState<string[]>([]);

  useEffect(() => {
    const subscription = form.getFieldValue(["data", "optionBank"]) || [];
    setOptionBankItems(subscription);
  }, [form.getFieldValue(["data", "optionBank"])]);

  // Handle option bank changes
  const handleOptionBankChange = () => {
    const currentOptions = form.getFieldValue(["data", "optionBank"]) || [];
    setOptionBankItems(currentOptions);
  };
  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;

      if (data.sentence && data.sentence.length > 0) {
        setSentenceParts(data.sentence);
      }

      if (data.pinyin && data.pinyin.length > 0) {
        setPinyinParts(data.pinyin);
      }
    }
  }, [initialValues]);

  // Generate pinyin for a sentence part
  const generatePartPinyin = (index: number, text: string) => {
    if (!text.trim() || text.match(/^\[\d+\]$/)) {
      // If it's a blank marker or empty, keep as is
      const newPinyinParts = [...pinyinParts];
      newPinyinParts[index] = text;
      setPinyinParts(newPinyinParts);

      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          pinyin: newPinyinParts,
        },
      });
      return;
    }

    try {
      const pinyinText = pinyin(text, {
        toneType: "symbol",
        type: "array",
      }).join(" ");

      const newPinyinParts = [...pinyinParts];
      newPinyinParts[index] = pinyinText;
      setPinyinParts(newPinyinParts);

      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          pinyin: newPinyinParts,
        },
      });
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
    }
  };

  // Handle sentence part change
  const handleSentencePartChange = (index: number, value: string) => {
    const newSentenceParts = [...sentenceParts];
    newSentenceParts[index] = value;
    setSentenceParts(newSentenceParts);

    // Ensure pinyin array has same length
    const newPinyinParts = [...pinyinParts];
    while (newPinyinParts.length < newSentenceParts.length) {
      newPinyinParts.push("");
    }
    setPinyinParts(newPinyinParts);

    // Update form
    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        sentence: newSentenceParts,
      },
    });

    // Generate pinyin for this part
    generatePartPinyin(index, value);
  };

  // Handle pinyin part change (manual edit)
  const handlePinyinPartChange = (index: number, value: string) => {
    const newPinyinParts = [...pinyinParts];
    newPinyinParts[index] = value;
    setPinyinParts(newPinyinParts);

    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        pinyin: newPinyinParts,
      },
    });
  };

  // Add new sentence part
  const addSentencePart = () => {
    const newSentenceParts = [...sentenceParts, ""];
    const newPinyinParts = [...pinyinParts, ""];
    setSentenceParts(newSentenceParts);
    setPinyinParts(newPinyinParts);

    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        sentence: newSentenceParts,
        pinyin: newPinyinParts,
      },
    });
  };

  // Remove sentence part
  const removeSentencePart = (index: number) => {
    if (sentenceParts.length <= 1) return;

    const newSentenceParts = sentenceParts.filter((_, i) => i !== index);
    const newPinyinParts = pinyinParts.filter((_, i) => i !== index);
    setSentenceParts(newSentenceParts);
    setPinyinParts(newPinyinParts);

    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        sentence: newSentenceParts,
        pinyin: newPinyinParts,
      },
    });
  };

  // Check if part is a blank marker
  const isBlankMarker = (text: string) => {
    return /^\[\d+\]$/.test(text || "");
  };

  // Generate available blank numbers
  const getAvailableBlankNumbers = () => {
    const usedNumbers = sentenceParts
      .filter((part) => isBlankMarker(part))
      .map((part) => parseInt(part.match(/\d+/)?.[0] || "0"))
      .filter((num) => num > 0);

    const maxNum = Math.max(0, ...usedNumbers);
    const available = [];

    for (let i = 1; i <= maxNum + 1; i++) {
      if (!usedNumbers.includes(i)) {
        available.push(i);
      }
    }

    return available;
  };
  const markAsBlank = (index: number) => {
    // Find the next available blank number
    const usedNumbers = sentenceParts
      .filter((part) => isBlankMarker(part))
      .map((part) => parseInt(part.match(/\d+/)?.[0] || "0"))
      .filter((num) => num > 0);

    const nextBlankNumber = Math.max(0, ...usedNumbers) + 1;
    const blankMarker = `[${nextBlankNumber}]`;

    handleSentencePartChange(index, blankMarker);
  };

  // Unmark a blank (convert back to regular text)
  const unmarkBlank = (index: number) => {
    handleSentencePartChange(index, "");
  };
  return (
    <div>
      {/* Instructions */}
      <Alert
        message="Fill Blank Question Builder"
        description="Create questions where students fill in Chinese words. Use [1], [2], etc. to mark blank positions."
        type="info"
        style={{ marginBottom: "24px" }}
      />

      {/* Step 1: Question Setup */}
      <Card title="Step 1: Question Setup" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Instruction"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Please enter the instruction" }]}
        >
          <TextArea
            placeholder="Enter instruction (e.g., 'Điền từ tiếng Trung thích hợp vào chỗ trống.')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Step 2: Sentence Builder */}
      <Card
        title="Step 2: Build Sentence with Blanks"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addSentencePart}
          >
            Add Part
          </Button>
        }
        style={{ marginBottom: "24px" }}
      >
        <div style={{ marginBottom: "16px" }}>
          <Text type="secondary">
            Build your sentence part by part. Use [1], [2], etc. for blank
            positions.
          </Text>
        </div>

        {sentenceParts.map((part, index) => (
          <Card
            key={index}
            size="small"
            style={{
              marginBottom: "12px",
              backgroundColor: isBlankMarker(part) ? "#fff7e6" : "#ffffff",
            }}
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  Part {index + 1}
                  {isBlankMarker(part) && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>
                      BLANK {part.match(/\d+/)?.[0]}
                    </Tag>
                  )}
                </div>
                <Space>
                  {!isBlankMarker(part) ? (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => markAsBlank(index)}
                      style={{ fontSize: "12px" }}
                    >
                      Mark as Blank
                    </Button>
                  ) : (
                    <Button
                      type="default"
                      size="small"
                      onClick={() => unmarkBlank(index)}
                      style={{ fontSize: "12px" }}
                    >
                      Unmark Blank
                    </Button>
                  )}
                  {sentenceParts.length > 1 && (
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeSentencePart(index)}
                    />
                  )}
                </Space>
              </div>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: "8px" }}>
                  <Text strong>Chinese Text:</Text>
                </div>
                {isBlankMarker(part) ? (
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ffeaa7",
                      border: "2px dashed #ffa940",
                      borderRadius: "6px",
                      textAlign: "center",
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#d68910",
                    }}
                  >
                    BLANK POSITION {part.match(/\d+/)?.[0]}
                  </div>
                ) : (
                  <Input
                    placeholder="Enter Chinese text"
                    value={part}
                    onChange={(e) =>
                      handleSentencePartChange(index, e.target.value)
                    }
                    style={{
                      fontSize: "16px",
                    }}
                  />
                )}
                {isBlankMarker(part) && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      This position will be a blank for students to fill
                    </Text>
                  </div>
                )}
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: "8px" }}>
                  <Text strong>Pinyin:</Text>
                  {!isBlankMarker(part) && (
                    <Button
                      type="link"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={() => generatePartPinyin(index, part)}
                      style={{ padding: 0, marginLeft: 8 }}
                    >
                      Auto-generate
                    </Button>
                  )}
                </div>
                {isBlankMarker(part) ? (
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ffeaa7",
                      border: "2px dashed #ffa940",
                      borderRadius: "6px",
                      textAlign: "center",
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#d68910",
                    }}
                  >
                    {part}
                  </div>
                ) : (
                  <Input
                    placeholder="Pinyin (auto-generated or manual)"
                    value={pinyinParts[index] || ""}
                    onChange={(e) =>
                      handlePinyinPartChange(index, e.target.value)
                    }
                    style={{
                      fontSize: "16px",
                      color: "#1890ff",
                    }}
                  />
                )}
              </Col>
            </Row>
          </Card>
        ))}

        {/* Hidden form fields */}
        <Form.Item name={["data", "sentence"]} style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name={["data", "pinyin"]} style={{ display: "none" }}>
          <Input />
        </Form.Item>
      </Card>

      {/* Step 3: Vietnamese Translation */}
      <Card
        title="Step 3: Vietnamese Translation"
        style={{ marginBottom: "24px" }}
      >
        <Form.Item
          label="Vietnamese Translation"
          name={["data", "vietnamese"]}
          rules={[
            { required: true, message: "Please enter Vietnamese translation" },
          ]}
        >
          <TextArea
            placeholder="Enter Vietnamese translation with [1], [2], etc. for blank positions (e.g., '[1] xin chào, [2] là Lý Minh.')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Step 4: Preview */}
      <Card title="Sentence Preview" style={{ marginBottom: "24px" }}>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fafafa",
            borderRadius: "6px",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <Text strong>Chinese: </Text>
            <span style={{ fontSize: "18px" }}>
              {sentenceParts.map((part, index) => (
                <span key={index}>
                  {isBlankMarker(part) ? (
                    <span
                      style={{
                        backgroundColor: "#ffeaa7",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "1px dashed #ffa940",
                        color: "#d68910",
                        fontWeight: "bold",
                      }}
                    >
                      ____
                    </span>
                  ) : (
                    part
                  )}
                  {index < sentenceParts.length - 1 ? " " : ""}
                </span>
              ))}
            </span>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <Text strong>Pinyin: </Text>
            <span style={{ fontSize: "16px", color: "#1890ff" }}>
              {pinyinParts.map((part, index) => (
                <span key={index}>
                  {isBlankMarker(part) ? (
                    <span
                      style={{
                        backgroundColor: "#ffeaa7",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "1px dashed #ffa940",
                        color: "#d68910",
                        fontWeight: "bold",
                      }}
                    >
                      ____
                    </span>
                  ) : (
                    part
                  )}
                  {index < pinyinParts.length - 1 ? " " : ""}
                </span>
              ))}
            </span>
          </div>
          <div>
            <Text strong>Vietnamese: </Text>
            <span style={{ fontSize: "16px", color: "#666" }}>
              {form.getFieldValue(["data", "vietnamese"]) ||
                "Enter Vietnamese translation above"}
            </span>
          </div>
        </div>
      </Card>

      {/* Step 5: Option Bank */}
      <Card
        title="Step 5: Option Bank (Hints)"
        style={{ marginBottom: "24px" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <Text type="secondary">
            Add Chinese words as options for students to choose from.
          </Text>
        </div>
        <Form.List name={["data", "optionBank"]}>
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
                    name={name}
                    rules={[{ required: true, message: "Please enter option" }]}
                  >
                    <Input
                      placeholder="Enter Chinese word"
                      style={{ width: 200, fontSize: "16px" }}
                      onChange={handleOptionBankChange}
                      onBlur={handleOptionBankChange}
                    />
                  </Form.Item>
                  <Button
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => {
                      remove(name);
                      // Update option bank state after removal
                      setTimeout(handleOptionBankChange, 100);
                    }}
                  />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                    // Update option bank state after addition
                    setTimeout(handleOptionBankChange, 100);
                  }}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Option
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Display current options */}
        {optionBankItems.filter(Boolean).length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <Text strong>Current Options: </Text>
            <div style={{ marginTop: "8px" }}>
              {optionBankItems.filter(Boolean).map((option, index) => (
                <Tag
                  key={index}
                  style={{
                    margin: "4px",
                    fontSize: "14px",
                    padding: "4px 8px",
                  }}
                >
                  {option}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Step 6: Set Correct Answers */}
      <Card
        title="Step 6: Set Correct Answers"
        style={{ marginBottom: "24px" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <Text type="secondary">
            Define correct answers for each blank position. You can select from
            the option bank or type new answers.
          </Text>
        </div>

        {/* Auto-generate blank answer fields based on sentence blanks */}
        {sentenceParts
          .map((part, index) => ({ part, originalIndex: index }))
          .filter(({ part }) => isBlankMarker(part))
          .map(({ part, originalIndex }) => {
            const blankNumber = parseInt(part.match(/\d+/)?.[0] || "0");
            const currentOptions =
              form.getFieldValue(["data", "optionBank"]) || [];

            return (
              <Card
                key={`blank-${blankNumber}`}
                size="small"
                style={{ marginBottom: "12px" }}
                title={
                  <div>
                    <span>
                      Blank {blankNumber} - Position {originalIndex + 1}
                    </span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      Context: {sentenceParts[originalIndex - 1] || ""} ___{" "}
                      {sentenceParts[originalIndex + 1] || ""}
                    </Tag>
                  </div>
                }
              >
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      label="Correct Answers"
                      name={["data", "blanks", blankNumber - 1, "correct"]}
                      rules={[
                        {
                          required: true,
                          message: "Please add at least one correct answer",
                        },
                      ]}
                      initialValue={[]}
                    >
                      <Select
                        mode="tags"
                        placeholder="Select from option bank or type correct answers"
                        style={{ width: "100%" }}
                        dropdownRender={(menu) => (
                          <div>
                            {currentOptions.filter(Boolean).length > 0 && (
                              <div
                                style={{
                                  padding: "8px",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px" }}
                                >
                                  Available options:
                                </Text>
                              </div>
                            )}
                            {menu}
                            <div
                              style={{
                                padding: "8px",
                                borderTop: "1px solid #f0f0f0",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: "12px" }}
                              >
                                Type to add custom answers
                              </Text>
                            </div>
                          </div>
                        )}
                      >
                        {currentOptions
                          .filter(Boolean)
                          .map((option: string, idx: number) => (
                            <Option key={`option-${idx}`} value={option}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <span
                                  style={{ fontSize: "16px", marginRight: 8 }}
                                >
                                  {option}
                                </span>
                                <Tag color="green">
                                  From Bank
                                </Tag>
                              </div>
                            </Option>
                          ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <div style={{ padding: "8px 0" }}>
                      <Text strong style={{ fontSize: "12px" }}>
                        Quick Select:
                      </Text>
                      <div style={{ marginTop: "4px" }}>
                        {currentOptions
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((option: string, idx: number) => (
                            <Button
                              key={`quick-${idx}`}
                              size="small"
                              style={{
                                margin: "2px",
                                fontSize: "12px",
                                height: "24px",
                              }}
                              onClick={() => {
                                const currentAnswers =
                                  form.getFieldValue([
                                    "data",
                                    "blanks",
                                    blankNumber - 1,
                                    "correct",
                                  ]) || [];
                                if (!currentAnswers.includes(option)) {
                                  form.setFieldsValue({
                                    data: {
                                      ...form.getFieldValue("data"),
                                      blanks: {
                                        ...form.getFieldValue([
                                          "data",
                                          "blanks",
                                        ]),
                                        [blankNumber - 1]: {
                                          ...form.getFieldValue([
                                            "data",
                                            "blanks",
                                            blankNumber - 1,
                                          ]),
                                          correct: [...currentAnswers, option],
                                        },
                                      },
                                    },
                                  });
                                }
                              }}
                            >
                              {option}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Hidden field for blank index */}
                <Form.Item
                  name={["data", "blanks", blankNumber - 1, "index"]}
                  initialValue={blankNumber}
                  style={{ display: "none" }}
                >
                  <Input />
                </Form.Item>
              </Card>
            );
          })}

        {sentenceParts.filter((part) => isBlankMarker(part)).length === 0 && (
          <Alert
            message="No blanks detected"
            description="Mark some sentence parts as blanks to set correct answers."
            type="info"
            showIcon
          />
        )}

        {/* Summary of current blanks and answers */}
        {sentenceParts.filter((part) => isBlankMarker(part)).length > 0 && (
          <Card
            title="Summary"
            size="small"
            style={{ marginTop: "16px", backgroundColor: "#fafafa" }}
          >
            <div>
              <Text strong>Blanks Overview:</Text>
              <div style={{ marginTop: "8px" }}>
                {sentenceParts
                  .map((part, index) => ({ part, originalIndex: index }))
                  .filter(({ part }) => isBlankMarker(part))
                  .map(({ part, originalIndex }) => {
                    const blankNumber = parseInt(part.match(/\d+/)?.[0] || "0");
                    const answers =
                      form.getFieldValue([
                        "data",
                        "blanks",
                        blankNumber - 1,
                        "correct",
                      ]) || [];

                    return (
                      <div
                        key={`summary-${blankNumber}`}
                        style={{ margin: "4px 0" }}
                      >
                        <Tag color="orange">Blank {blankNumber}</Tag>
                        <span style={{ margin: "0 8px" }}>→</span>
                        {answers.length > 0 ? (
                          answers.map((answer: string, idx: number) => (
                            <Tag
                              key={idx}
                              color="green"
                              style={{ margin: "2px" }}
                            >
                              {answer}
                            </Tag>
                          ))
                        ) : (
                          <Tag color="red">No answers set</Tag>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Step 7: Explanation */}
      <Card title="Step 7: Explanation" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Explanation"
          name={["data", "explanation"]}
          rules={[{ required: true, message: "Please enter explanation" }]}
        >
          <TextArea
            placeholder="Explain the correct answers, grammar rules, and word meanings..."
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>
      </Card>

      {/* Additional Settings */}
      <Card title="Additional Settings" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Active"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>

      <Card title="JSON Preview" style={{ marginBottom: "24px" }}>
        <pre
          style={{
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            fontSize: "12px",
            overflow: "auto",
            maxHeight: "300px",
          }}
        >
          {JSON.stringify(
            {
              instruction: form.getFieldValue(["data", "instruction"]),
              sentence: sentenceParts,
              pinyin: pinyinParts,
              vietnamese: form.getFieldValue(["data", "vietnamese"]),
              optionBank: form.getFieldValue(["data", "optionBank"]),
              blanks: form.getFieldValue(["data", "blanks"]),
              explanation: form.getFieldValue(["data", "explanation"]),
            },
            null,
            2
          )}
        </pre>
      </Card>
    </div>
  );
};

export default FillTextTextForm;
