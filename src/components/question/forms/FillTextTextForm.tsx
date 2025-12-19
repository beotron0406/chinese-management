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
        message="Công Cụ Tạo Câu Hỏi Điền Chỗ Trống"
        description="Tạo câu hỏi để học sinh điền từ tiếng Trung. Sử dụng [1], [2], v.v. để đánh dấu vị trí chỗ trống."
        type="info"
        className="mb-6"
      />

      {/* Step 1: Question Setup */}
      <Card title="Bước 1: Thiết Lập Câu Hỏi" className="mb-6">
        <Form.Item
          label="Hướng Dẫn"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Vui lòng nhập hướng dẫn" }]}
        >
          <TextArea
            placeholder="Nhập hướng dẫn (ví dụ: 'Điền từ tiếng Trung thích hợp vào chỗ trống.')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Step 2: Sentence Builder */}
      <Card
        title="Bước 2: Xây Dựng Câu Với Chỗ Trống"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addSentencePart}
          >
            Thêm Phần
          </Button>
        }
        className="mb-6"
      >
        <div className="mb-4">
          <Text type="secondary">
            Xây dựng câu từng phần. Sử dụng [1], [2], v.v. cho vị trí chỗ trống.
          </Text>
        </div>

        {sentenceParts.map((part, index) => (
          <Card
            key={index}
            size="small"
            className={`mb-3 ${isBlankMarker(part) ? 'bg-orange-50' : 'bg-white'}`}
            title={
              <div className="flex items-center justify-between">
                <div>
                  Phần {index + 1}
                  {isBlankMarker(part) && (
                    <Tag color="orange" className="ml-2">
                      CHỖ TRỐNG {part.match(/\d+/)?.[0]}
                    </Tag>
                  )}
                </div>
                <Space>
                  {!isBlankMarker(part) ? (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => markAsBlank(index)}
                      className="text-xs"
                    >
                      Đánh Dấu Chỗ Trống
                    </Button>
                  ) : (
                    <Button
                      type="default"
                      size="small"
                      onClick={() => unmarkBlank(index)}
                      className="text-xs"
                    >
                      Bỏ Đánh Dấu
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
                <div className="mb-2">
                  <Text strong>Chữ Trung:</Text>
                </div>
                {isBlankMarker(part) ? (
                  <div className="py-2 px-3 bg-yellow-200 border-2 border-dashed border-orange-400 rounded-md text-center text-base font-bold text-yellow-700">
                    VỊ TRÍ CHỖ TRỐNG {part.match(/\d+/)?.[0]}
                  </div>
                ) : (
                  <Input
                    placeholder="Nhập chữ Trung"
                    value={part}
                    onChange={(e) =>
                      handleSentencePartChange(index, e.target.value)
                    }
                    className="text-base"
                  />
                )}
                {isBlankMarker(part) && (
                  <div className="mt-1">
                    <Text type="secondary" className="text-xs">
                      Vị trí này sẽ là chỗ trống để học sinh điền
                    </Text>
                  </div>
                )}
              </Col>
              <Col span={12}>
                <div className="mb-2">
                  <Text strong>Pinyin:</Text>
                  {!isBlankMarker(part) && (
                    <Button
                      type="link"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={() => generatePartPinyin(index, part)}
                      className="p-0 ml-2"
                    >
                      Tự động tạo
                    </Button>
                  )}
                </div>
                {isBlankMarker(part) ? (
                  <div className="py-2 px-3 bg-yellow-200 border-2 border-dashed border-orange-400 rounded-md text-center text-base font-bold text-yellow-700">
                    {part}
                  </div>
                ) : (
                  <Input
                    placeholder="Pinyin (tự động tạo hoặc nhập thủ công)"
                    value={pinyinParts[index] || ""}
                    onChange={(e) =>
                      handlePinyinPartChange(index, e.target.value)
                    }
                    className="text-base text-blue-500"
                  />
                )}
              </Col>
            </Row>
          </Card>
        ))}

        {/* Hidden form fields */}
        <Form.Item name={["data", "sentence"]} className="hidden">
          <Input />
        </Form.Item>
        <Form.Item name={["data", "pinyin"]} className="hidden">
          <Input />
        </Form.Item>
      </Card>

      {/* Step 3: Vietnamese Translation */}
      <Card
        title="Bước 3: Bản Dịch Tiếng Việt"
        className="mb-6"
      >
        <Form.Item
          label="Bản Dịch Tiếng Việt"
          name={["data", "vietnamese"]}
          rules={[
            { required: true, message: "Vui lòng nhập bản dịch tiếng Việt" },
          ]}
        >
          <TextArea
            placeholder="Nhập bản dịch tiếng Việt với [1], [2], v.v. cho vị trí chỗ trống (ví dụ: '[1] xin chào, [2] là Lý Minh.')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Step 4: Preview
      <Card title="Xem Trước Câu" style={{ marginBottom: "24px" }}>
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
            <Text strong>Tiếng Việt: </Text>
            <span style={{ fontSize: "16px", color: "#666" }}>
              {form.getFieldValue(["data", "vietnamese"]) ||
                "Nhập bản dịch tiếng Việt ở trên"}
            </span>
          </div>
        </div>
      </Card> */}

      {/* Step 5: Option Bank */}
      <Card
        title="Bước 5: Ngân Hàng Lựa Chọn (Gợi Ý)"
        className="mb-6"
      >
        <div className="mb-3">
          <Text type="secondary">
            Thêm các từ tiếng Trung làm lựa chọn cho học sinh.
          </Text>
        </div>
        <Form.List name={["data", "optionBank"]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  className="flex mb-2"
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={name}
                    rules={[
                      { required: true, message: "Vui lòng nhập lựa chọn" },
                    ]}
                  >
                    <Input
                      placeholder="Nhập từ tiếng Trung"
                      className="w-[200px] text-base"
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
                  Thêm Lựa Chọn
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Display current options */}
        {optionBankItems.filter(Boolean).length > 0 && (
          <div className="mt-4">
            <Text strong>Lựa Chọn Hiện Tại: </Text>
            <div className="mt-2">
              {optionBankItems.filter(Boolean).map((option, index) => (
                <Tag
                  key={index}
                  className="m-1 text-sm py-1 px-2"
                >
                  {option}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Step 6: Set Correct Answers */}
      <Card title="Bước 6: Đặt Đáp Án Đúng" className="mb-6">
        <div className="mb-3">
          <Text type="secondary">
            Xác định đáp án đúng cho mỗi vị trí chỗ trống. Bạn có thể chọn từ
            ngân hàng lựa chọn hoặc nhập đáp án mới.
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
                className="mb-3"
                title={
                  <div>
                    <span>
                      Chỗ Trống {blankNumber} - Vị Trí {originalIndex + 1}
                    </span>
                    <Tag color="blue" className="ml-2">
                      Ngữ cảnh: {sentenceParts[originalIndex - 1] || ""} ___{" "}
                      {sentenceParts[originalIndex + 1] || ""}
                    </Tag>
                  </div>
                }
              >
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      label="Đáp Án Đúng"
                      name={["data", "blanks", blankNumber - 1, "correct"]}
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng thêm ít nhất một đáp án đúng",
                        },
                      ]}
                      initialValue={[]}
                    >
                      <Select
                        mode="tags"
                        placeholder="Chọn từ ngân hàng lựa chọn hoặc nhập đáp án đúng"
                        style={{ width: "100%" }}
                        dropdownRender={(menu) => (
                          <div>
                            {currentOptions.filter(Boolean).length > 0 && (
                              <div className="p-2 border-b border-gray-200">
                                <Text
                                  type="secondary"
                                  className="text-xs"
                                >
                                  Lựa chọn khả dụng:
                                </Text>
                              </div>
                            )}
                            {menu}
                            <div className="p-2 border-t border-gray-200">
                              <Text
                                type="secondary"
                                className="text-xs"
                              >
                                Nhập để thêm đáp án tùy chỉnh
                              </Text>
                            </div>
                          </div>
                        )}
                      >
                        {currentOptions
                          .filter(Boolean)
                          .map((option: string, idx: number) => (
                            <Option key={`option-${idx}`} value={option}>
                              <div className="flex items-center">
                                <span className="text-base mr-2">
                                  {option}
                                </span>
                                <Tag color="green">Từ Ngân Hàng</Tag>
                              </div>
                            </Option>
                          ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <div className="py-2">
                      <Text strong className="text-xs">
                        Chọn Nhanh:
                      </Text>
                      <div className="mt-1">
                        {currentOptions
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((option: string, idx: number) => (
                            <Button
                              key={`quick-${idx}`}
                              size="small"
                              className="m-0.5 text-xs h-6"
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
                  className="hidden"
                >
                  <Input />
                </Form.Item>
              </Card>
            );
          })}

        {sentenceParts.filter((part) => isBlankMarker(part)).length === 0 && (
          <Alert
            message="Không phát hiện chỗ trống"
            description="Đánh dấu một số phần câu làm chỗ trống để đặt đáp án đúng."
            type="info"
            showIcon
          />
        )}

        {/* Summary of current blanks and answers */}
        {sentenceParts.filter((part) => isBlankMarker(part)).length > 0 && (
          <Card
            title="Tóm Tắt"
            size="small"
            className="mt-4 bg-gray-50"
          >
            <div>
              <Text strong>Tổng Quan Chỗ Trống:</Text>
              <div className="mt-2">
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
                        className="my-1"
                      >
                        <Tag color="orange">Chỗ Trống {blankNumber}</Tag>
                        <span className="mx-2">→</span>
                        {answers.length > 0 ? (
                          answers.map((answer: string, idx: number) => (
                            <Tag
                              key={idx}
                              color="green"
                              className="m-0.5"
                            >
                              {answer}
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
          </Card>
        )}
      </Card>

      {/* Step 7: Explanation */}
      <Card title="Bước 7: Giải Thích" className="mb-6">
        <Form.Item
          label="Giải Thích"
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
