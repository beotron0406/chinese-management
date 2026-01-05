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
import { SelectionTextImageQuestionData } from "@/types/questionType";
import { TextContent } from "@/types/textContent";
import { uploadImageByType, validateFile, UploadProgress } from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TextContentInput from "@/components/shared/TextContentInput";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { Text } = Typography;
const { TextArea } = Input;

interface SelectionTextImageFormProps {
  form: FormInstance;
  initialValues?: {
    data?: SelectionTextImageQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface SelectionTextImageFormRef {
  uploadFiles: () => Promise<boolean>;
}

const SelectionTextImageForm = forwardRef<SelectionTextImageFormRef, SelectionTextImageFormProps>(({
  form,
  initialValues,
  questionType = "question_selection_text_image",
}, ref) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "error" | "idle">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>("");
  const [answerImageUploads, setAnswerImageUploads] = useState<{ [key: number]: { file: File | null; uploadedUrl?: string } }>({});
  const [options, setOptions] = useState<SelectionTextImageQuestionData["options"]>([
    { id: "1", image: "", alt: "" },
    { id: "2", image: "", alt: "" },
    { id: "3", image: "", alt: "" },
    { id: "4", image: "", alt: "" },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("1");
  const [questionContent, setQuestionContent] = useState<TextContent>({ text: "" });

  const updateFormData = (newOptions: SelectionTextImageQuestionData["options"], newCorrectAnswer: string, newQuestionContent?: TextContent) => {
    const qContent = newQuestionContent || questionContent;
    form.setFieldsValue({ data: { ...form.getFieldValue("data"), questionContent: qContent, options: newOptions, correctAnswer: newCorrectAnswer } });
  };

  const handleQuestionContentChange = (content: TextContent) => {
    setQuestionContent(content);
    updateFormData(options, correctAnswer, content);
  };

  const handleAnswerImageChange = async (optionId: string, file: File | null) => {
    if (!file) return false;
    const optionIndex = options.findIndex((opt) => opt.id === optionId);
    if (optionIndex < 0) return false;
    const imageValidation = validateFile(file, "image", 10);
    if (!imageValidation.isValid) { message.error(imageValidation.error); return false; }
    setAnswerImageUploads((prev) => ({ ...prev, [optionIndex]: { file, uploadedUrl: prev[optionIndex]?.uploadedUrl } }));
    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadImageByType(file, questionType, (progress: UploadProgress) => {
        setUploadProgress(Math.round(progress.percentage));
      });
      if (result.success && result.url) {
        setAnswerImageUploads((prev) => ({ ...prev, [optionIndex]: { file: null, uploadedUrl: result.url } }));
        const updatedOptions = options.map((option) => (option.id === optionId ? { ...option, image: result.url || "" } : option));
        setOptions(updatedOptions);
        updateFormData(updatedOptions, correctAnswer);
        setUploadStatus("success");
        setUploadProgress(100);
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

  const handleRemoveAnswerImage = (optionId: string) => {
    const optionIndex = options.findIndex((opt) => opt.id === optionId);
    setAnswerImageUploads((prev) => ({ ...prev, [optionIndex]: { file: null, uploadedUrl: undefined } }));
    const updatedOptions = options.map((option) => (option.id === optionId ? { ...option, image: "" } : option));
    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const handleAltTextChange = (optionId: string, value: string) => {
    const updatedOptions = options.map((option) => (option.id === optionId ? { ...option, alt: value } : option));
    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    const newOptions = [...options, { id: newId, image: "", alt: "" }];
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
    const answerImagesToUpload = Object.entries(answerImageUploads).filter(([_, upload]) => upload.file && !upload.uploadedUrl);
    if (answerImagesToUpload.length === 0) {
      const allOptionsHaveImages = options.every((option) => option.image);
      if (allOptionsHaveImages) return true;
      message.warning("Vui lòng chọn và tải lên tất cả hình ảnh");
      return false;
    }
    for (const [index, upload] of answerImagesToUpload) {
      if (upload.file) {
        const imageValidation = validateFile(upload.file, "image", 10);
        if (!imageValidation.isValid) { message.error(`Hình ảnh ${parseInt(index) + 1}: ${imageValidation.error}`); return false; }
      }
    }
    if (showModal) setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const uploadPromises: Promise<any>[] = [];
      const totalFiles = answerImagesToUpload.length;
      let completedFiles = 0;
      for (const [index, upload] of answerImagesToUpload) {
        if (upload.file) {
          const imagePromise = uploadImageByType(upload.file, questionType, (progress: UploadProgress) => {
            const fileProgress = progress.percentage / totalFiles;
            setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress));
          }).then((result) => ({ type: "option_image", index: parseInt(index), result }));
          uploadPromises.push(imagePromise);
        }
      }
      const results = await Promise.all(uploadPromises);
      const newAnswerUploads = { ...answerImageUploads };
      let updatedOptions = [...options];
      for (const item of results) {
        if (item.type === "option_image") {
          if (item.result.success) {
            newAnswerUploads[item.index] = { file: null, uploadedUrl: item.result.url };
            updatedOptions[item.index] = { ...updatedOptions[item.index], image: item.result.url };
          } else {
            throw new Error(`Tải hình ảnh ${item.index + 1} thất bại: ${item.result.error}`);
          }
        }
        completedFiles++;
      }
      setAnswerImageUploads(newAnswerUploads);
      setOptions(updatedOptions);
      form.setFieldsValue({ data: { ...form.getFieldValue("data"), options: updatedOptions } });
      setUploadStatus("success");
      setUploadProgress(100);
      if (showModal) message.success("Tất cả hình ảnh đã tải lên thành công!");
      return true;
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
      if (data.questionContent) setQuestionContent(data.questionContent);
      else if (data.question) setQuestionContent({ text: data.question });
      if (data.options) {
        setOptions(data.options);
        const imageUploads: typeof answerImageUploads = {};
        data.options.forEach((option, index) => { if (option.image) imageUploads[index] = { file: null, uploadedUrl: option.image }; });
        setAnswerImageUploads(imageUploads);
      }
      if (data.correctAnswer) setCorrectAnswer(data.correctAnswer);
    }
  }, [initialValues]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Section 1: Question Setup */}
      <SectionContainer>
        <SectionHeader step={1} title="Thiết Lập Câu Hỏi" description="Nhập hướng dẫn và nội dung câu hỏi" icon={<QuestionCircleOutlined />} />
        <FormField label="Hướng dẫn câu hỏi" required>
          <Form.Item name={["data", "instruction"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
            <Input size="large" className="rounded-lg" placeholder="VD: Đọc văn bản và chọn hình ảnh đúng" />
          </Form.Item>
        </FormField>
        <FormField label="Văn bản câu hỏi" required>
          <TextContentInput value={questionContent} onChange={handleQuestionContentChange} placeholder="Nhập văn bản câu hỏi mà học viên sẽ đọc" multiline rows={3} />
        </FormField>
      </SectionContainer>

      {/* Section 2: Answer Options */}
      <SectionContainer>
        <SectionHeader step={2} title="Các Lựa Chọn Trả Lời (Hình Ảnh)" description="Tải lên hình ảnh và chọn đáp án đúng" icon={<OrderedListOutlined />} />
        <div className="space-y-4">
          {options.map((option, index) => {
            const answerUpload = answerImageUploads[index];
            return (
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

                <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                  <Upload
                    accept="image/*"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => { handleAnswerImageChange(option.id, file); return false; }}
                    disabled={!!answerUpload?.uploadedUrl}
                  >
                    <Button icon={<UploadOutlined />} size="large" className="rounded-lg" disabled={!!answerUpload?.uploadedUrl}>
                      {answerUpload?.file ? answerUpload.file.name : "Chọn Hình Ảnh"}
                    </Button>
                  </Upload>
                  {answerUpload?.uploadedUrl && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <PictureOutlined />
                        <span className="text-sm font-medium">Đã tải lên</span>
                        <Button size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveAnswerImage(option.id)} type="text" danger>Xóa</Button>
                      </div>
                      <img src={answerUpload.uploadedUrl} alt={option.alt || `Option ${index + 1}`} className="max-w-[200px] max-h-[200px] object-cover rounded-lg border" />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <Input size="large" className="rounded-lg" placeholder="Văn bản thay thế (mô tả hình ảnh)" value={option.alt} onChange={(e) => handleAltTextChange(option.id, e.target.value)} />
                </div>
              </div>
            );
          })}
        </div>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addOption} disabled={options.length >= 6} className="w-full mt-4 h-10 rounded-lg">
          Thêm lựa chọn
        </Button>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Text strong className="text-blue-800">Đáp án đúng: </Text>
          <Text className="text-blue-700">
            Lựa chọn {options.findIndex((opt) => opt.id === correctAnswer) + 1}
            {options.find((opt) => opt.id === correctAnswer)?.alt && <span> - {options.find((opt) => opt.id === correctAnswer)?.alt}</span>}
          </Text>
        </div>
      </SectionContainer>

      {/* Section 3: Additional Settings */}
      <SectionContainer>
        <SectionHeader step={3} title="Cài Đặt Bổ Sung" description="Giải thích đáp án" icon={<CheckCircleOutlined />} />
        <FormField label="Giải thích" hint="Hiển thị sau khi học viên trả lời">
          <Form.Item name={["data", "explanation"]} className="mb-0">
            <TextArea rows={3} className="rounded-lg" placeholder="Giải thích tại sao đây là đáp án đúng..." />
          </Form.Item>
        </FormField>
      </SectionContainer>

      <Form.Item name={["data", "questionContent"]} className="hidden"><Input /></Form.Item>
      <Form.Item name={["data", "options"]} className="hidden"><Input /></Form.Item>
      <Form.Item name={["data", "correctAnswer"]} className="hidden"><Input /></Form.Item>

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={{}}
        errorMessage={uploadError}
        fileNames={{}}
      />
    </div>
  );
});

SelectionTextImageForm.displayName = "SelectionTextImageForm";

export default SelectionTextImageForm;