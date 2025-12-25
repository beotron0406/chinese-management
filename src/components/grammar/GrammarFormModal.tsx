"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Typography,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  SoundOutlined,
  BookOutlined,
  TranslationOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import { GrammarFormValues, GrammarPattern } from "@/types/grammarTypes";
import { HSK_LEVEL_OPTIONS } from "@/enums/hsk-level.enum";

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

interface GrammarFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: GrammarFormValues) => Promise<void>;
  initialData?: GrammarPattern | null;
  loading?: boolean;
}

// Section Container with border
const SectionContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`p-6 border border-gray-200 rounded-2xl bg-white mb-6 ${className}`}>
    {children}
  </div>
);

// Section Header Component
const SectionHeader: React.FC<{
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ step, title, description, icon }) => (
  <div className="flex items-center gap-4 mb-5">
    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-400 to-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-md text-2xl">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Bước {step}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 m-0 mt-1">{title}</h3>
      <p className="text-xs text-gray-500 m-0">{description}</p>
    </div>
  </div>
);

// Form Field Wrapper for consistent styling
const FormField: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const GrammarFormModal: React.FC<GrammarFormModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const [form] = Form.useForm();

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
    const currentExamples = form.getFieldValue("examples") || [];
    const updatedExamples = [...currentExamples];
    if (!updatedExamples[fieldName]) {
      updatedExamples[fieldName] = {};
    }
    updatedExamples[fieldName].chinese = value;

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
      form.setFieldsValue(getInitialValues());
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const patternArray = values.pattern
        ? values.pattern.split(/\s+/).filter((p: string) => p.trim())
        : [];
      const pinyinArray = values.patternPinyin
        ? values.patternPinyin.split(/\s+/).filter((p: string) => p.trim())
        : [];

      const examples =
        values.examples
          ?.filter((ex: any) => ex.chinese && ex.translation)
          ?.map((ex: any) => ({
            chinese: ex.chinese,
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
    } catch (error) {
      console.error("Form validation failed:", error);
      message.error("Vui lòng kiểm tra lại thông tin form!");
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BookOutlined className="text-white text-sm" />
          </div>
          <div>
            <h2 className="text-lg font-bold m-0 text-gray-900">
              {initialData ? "Chỉnh Sửa Mẫu Ngữ Pháp" : "Tạo Mẫu Ngữ Pháp Mới"}
            </h2>
            <p className="text-xs text-gray-500 m-0">
              Điền thông tin theo từng bước bên dưới
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
      centered
      styles={{ body: { maxHeight: "75vh", overflowY: "auto", padding: "24px" } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={getInitialValues()}
        requiredMark={false}
      >
        {/* Section 1: Pattern Info */}
        <SectionContainer>
          <SectionHeader
            step={1}
            title="Thông Tin Mẫu Câu"
            description="Nhập cấu trúc ngữ pháp tiếng Trung"
            icon={<BookOutlined />}
          />

          <FormField label="Mẫu câu tiếng Trung" required hint="Các từ cách nhau bằng dấu cách. VD: 帮忙 帮">
            <Form.Item
              name="pattern"
              rules={[{ required: true, message: "Vui lòng nhập mẫu câu!" }]}
              className="mb-0"
            >
              <Input
                placeholder="Ví dụ: 帮忙 帮"
                onChange={handlePatternChange}
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </FormField>

          <FormField label="Phiên âm Pinyin" hint="Tự động tạo từ mẫu câu, có thể chỉnh sửa">
            <Form.Item name="patternPinyin" className="mb-0">
              <Input
                placeholder="bāng máng bāng"
                size="large"
                className="rounded-lg bg-gray-50"
                suffix={
                  <Button
                    type="text"
                    size="small"
                    icon={<SoundOutlined />}
                    onClick={() => {
                      const patternValue = form.getFieldValue("pattern");
                      if (patternValue) {
                        const gen = generatePinyin(patternValue);
                        form.setFieldsValue({ patternPinyin: gen });
                        message.success("Đã tạo lại pinyin!");
                      }
                    }}
                  />
                }
              />
            </Form.Item>
          </FormField>

          <div className="flex gap-4">
            <div className="flex-1">
              <FormField label="Công thức mẫu" hint="VD: A + 帮 + B">
                <Form.Item name="patternFormula" className="mb-0">
                  <Input placeholder="A + 帮 + B" size="large" className="rounded-lg" />
                </Form.Item>
              </FormField>
            </div>
            <div className="w-32">
              <FormField label="Cấp HSK">
                <Form.Item name="hskLevel" className="mb-0">
                  <Select placeholder="HSK" size="large" allowClear className="w-full">
                    {HSK_LEVEL_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </FormField>
            </div>
          </div>
        </SectionContainer>

        {/* Section 2: Translation */}
        <SectionContainer>
          <SectionHeader
            step={2}
            title="Giải Thích & Dịch Nghĩa"
            description="Thêm thông tin giải thích bằng tiếng Việt"
            icon={<TranslationOutlined />}
          />

          <Form.Item name="language" hidden initialValue="vn">
            <Input />
          </Form.Item>

          <FormField label="Điểm ngữ pháp" required hint="Mô tả ngắn gọn điểm ngữ pháp này">
            <Form.Item
              name="grammarPoint"
              rules={[{ required: true, message: "Bắt buộc!" }]}
              className="mb-0"
            >
              <Input placeholder="Ví dụ: Động từ ly hợp" size="large" className="rounded-lg" />
            </Form.Item>
          </FormField>

          <FormField label="Giải thích chi tiết" required>
            <Form.Item
              name="explanation"
              rules={[{ required: true, message: "Bắt buộc!" }]}
              className="mb-0"
            >
              <TextArea
                rows={4}
                placeholder="Nhập giải thích chi tiết về cách sử dụng mẫu ngữ pháp này..."
                className="rounded-lg"
              />
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 3: Examples */}
        <SectionContainer>
          <SectionHeader
            step={3}
            title="Ví Dụ Minh Họa"
            description="Thêm các câu ví dụ sử dụng mẫu ngữ pháp"
            icon={<FileTextOutlined />}
          />

          <Form.List name="examples" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div
                    key={key}
                    className="p-4 mb-4 border border-gray-200 rounded-xl bg-gray-50/50 relative"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        Ví dụ {index + 1}
                      </span>
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

                    <div className="space-y-3">
                      <Form.Item {...restField} name={[name, "chinese"]} className="mb-0">
                        <Input
                          placeholder="Câu tiếng Trung: 他帮忙做了这件事。"
                          onChange={(e) => handleExampleChineseChange(e.target.value, name)}
                          className="rounded-lg"
                        />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, "pinyin"]} className="mb-0">
                        <Input
                          placeholder="Pinyin (tự động)"
                          className="rounded-lg bg-white/50 text-gray-500"
                        />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, "translation"]} className="mb-0">
                        <Input
                          placeholder="Dịch nghĩa tiếng Việt"
                          className="rounded-lg"
                        />
                      </Form.Item>
                    </div>
                  </div>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  className="rounded-lg h-10"
                >
                  Thêm ví dụ khác
                </Button>
              </>
            )}
          </Form.List>
        </SectionContainer>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Button size="large" onClick={onCancel} className="rounded-lg px-6">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSubmit}
            className="rounded-lg px-8 bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            {initialData ? "Cập Nhật" : "Tạo Mới"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default GrammarFormModal;
