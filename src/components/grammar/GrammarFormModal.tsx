"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  message,
  Card,
  Divider,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import { GrammarFormValues, GrammarPattern } from "@/types/grammarTypes";
import { HSK_LEVEL_OPTIONS, HSKLevel } from "@/enums/hsk-level.enum";

const { TextArea } = Input;
const { Option } = Select;

interface GrammarFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: GrammarFormValues) => Promise<void>;
  initialData?: GrammarPattern | null;
  loading?: boolean;
}

const GrammarFormModal: React.FC<GrammarFormModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [patternInputs, setPatternInputs] = useState<string[]>([""]);
  const [pinyinInputs, setPinyinInputs] = useState<string[]>([""]);

  // Generate pinyin function
  const generatePinyin = (chinese: string): string => {
    try {
      return pinyin(chinese, {
        toneType: "symbol",
        type: "array",
      }).join(" ");
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
      return "";
    }
  };

  // Auto generate pinyin for pattern
  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chineseText = e.target.value;
    form.setFieldsValue({ pattern: chineseText });

    if (chineseText.trim()) {
      const generatedPinyin = generatePinyin(chineseText);
      form.setFieldsValue({ patternPinyin: generatedPinyin });
    } else {
      form.setFieldsValue({ patternPinyin: "" });
    }
  };

  // Auto generate pinyin for examples
  const handleExampleChineseChange = (value: string, fieldName: number) => {
    // Update the chinese field
    const currentExamples = form.getFieldValue("examples") || [];
    const updatedExamples = [...currentExamples];
    if (!updatedExamples[fieldName]) {
      updatedExamples[fieldName] = {};
    }
    updatedExamples[fieldName].chinese = value;

    // Auto generate pinyin
    if (value.trim()) {
      const generatedPinyin = generatePinyin(value);
      updatedExamples[fieldName].pinyin = generatedPinyin;
    } else {
      updatedExamples[fieldName].pinyin = "";
    }

    form.setFieldsValue({ examples: updatedExamples });
  };

  // Prepare initial values for form
  const getInitialValues = () => {
    if (initialData) {
      const translation = initialData.translations?.[0];
      return {
        pattern: initialData.pattern?.join(" "),
        patternPinyin: initialData.patternPinyin?.join(" "),
        patternFormula: initialData.patternFormula,
        hskLevel: initialData.hskLevel,
        language: translation?.language || "vn",
        grammarPoint: translation?.grammarPoint,
        explanation: translation?.explanation,
        examples: translation?.example?.map((ex) => ({
          chinese: ex.chinese.join(""),
          pinyin: ex.pinyin?.join(" "),
          translation: ex.translation,
        })) || [{ chinese: "", pinyin: "", translation: "" }],
      };
    }
    return {
      language: "vn",
      examples: [{ chinese: "", pinyin: "", translation: "" }],
    };
  };

  // Reset form when modal opens/closes or data changes
  useEffect(() => {
    if (visible) {
      if (initialData) {
        // Edit mode
        const translation = initialData.translations?.[0];
        setPatternInputs(initialData.pattern || [""]);
        setPinyinInputs(initialData.patternPinyin || [""]);
      } else {
        // Create mode
        setPatternInputs([""]);
        setPinyinInputs([""]);
      }
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {

    try {
      const values = await form.validateFields();


      // Convert pattern and pinyin strings to arrays
      const patternArray = values.pattern
        ? values.pattern.split(/\s+/).filter((p: string) => p.trim())
        : [];
      const pinyinArray = values.patternPinyin
        ? values.patternPinyin.split(/\s+/).filter((p: string) => p.trim())
        : [];

      // Convert examples to proper format - FIX: Kiểm tra empty examples
      const examples =
        values.examples
          ?.filter((ex: any) => ex.chinese && ex.translation) // Filter empty examples first
          ?.map((ex: any) => ({
            chinese: ex.chinese, // Giữ nguyên string, không split thành array ở đây
            pinyin: ex.pinyin || "",
            translation: ex.translation,
          })) || [];

      const formData: GrammarFormValues = {
        id: initialData?.id,
        translationId: initialData?.translations?.[0]?.id,
        pattern: patternArray,
        patternPinyin: pinyinArray.length > 0 ? pinyinArray : undefined,
        patternFormula: values.patternFormula,
        hskLevel: values.hskLevel,
        language: values.language,
        grammarPoint: values.grammarPoint,
        explanation: values.explanation,
        examples: examples,
      };

      await onSubmit(formData);
      form.resetFields();
      setPatternInputs([""]);
      setPinyinInputs([""]);
    } catch (error) {
      console.error("❌ Form validation failed:", error);
      message.error("Vui lòng kiểm tra lại thông tin form!");
    }
  };

  const addPatternInput = () => {
    setPatternInputs([...patternInputs, ""]);
  };

  const removePatternInput = (index: number) => {
    if (patternInputs.length > 1) {
      const newInputs = patternInputs.filter((_, i) => i !== index);
      setPatternInputs(newInputs);
    }
  };

  return (
    <Modal
      title={
        initialData ? "Chỉnh sửa mẫu ngữ pháp" : "Tạo mẫu ngữ pháp mới"
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {initialData ? "Cập nhật" : "Tạo mới"}
        </Button>,
      ]}
      width={800}
      destroyOnClose
      key={initialData ? `edit-${initialData.id}` : 'create'}
    >
      <Form 
        form={form} 
        layout="vertical" 
        initialValues={getInitialValues()}
      >
        <Card title="Thông tin mẫu" size="small">
          <Form.Item
            name="pattern"
            label="Mẫu câu (cách nhau bằng dấu cách)"
            rules={[{ required: true, message: "Vui lòng nhập mẫu câu!" }]}
          >
            <Input
              placeholder="Ví dụ: 帮忙 & 帮"
              onChange={handlePatternChange}
              suffix={
                <Button
                  type="text"
                  icon={<SoundOutlined />}
                  size="small"
                  onClick={() => {
                    const patternValue = form.getFieldValue("pattern");
                    if (patternValue) {
                      const generatedPinyin = generatePinyin(patternValue);
                      form.setFieldsValue({ patternPinyin: generatedPinyin });
                      message.success("Đã tự động tạo pinyin!");
                    }
                  }}
                  title="Tự động tạo pinyin"
                />
              }
            />
          </Form.Item>

          <Form.Item
            name="patternPinyin"
            label={
              <Space>
                <span>Phiên âm mẫu câu (cách nhau bằng dấu cách)</span>
                <Button
                  type="link"
                  size="small"
                  icon={<SoundOutlined />}
                  onClick={() => {
                    const patternValue = form.getFieldValue("pattern");
                    if (patternValue) {
                      const generatedPinyin = generatePinyin(patternValue);
                      form.setFieldsValue({ patternPinyin: generatedPinyin });
                      message.success("Đã tự động tạo pinyin!");
                    } else {
                      message.warning("Vui lòng nhập mẫu câu trước!");
                    }
                  }}
                >
                  Tự động tạo
                </Button>
              </Space>
            }
          >
            <Input placeholder="Ví dụ: bāngmáng & bāng" />
          </Form.Item>

          <Form.Item name="patternFormula" label="Công thức mẫu câu">
            <Input placeholder="Ví dụ: A + 帮 + B" />
          </Form.Item>

          <Form.Item name="hskLevel" label="Cấp độ HSK">
            <Select placeholder="Chọn cấp độ HSK" allowClear>
              {HSK_LEVEL_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Divider />

        <Card title="Thông tin bản dịch" size="small">
          <Form.Item name="language" label="Ngôn ngữ" initialValue="vn">
            <Select>
              <Option value="vn">Tiếng Việt</Option>
              <Option value="en">English</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="grammarPoint"
            label="Điểm ngữ pháp"
            rules={[
              { required: true, message: "Vui lòng nhập điểm ngữ pháp!" },
            ]}
          >
            <Input placeholder="Ví dụ: động từ ly hợp" />
          </Form.Item>

          <Form.Item
            name="explanation"
            label="Giải thích"
            rules={[{ required: true, message: "Vui lòng nhập giải thích!" }]}
          >
            <TextArea rows={4} placeholder="Nhập giải thích chi tiết..." />
          </Form.Item>
        </Card>

        <Divider />

        <Card title="Ví dụ" size="small">
          <Form.List name="examples" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mb-4"
                    title={
                      <div className="flex items-center justify-between">
                        <span>{`Ví dụ ${name + 1}`}</span>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                          />
                        )}
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-2">
                        <Form.Item
                          {...restField}
                          name={[name, "chinese"]}
                          label="Tiếng Trung"
                          className="flex-1 mb-0"
                        >
                          <Input
                            placeholder="他帮忙做了这件事。"
                            onChange={(e) =>
                              handleExampleChineseChange(e.target.value, name)
                            }
                          />
                        </Form.Item>
                      </div>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "pinyin"]}
                            label="Pinyin (Tự động)"
                            className="mb-0"
                          >
                            <Input
                              placeholder="Tā bāngmáng zuò le zhè jiàn shì"
                              className="bg-gray-100"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "translation"]}
                            label="Dịch nghĩa"
                            className="mb-0"
                          >
                            <Input placeholder="Anh ấy đã giúp làm việc này." />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm ví dụ
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Card>
      </Form>
    </Modal>
  );
};

export default GrammarFormModal;
