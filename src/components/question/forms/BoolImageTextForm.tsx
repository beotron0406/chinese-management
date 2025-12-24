"use client";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Form,
  Input,
  Button,
  Radio,
  Upload,
  message,
  Card,
  Space,
  Typography,
  Switch,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  uploadImageByType,
  validateFile,
  UploadProgress,
} from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TextContentInput from "@/components/shared/TextContentInput";
import type { FormInstance } from "antd/es/form";
import { BoolImageTextQuestionData } from "@/types/questionType";
import { TextContent } from "@/types/textContent";

const { TextArea } = Input;
const { Text } = Typography;

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

const BoolImageTextForm = forwardRef<
  BoolImageTextFormRef,
  BoolImageTextFormProps
>(({ form, initialValues, questionType = "question_bool_image_text" }, ref) => {
  // Image upload state
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "uploading" | "success" | "error" | "idle"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>(
    undefined
  );
  const [uploadError, setUploadError] = useState<string>("");
  const [imageAlt, setImageAlt] = useState<string>("");

  // Statement content state
  const [statementContent, setStatementContent] = useState<TextContent>({ text: '' });

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;

      if (data.image || data.image_url) {
        setUploadedImageUrl(data.image_url || data.image);
      }

      if (data.alt) {
        setImageAlt(data.alt);
      }

      // Handle statementContent
      if (data.statementContent) {
        setStatementContent(data.statementContent);
      }
    }
  }, [initialValues]);

  // Image file selection handler - auto upload
  const handleImageFileChange = async (file: File | null) => {
    if (!file) {
      setSelectedImageFile(null);
      return false;
    }

    const imageValidation = validateFile(file, "image", 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return false;
    }

    setSelectedImageFile(file);

    // Auto upload
    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadImageByType(
        file,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        setUploadedImageUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue("data"),
            image: result.url,
            image_url: result.url,
            alt: imageAlt,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedImageFile(null);
        message.success("Tải hình ảnh lên thành công!");
      } else {
        throw new Error(
          result.error || "Tải lên thất bại - không có URL trả về"
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(
        error instanceof Error ? error.message : "Tải lên thất bại"
      );
      message.error("Tải lên thất bại. Vui lòng thử lại.");
    }

    return false;
  };

  // Remove image handler
  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setUploadedImageUrl(undefined);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        image: "",
        image_url: "",
      },
    });
  };

  // Handle alt text change
  const handleAltTextChange = (value: string) => {
    setImageAlt(value);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        alt: value,
      },
    });
  };

  // Handle statement content change
  const handleStatementChange = (content: TextContent) => {
    setStatementContent(content);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        statementContent: content,
      },
    });
  };

  // Expose upload method to parent
  const handleUploadAllFiles = async (
    showModal: boolean = true
  ): Promise<boolean> => {
    // Check if we need to upload
    if (uploadedImageUrl) {
      return true;
    }

    if (!selectedImageFile) {
      message.warning("Vui lòng chọn file hình ảnh để tải lên");
      return false;
    }

    const imageValidation = validateFile(selectedImageFile, "image", 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return false;
    }

    if (showModal) {
      setUploadModalVisible(true);
    }
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadImageByType(
        selectedImageFile,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        setUploadedImageUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue("data"),
            image: result.url,
            image_url: result.url,
            alt: imageAlt,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedImageFile(null);

        if (showModal) {
          message.success("Tải hình ảnh lên thành công!");
        }
        return true;
      } else {
        throw new Error(
          result.error || "Tải lên thất bại - không có URL trả về"
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(
        error instanceof Error ? error.message : "Tải lên thất bại"
      );
      message.error("Tải lên thất bại. Vui lòng thử lại.");
      return false;
    }
  };

  // Expose upload method to parent
  useImperativeHandle(ref, () => ({
    uploadFiles: () => handleUploadAllFiles(false),
  }));

  return (
    <div>
      {/* Question Setup */}
      <Card title="Thiết Lập Câu Hỏi" className="mb-6">
        <Form.Item
          label="1. Hướng Dẫn Câu Hỏi *"
          name={["data", "instruction"]}
          rules={[
            { required: true, message: "Vui lòng nhập hướng dẫn câu hỏi" },
          ]}
        >
          <TextArea
            placeholder="Nhập hướng dẫn cho học sinh (ví dụ: 'Nhìn hình ảnh và xác định câu phát biểu đúng hay sai')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Image Section */}
      <Card title="Hình Ảnh" className="mb-6">
        <Form.Item
          label="2. File Hình Ảnh *"
          name={["data", "image"]}
          rules={[
            { required: true, message: "Vui lòng tải lên file hình ảnh" },
          ]}
        >
          <div>
            <Upload
              accept="image/*"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => {
                handleImageFileChange(file);
                return false;
              }}
              disabled={!!uploadedImageUrl}
            >
              <Button
                icon={<UploadOutlined />}
                disabled={!!uploadedImageUrl}
              >
                {selectedImageFile ? selectedImageFile.name : "Chọn Hình Ảnh"}
              </Button>
            </Upload>
            {uploadedImageUrl && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <PictureOutlined className="text-green-500" />
                  <span className="text-green-500">Đã tải lên hình ảnh</span>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveImage}
                    type="text"
                    danger
                  />
                </div>
                <div className="mt-2">
                  <img
                    src={uploadedImageUrl}
                    alt={imageAlt || "Question image"}
                    className="max-w-[300px] max-h-[300px] object-cover rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </Form.Item>

        {/* Alt Text */}
        <Form.Item
          label="3. Văn Bản Thay Thế"
          name={["data", "alt"]}
          help="Mô tả nội dung trong hình ảnh"
        >
          <Input
            placeholder="Mô tả nội dung trong hình ảnh"
            value={imageAlt}
            onChange={(e) => handleAltTextChange(e.target.value)}
          />
        </Form.Item>

        {/* Hidden image_url field */}
        <Form.Item name={["data", "image_url"]} className="hidden">
          <Input />
        </Form.Item>
      </Card>

      {/* Statement Section */}
      <Card title="Câu Phát Biểu" className="mb-6">
        <Form.Item
          label="4. Câu Phát Biểu Cần Đánh Giá *"
          help="Nhập câu phát biểu mà học sinh cần xác định đúng hay sai dựa trên hình ảnh"
          required
        >
          <TextContentInput
            value={statementContent}
            onChange={handleStatementChange}
            placeholder="Nhập câu phát biểu..."
          />
        </Form.Item>
        <Form.Item name={["data", "statementContent"]} className="hidden">
          <Input />
        </Form.Item>
      </Card>

      {/* Answer Section */}
      <Card title="Đáp Án" className="mb-6">
        <Form.Item
          label="5. Đáp Án Đúng *"
          name={["data", "correctAnswer"]}
          rules={[{ required: true, message: "Vui lòng chọn đáp án đúng" }]}
        >
          <Radio.Group>
            <Space direction="vertical">
              <Radio value={true}>Đúng</Radio>
              <Radio value={false}>Sai</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {/* Answer Preview */}
        {form.getFieldValue(["data", "correctAnswer"]) !== undefined && (
          <div className="mt-3 p-2 bg-green-50 rounded">
            <Text strong>Đáp Án Đã Chọn: </Text>
            <span
              className={`text-base ${
                form.getFieldValue(["data", "correctAnswer"])
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {form.getFieldValue(["data", "correctAnswer"]) ? "Đúng" : "Sai"}
            </span>
          </div>
        )}
      </Card>

      {/* Additional Settings */}
      <Card title="Cài Đặt Bổ Sung" className="mb-6">
        <Form.Item
          label="Giải Thích (Tùy Chọn)"
          name={["data", "explanation"]}
          help="Cung cấp giải thích sẽ được hiển thị sau khi học sinh trả lời"
        >
          <TextArea
            placeholder="Giải thích tại sao câu phát biểu đúng hoặc sai..."
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>

        <Form.Item
          label="Kích Hoạt"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={{ imageUrl: uploadedImageUrl }}
        errorMessage={uploadError}
        fileNames={{
          imageName: selectedImageFile?.name,
        }}
      />
    </div>
  );
});

BoolImageTextForm.displayName = "BoolImageTextForm";

export default BoolImageTextForm;
