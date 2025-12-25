"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Upload,
  Button,
  message,
  Space,
  Typography,
} from "antd";
import {
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  OrderedListOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { SelectionImageTextQuestionData, TextOption } from "@/types/questionType";
import { TextContent } from "@/types/textContent";
import { uploadImageByType, validateFile, UploadProgress } from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TextContentInput from "@/components/shared/TextContentInput";
import { getDisplayText } from "@/utils/textContentUtils";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { Text } = Typography;
const { TextArea } = Input;

interface SelectionImageTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: SelectionImageTextQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface SelectionImageTextFormRef {
  uploadFiles: () => Promise<boolean>;
}

const SelectionImageTextForm = forwardRef<SelectionImageTextFormRef, SelectionImageTextFormProps>(({
  form,
  initialValues,
  questionType = "question_selection_image_text",
}, ref) => {
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "error" | "idle">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string>("");
  const [imageAlt, setImageAlt] = useState<string>("");
  const [options, setOptions] = useState<TextOption[]>([
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("1");

  const updateFormData = (newOptions: SelectionImageTextQuestionData["options"], newCorrectAnswer: string) => {
    form.setFieldsValue({ data: { ...form.getFieldValue("data"), options: newOptions, correctAnswer: newCorrectAnswer } });
  };

  const handleImageFileChange = async (file: File | null) => {
    if (!file) return false;
    const imageValidation = validateFile(file, "image", 10);
    if (!imageValidation.isValid) { message.error(imageValidation.error); return false; }
    setSelectedImageFile(file);
    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadImageByType(file, questionType, (progress: UploadProgress) => {
        setUploadProgress(Math.round(progress.percentage));
      });
      if (result.success && result.url) {
        setUploadedImageUrl(result.url);
        form.setFieldsValue({ data: { ...form.getFieldValue("data"), image: result.url, alt: imageAlt } });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedImageFile(null);
        message.success("Tải hình ảnh lên thành công!");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      message.error("Tải lên thất bại.");
    }
    return false;
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setUploadedImageUrl(undefined);
    form.setFieldsValue({ data: { ...form.getFieldValue("data"), image: undefined, alt: undefined } });
  };

  const handleAltTextChange = (value: string) => {
    setImageAlt(value);
    form.setFieldsValue({ data: { ...form.getFieldValue("data"), alt: value } });
  };

  const handleOptionContentChange = (optionId: string, content: TextContent) => {
    const updatedOptions = options.map((option) =>
      option.id === optionId ? { ...option, content } : option
    );
    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    const newOptions: TextOption[] = [...options, { id: newId }];
    setOptions(newOptions);
    updateFormData(newOptions, correctAnswer);
  };

  const removeOption = (optionId: string) => {
    if (options.length <= 2) return;
    const filteredOptions = options.filter((opt) => opt.id !== optionId);
    setOptions(filteredOptions);
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === optionId) {
      newCorrectAnswer = filteredOptions[0]?.id || "1";
      setCorrectAnswer(newCorrectAnswer);
    }
    updateFormData(filteredOptions, newCorrectAnswer);
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    setCorrectAnswer(optionId);
    updateFormData(options, optionId);
  };

  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    const hasImageToUpload = selectedImageFile && !uploadedImageUrl;
    if (!hasImageToUpload) {
      if (uploadedImageUrl) return true;
      message.warning("Vui lòng chọn và tải lên file hình ảnh");
      return false;
    }
    const imageValidation = validateFile(selectedImageFile, "image", 10);
    if (!imageValidation.isValid) { message.error(imageValidation.error); return false; }
    if (showModal) setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadImageByType(selectedImageFile, questionType, (progress: UploadProgress) => {
        setUploadProgress(Math.round(progress.percentage));
      });
      if (result.success) {
        setUploadedImageUrl(result.url);
        form.setFieldsValue({ data: { ...form.getFieldValue("data"), image: result.url, alt: imageAlt } });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedImageFile(null);
        if (showModal) message.success("Tải hình ảnh lên thành công!");
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      message.error("Tải lên thất bại.");
      return false;
    }
  };

  useImperativeHandle(ref, () => ({ uploadFiles: () => handleUploadAllFiles(false) }));

  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      if (data.image) setUploadedImageUrl(data.image);
      if (data.alt) setImageAlt(data.alt);
      if (data.options) {
        const normalizedOptions: TextOption[] = data.options.map((opt) => ({
          id: opt.id,
          content: opt.content || (opt.text ? { text: opt.text } : undefined),
          text: opt.text,
        }));
        setOptions(normalizedOptions);
      }
      if (data.correctAnswer) setCorrectAnswer(data.correctAnswer);
    }
  }, [initialValues]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Section 1: Question Setup */}
      <SectionContainer>
        <SectionHeader step={1} title="Thiết Lập Câu Hỏi" description="Nhập hướng dẫn câu hỏi" icon={<QuestionCircleOutlined />} />
        <FormField label="Hướng dẫn câu hỏi" required>
          <Form.Item name={["data", "instruction"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
            <Input size="large" className="rounded-lg" placeholder="VD: Nhìn hình ảnh và chọn văn bản đúng" />
          </Form.Item>
        </FormField>
      </SectionContainer>

      {/* Section 2: Image */}
      <SectionContainer>
        <SectionHeader step={2} title="Hình Ảnh Câu Hỏi" description="Tải lên hình ảnh cho câu hỏi" icon={<PictureOutlined />} />
        <FormField label="File hình ảnh" required>
          <Form.Item name={["data", "image"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
              <Upload accept="image/*" maxCount={1} showUploadList={false} beforeUpload={(file) => { handleImageFileChange(file); return false; }} disabled={!!uploadedImageUrl}>
                <Button icon={<UploadOutlined />} size="large" className="rounded-lg" disabled={!!uploadedImageUrl}>
                  {selectedImageFile ? selectedImageFile.name : "Chọn Hình Ảnh"}
                </Button>
              </Upload>
              {uploadedImageUrl && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <PictureOutlined />
                    <span className="text-sm font-medium">Đã tải lên</span>
                    <Button size="small" icon={<DeleteOutlined />} onClick={handleRemoveImage} type="text" danger>Xóa</Button>
                  </div>
                  <img src={uploadedImageUrl} alt={imageAlt || "Question image"} className="max-w-[300px] max-h-[300px] object-cover rounded-lg border" />
                </div>
              )}
            </div>
          </Form.Item>
        </FormField>
        <FormField label="Văn bản thay thế" hint="Mô tả nội dung trong hình ảnh">
          <Form.Item name={["data", "alt"]} className="mb-0">
            <Input size="large" className="rounded-lg" placeholder="Mô tả nội dung trong hình ảnh" value={imageAlt} onChange={(e) => handleAltTextChange(e.target.value)} />
          </Form.Item>
        </FormField>
      </SectionContainer>

      {/* Section 3: Answer Options */}
      <SectionContainer>
        <SectionHeader step={3} title="Các Lựa Chọn Trả Lời" description="Thêm đáp án và chọn đáp án đúng" icon={<OrderedListOutlined />} />
        <div className="space-y-4">
          {options.map((option, index) => (
            <div
              key={option.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                correctAnswer === option.id ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-600">Lựa chọn {index + 1}</span>
                <Space>
                  <Button
                    type={correctAnswer === option.id ? "primary" : "default"}
                    size="small"
                    onClick={() => handleCorrectAnswerChange(option.id)}
                    className="rounded-lg"
                    icon={correctAnswer === option.id ? <CheckCircleOutlined /> : null}
                  >
                    {correctAnswer === option.id ? "Đáp án đúng" : "Đánh dấu đúng"}
                  </Button>
                  {options.length > 2 && (
                    <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeOption(option.id)} className="rounded-lg" />
                  )}
                </Space>
              </div>
              <TextContentInput value={option.content} onChange={(content) => handleOptionContentChange(option.id, content)} placeholder="Nhập nội dung lựa chọn" />
            </div>
          ))}
        </div>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addOption} disabled={options.length >= 6} className="w-full mt-4 h-10 rounded-lg">
          Thêm lựa chọn
        </Button>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Text strong className="text-blue-800">Đáp án đúng: </Text>
          <Text className="text-blue-700">
            Lựa chọn {options.findIndex((opt) => opt.id === correctAnswer) + 1}
            {(() => {
              const correctOpt = options.find((opt) => opt.id === correctAnswer);
              const displayText = correctOpt?.content ? getDisplayText(correctOpt.content) : correctOpt?.text;
              return displayText && <span> - {displayText}</span>;
            })()}
          </Text>
        </div>
      </SectionContainer>

      {/* Section 4: Additional Settings */}
      <SectionContainer>
        <SectionHeader step={4} title="Cài Đặt Bổ Sung" description="Giải thích đáp án" icon={<CheckCircleOutlined />} />
        <FormField label="Giải thích" hint="Hiển thị sau khi học viên trả lời">
          <Form.Item name={["data", "explanation"]} className="mb-0">
            <TextArea rows={3} className="rounded-lg" placeholder="Giải thích tại sao đây là đáp án đúng..." />
          </Form.Item>
        </FormField>
      </SectionContainer>

      <Form.Item name={["data", "options"]} className="hidden"><Input /></Form.Item>
      <Form.Item name={["data", "correctAnswer"]} className="hidden"><Input /></Form.Item>

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={{ imageUrl: uploadedImageUrl }}
        errorMessage={uploadError}
        fileNames={{ imageName: selectedImageFile?.name }}
      />
    </div>
  );
});

SelectionImageTextForm.displayName = "SelectionImageTextForm";

export default SelectionImageTextForm;