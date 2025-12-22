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
  SoundOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  uploadAudioByType,
  validateFile,
  UploadProgress,
} from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TTSButton from "@/components/shared/TTSButton";
import type { FormInstance } from "antd/es/form";
import { BoolAudioTextQuestionData } from "@/types/questionType";
import { pinyin } from "pinyin-pro";

const { TextArea } = Input;
const { Text } = Typography;

const DEV_MODE = false;

interface BoolAudioTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: BoolAudioTextQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface BoolAudioTextFormRef {
  uploadFiles: () => Promise<boolean>;
}

const BoolAudioTextForm = forwardRef<
  BoolAudioTextFormRef,
  BoolAudioTextFormProps
>(({ form, initialValues, questionType = "question_bool_audio_text" }, ref) => {
  // Audio upload state
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "uploading" | "success" | "error" | "idle"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(
    undefined
  );
  const [uploadError, setUploadError] = useState<string>("");

  // Transcript and Pinyin state
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [generatedPinyin, setGeneratedPinyin] = useState<string>("");

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;

      if (data.audio || data.audio_url) {
        setUploadedAudioUrl(data.audio_url || data.audio);
      }

      if (data.transcript) {
        setTranscriptText(data.transcript);
      }

      if (data.pinyin) {
        setGeneratedPinyin(data.pinyin);
      }
    }
  }, [initialValues]);

  // Generate Pinyin from transcript
  const generatePinyin = (text: string) => {
    if (!text.trim()) {
      setGeneratedPinyin("");
      return "";
    }

    try {
      const pinyinText = pinyin(text, {
        toneType: "symbol",
        type: "array",
      }).join(" ");
      setGeneratedPinyin(pinyinText);

      // Update the form field
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

  // Handle transcript change
  const handleTranscriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setTranscriptText(text);
    generatePinyin(text);
  };

  // Audio file selection handler - auto upload
  const handleAudioFileChange = async (file: File | null) => {
    if (!file) {
      setSelectedAudioFile(null);
      return false;
    }

    const audioValidation = validateFile(file, "audio", 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }

    setSelectedAudioFile(file);

    // Auto upload
    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadAudioByType(
        file,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue("data"),
            audio: result.url,
            audio_url: result.url,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedAudioFile(null);
        message.success("Tải âm thanh lên thành công!");
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

  // Audio upload handler
  const handleUploadAudio = async () => {
    if (!selectedAudioFile) {
      message.warning("Vui lòng chọn file âm thanh để tải lên");
      return;
    }

    const audioValidation = validateFile(selectedAudioFile, "audio", 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return;
    }

    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadAudioByType(
        selectedAudioFile,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue("data"),
            audio: result.url,
            audio_url: result.url,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedAudioFile(null);
        message.success("Tải âm thanh lên thành công!");
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
  };

  // Remove audio handler
  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedAudioUrl(undefined);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        audio: "",
        audio_url: "",
      },
    });
  };

  // Expose upload method to parent
  const handleUploadAllFiles = async (
    showModal: boolean = true
  ): Promise<boolean> => {
    // Check if we need to upload
    if (uploadedAudioUrl) {
      return true;
    }

    if (!selectedAudioFile) {
      message.warning("Vui lòng chọn file âm thanh để tải lên");
      return false;
    }

    const audioValidation = validateFile(selectedAudioFile, "audio", 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }

    if (showModal) {
      setUploadModalVisible(true);
    }
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadAudioByType(
        selectedAudioFile,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue("data"),
            audio: result.url,
            audio_url: result.url,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedAudioFile(null);

        if (showModal) {
          message.success("Tải âm thanh lên thành công!");
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
            placeholder="Nhập hướng dẫn cho học sinh (ví dụ: 'Nghe âm thanh và xác định câu phát biểu đúng hay sai')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Audio Section */}
      <Card title="File Âm Thanh" className="mb-6">
        <Form.Item
          label="2. File Âm Thanh *"
          name={["data", "audio"]}
          rules={[
            { required: true, message: "Vui lòng tải lên file âm thanh" },
          ]}
        >
          <div>
            <Space>
              <Upload
                accept="audio/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  handleAudioFileChange(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>
                  {selectedAudioFile ? selectedAudioFile.name : "Chọn Âm Thanh"}
                </Button>
              </Upload>
              <TTSButton
                text={transcriptText}
                buttonText="Tạo Giọng Nói"
                onAudioGenerated={async (audioUrl, audioBlob) => {
                  try {
                    // 1. Set status to uploading
                    setUploadModalVisible(true);
                    setUploadStatus('uploading');
                    setUploadProgress(0);
                    setUploadError('');

                    // 2. Use passed blob directly
                    
                    // 3. Create a File object
                    const filename = `tts_generated_${Date.now()}.wav`;
                    const file = new File([audioBlob], filename, { type: 'audio/wav' });

                    // 4. Upload to S3
                    const result = await uploadAudioByType(
                      file,
                      questionType,
                      (progress: UploadProgress) => {
                        setUploadProgress(Math.round(progress.percentage));
                      }
                    );

                    if (result.success && result.url) {
                      setUploadedAudioUrl(result.url);
                      form.setFieldsValue({
                        data: {
                          ...form.getFieldValue("data"),
                          audio: result.url,
                          audio_url: result.url,
                        },
                      });
                      
                      setUploadStatus('success');
                      setUploadProgress(100);
                      message.success("Tạo và tải lên giọng nói thành công!");
                    } else {
                      throw new Error(result.error || 'Upload failed');
                    }
                  } catch (error) {
                    console.error('TTS Upload error:', error);
                    setUploadStatus('error');
                    setUploadError(error instanceof Error ? error.message : 'Upload failed');
                    message.error('Lỗi khi tải lên giọng nói');
                  }
                }}
              />
            </Space>
            {uploadedAudioUrl && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <SoundOutlined className="text-green-500" />
                  <span className="text-green-500">Đã tải lên âm thanh</span>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveAudio}
                    type="text"
                    danger
                  />
                </div>
                <div className="mt-1">
                  <audio controls className="w-full">
                    <source src={uploadedAudioUrl} />
                    Trình duyệt của bạn không hỗ trợ phát âm thanh.
                  </audio>
                </div>
              </div>
            )}
          </div>
        </Form.Item>

        {/* Hidden audio_url field */}
        <Form.Item name={["data", "audio_url"]} className="hidden">
          <Input />
        </Form.Item>
      </Card>

      {/* Audio Content */}
      <Card title="Nội Dung Âm Thanh" className="mb-6">
        <Form.Item
          label="3. Bản Ghi (Tiếng Trung) *"
          name={["data", "transcript"]}
          rules={[
            { required: true, message: "Vui lòng nhập bản ghi tiếng Trung" },
          ]}
        >
          <Input
            placeholder="Nhập bản ghi tiếng Trung của âm thanh"
            onChange={handleTranscriptChange}
            className="text-base"
          />
        </Form.Item>

        <Form.Item label="4. Pinyin" name={["data", "pinyin"]}>
          <Space className="w-full">
            <Input
              placeholder="Pinyin sẽ được tự động tạo"
              value={generatedPinyin}
              onChange={(e) => setGeneratedPinyin(e.target.value)}
              className="w-[400px]"
            />
            {transcriptText && (
              <Button
                icon={<ReloadOutlined />}
                onClick={() => generatePinyin(transcriptText)}
              >
                Tạo Lại Pinyin
              </Button>
            )}
          </Space>
        </Form.Item>

        {/* Pinyin Preview */}
        {generatedPinyin && (
          <div className="mb-4">
            <div className="my-2">
              <Text strong>Pinyin Đã Tạo:</Text>
            </div>
            <div className="p-3 bg-gray-100 rounded-md text-base text-blue-500">
              {generatedPinyin}
            </div>
          </div>
        )}

        <Form.Item
          label="5. Bản Dịch Tiếng Anh"
          name={["data", "english"]}
          help="Bản dịch tiếng Anh tùy chọn của nội dung âm thanh"
        >
          <Input placeholder="Nhập bản dịch tiếng Anh của âm thanh" />
        </Form.Item>
      </Card>

      {/* Answer Section */}
      <Card title="Đáp Án" className="mb-6">
        <Form.Item
          label="6. Đáp Án Đúng *"
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

      {/* Preview Section
      {transcriptText && (
        <Card title="Xem Trước Câu Hỏi" style={{ marginBottom: "24px" }}>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#fafafa",
              borderRadius: "6px",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <Text strong>Bản Ghi: </Text>
              <span style={{ fontSize: "18px" }}>{transcriptText}</span>
            </div>
            {generatedPinyin && (
              <div style={{ marginBottom: "12px" }}>
                <Text strong>Pinyin: </Text>
                <span style={{ fontSize: "16px", color: "#1890ff" }}>
                  {generatedPinyin}
                </span>
              </div>
            )}
            {form.getFieldValue(["data", "english"]) && (
              <div style={{ marginBottom: "12px" }}>
                <Text strong>Tiếng Anh: </Text>
                <span style={{ fontSize: "16px", color: "#666" }}>
                  {form.getFieldValue(["data", "english"])}
                </span>
              </div>
            )}
            {form.getFieldValue(["data", "correctAnswer"]) !== undefined && (
              <div>
                <Text strong>Đáp Án Đúng: </Text>
                <span
                  style={{
                    fontSize: "16px",
                    color: form.getFieldValue(["data", "correctAnswer"])
                      ? "#52c41a"
                      : "#ff4d4f",
                  }}
                >
                  {form.getFieldValue(["data", "correctAnswer"])
                    ? "Đúng"
                    : "Sai"}
                </span>
              </div>
            )}
          </div>
        </Card>
      )} */}

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={{ audioUrl: uploadedAudioUrl }}
        errorMessage={uploadError}
        fileNames={{
          audioName: selectedAudioFile?.name,
        }}
      />
    </div>
  );
});

BoolAudioTextForm.displayName = "BoolAudioTextForm";

export default BoolAudioTextForm;