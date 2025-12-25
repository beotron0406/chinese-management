"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Button,
  Radio,
  Upload,
  message,
  Space,
  Typography,
  Switch,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { uploadImageByType, validateFile, UploadProgress } from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TextContentInput from "@/components/shared/TextContentInput";
import type { FormInstance } from "antd/es/form";
import { BoolImageTextQuestionData } from "@/types/questionType";
import { TextContent } from "@/types/textContent";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { TextArea } = Input;

interface BoolImageTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: BoolImageTextQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface BoolImageTextFormRef {
  uploadFiles: () => Promise<boolean>;
}

const BoolImageTextForm = forwardRef<BoolImageTextFormRef, BoolImageTextFormProps>(
  ({ form, initialValues, questionType = "question_bool_image_text" }, ref) => {
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "error" | "idle">("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>(undefined);
    const [uploadError, setUploadError] = useState<string>("");
    const [imageAlt, setImageAlt] = useState<string>("");
    const [statementContent, setStatementContent] = useState<TextContent>({ text: "" });

    useEffect(() => {
      if (initialValues?.data) {
        const { data } = initialValues;
        if (data.image || data.image_url) setUploadedImageUrl(data.image_url || data.image);
        if (data.alt) setImageAlt(data.alt);
        if (data.statementContent) setStatementContent(data.statementContent);
      }
    }, [initialValues]);

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
          form.setFieldsValue({ data: { ...form.getFieldValue("data"), image: result.url, image_url: result.url, alt: imageAlt } });
          setUploadStatus("success");
          setUploadProgress(100);
          setSelectedImageFile(null);
          message.success("Tải hình ảnh lên thành công!");
        } else {
          throw new Error(result.error || "Tải lên thất bại");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(error instanceof Error ? error.message : "Tải lên thất bại");
        message.error("Tải lên thất bại.");
      }
      return false;
    };

    const handleRemoveImage = () => {
      setSelectedImageFile(null);
      setUploadedImageUrl(undefined);
      form.setFieldsValue({ data: { ...form.getFieldValue("data"), image: "", image_url: "" } });
    };

    const handleAltTextChange = (value: string) => {
      setImageAlt(value);
      form.setFieldsValue({ data: { ...form.getFieldValue("data"), alt: value } });
    };

    const handleStatementChange = (content: TextContent) => {
      setStatementContent(content);
      form.setFieldsValue({ data: { ...form.getFieldValue("data"), statementContent: content } });
    };

    const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
      if (uploadedImageUrl) return true;
      if (!selectedImageFile) { message.warning("Vui lòng chọn file hình ảnh"); return false; }
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
        if (result.success && result.url) {
          setUploadedImageUrl(result.url);
          form.setFieldsValue({ data: { ...form.getFieldValue("data"), image: result.url, image_url: result.url, alt: imageAlt } });
          setUploadStatus("success");
          setUploadProgress(100);
          setSelectedImageFile(null);
          if (showModal) message.success("Tải hình ảnh lên thành công!");
          return true;
        } else {
          throw new Error(result.error || "Tải lên thất bại");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(error instanceof Error ? error.message : "Tải lên thất bại");
        message.error("Tải lên thất bại.");
        return false;
      }
    };

    useImperativeHandle(ref, () => ({ uploadFiles: () => handleUploadAllFiles(false) }));

    return (
      <div className="max-w-2xl mx-auto">
        {/* Section 1: Question Setup */}
        <SectionContainer>
          <SectionHeader step={1} title="Thiết Lập Câu Hỏi" description="Nhập hướng dẫn cho học sinh" icon={<QuestionCircleOutlined />} />
          <FormField label="Hướng dẫn câu hỏi" required>
            <Form.Item name={["data", "instruction"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <TextArea rows={2} className="rounded-lg" placeholder="VD: Nhìn hình ảnh và xác định câu phát biểu đúng hay sai" />
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 2: Image */}
        <SectionContainer>
          <SectionHeader step={2} title="Hình Ảnh" description="Tải lên hình ảnh cho câu hỏi" icon={<PictureOutlined />} />
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
          <Form.Item name={["data", "image_url"]} className="hidden"><Input /></Form.Item>
        </SectionContainer>

        {/* Section 3: Statement */}
        <SectionContainer>
          <SectionHeader step={3} title="Câu Phát Biểu" description="Nhập câu cần đánh giá đúng/sai" icon={<CheckCircleOutlined />} />
          <FormField label="Câu phát biểu" required hint="Học sinh cần xác định câu này đúng hay sai dựa trên hình ảnh">
            <TextContentInput value={statementContent} onChange={handleStatementChange} placeholder="Nhập câu phát biểu..." />
          </FormField>
          <Form.Item name={["data", "statementContent"]} className="hidden"><Input /></Form.Item>
        </SectionContainer>

        {/* Section 4: Answer */}
        <SectionContainer>
          <SectionHeader step={4} title="Đáp Án" description="Chọn đáp án đúng" icon={<CheckCircleOutlined />} />
          <FormField label="Đáp án đúng" required>
            <Form.Item name={["data", "correctAnswer"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value={true}>Đúng</Radio>
                  <Radio value={false}>Sai</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 5: Additional */}
        <SectionContainer>
          <SectionHeader step={5} title="Cài Đặt Bổ Sung" description="Giải thích và trạng thái" icon={<CheckCircleOutlined />} />
          <FormField label="Giải thích" hint="Hiển thị sau khi học sinh trả lời">
            <Form.Item name={["data", "explanation"]} className="mb-0">
              <TextArea rows={3} className="rounded-lg" placeholder="Giải thích tại sao câu phát biểu đúng hoặc sai..." />
            </Form.Item>
          </FormField>
          <FormField label="Kích hoạt">
            <Form.Item name="isActive" valuePropName="checked" initialValue={true} className="mb-0">
              <Switch />
            </Form.Item>
          </FormField>
        </SectionContainer>

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
  }
);

BoolImageTextForm.displayName = "BoolImageTextForm";

export default BoolImageTextForm;
