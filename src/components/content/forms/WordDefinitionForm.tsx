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
  Card,
  Typography,
  Row,
  Col,
  Upload,
  Button,
  message,
} from "antd";
import {
  SoundOutlined,
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { WordDefinitionData } from "@/types/contentTypes";
import {
  uploadImageByType,
  uploadAudioByType,
  validateFile,
  UploadProgress,
} from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TTSButton from "@/components/shared/TTSButton";

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = false;

interface WordDefinitionFormProps {
  form: FormInstance;
  initialValues?: WordDefinitionData;
  contentType?: string;
}

export interface WordDefinitionFormRef {
  uploadFiles: () => Promise<boolean>;
}

const WordDefinitionForm = forwardRef<
  WordDefinitionFormRef,
  WordDefinitionFormProps
>(({ form, initialValues, contentType = "content_word_definition" }, ref) => {
  const [chineseText, setChineseText] = useState<string>("");
  const [generatedPinyin, setGeneratedPinyin] = useState<string>("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "uploading" | "success" | "error" | "idle"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState<{
    imageUrl?: string;
    audioUrl?: string;
  }>({});
  const [uploadError, setUploadError] = useState<string>("");

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

  const handleChineseTextChange = (value: string) => {
    setChineseText(value);
    const pinyinResult = generatePinyin(value);
    setGeneratedPinyin(pinyinResult);

    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        chinese_text: value,
        pinyin: pinyinResult,
      },
    });
  };

  useEffect(() => {
    if (initialValues) {
      setChineseText(initialValues.chinese_text || "");
      setGeneratedPinyin(initialValues.pinyin || "");
      // If editing existing content, set the URLs
      if (initialValues.picture_url) {
        setUploadedUrls((prev) => ({
          ...prev,
          imageUrl: initialValues.picture_url,
        }));
      }
      if (initialValues.audio_url) {
        setUploadedUrls((prev) => ({
          ...prev,
          audioUrl: initialValues.audio_url,
        }));
      }
    }
  }, [initialValues]);

  const handleImageFileChange = async (file: File) => {
    setSelectedImageFile(file);

    // Auto-upload immediately
    const imageValidation = validateFile(file, "image", 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return false;
    }

    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadImageByType(
        file,
        contentType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedUrls((prev) => ({ ...prev, imageUrl: result.url }));
        const currentData = form.getFieldValue("data") || {};
        form.setFieldsValue({
          data: {
            ...currentData,
            picture_url: result.url,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedImageFile(null);
        message.success("Tải hình ảnh lên thành công!");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      message.error("Tải lên thất bại. Vui lòng thử lại.");
    }

    return false; // Prevent automatic upload
  };

  const handleAudioFileChange = async (file: File) => {
    setSelectedAudioFile(file);

    // Auto-upload immediately
    const audioValidation = validateFile(file, "audio", 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }

    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadAudioByType(
        file,
        contentType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedUrls((prev) => ({ ...prev, audioUrl: result.url }));
        const currentData = form.getFieldValue("data") || {};
        form.setFieldsValue({
          data: {
            ...currentData,
            audio_url: result.url,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedAudioFile(null);
        message.success("Tải âm thanh lên thành công!");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      message.error("Tải lên thất bại. Vui lòng thử lại.");
    }

    return false; // Prevent automatic upload
  };

  const handleUploadFiles = async (
    showModal: boolean = true
  ): Promise<boolean> => {
    if (!selectedImageFile && !selectedAudioFile) {
      if (uploadedUrls.imageUrl && uploadedUrls.audioUrl) {
        // Already uploaded
        return true;
      }
      message.warning("Vui lòng chọn ít nhất một file để tải lên");
      return false;
    }

    // Validate files
    if (selectedImageFile) {
      const imageValidation = validateFile(selectedImageFile, "image", 10);
      if (!imageValidation.isValid) {
        message.error(imageValidation.error);
        return false;
      }
    }

    if (selectedAudioFile) {
      const audioValidation = validateFile(selectedAudioFile, "audio", 10);
      if (!audioValidation.isValid) {
        message.error(audioValidation.error);
        return false;
      }
    }

    if (showModal) {
      setUploadModalVisible(true);
    }
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const uploadPromises: Promise<any>[] = [];
      let imageUrl = uploadedUrls.imageUrl;
      let audioUrl = uploadedUrls.audioUrl;

      // Upload image if selected
      if (selectedImageFile) {
        const imageUploadPromise = uploadImageByType(
          selectedImageFile,
          contentType,
          (progress: UploadProgress) => {
            setUploadProgress(Math.round(progress.percentage / 2)); // 50% for image
          }
        );
        uploadPromises.push(imageUploadPromise);
      }

      // Upload audio if selected
      if (selectedAudioFile) {
        const audioUploadPromise = uploadAudioByType(
          selectedAudioFile,
          contentType,
          (progress: UploadProgress) => {
            const baseProgress = selectedImageFile ? 50 : 0;
            const audioProgress = selectedImageFile
              ? progress.percentage / 2
              : progress.percentage;
            setUploadProgress(Math.round(baseProgress + audioProgress));
          }
        );
        uploadPromises.push(audioUploadPromise);
      }

      const results = await Promise.all(uploadPromises);

      // Process results
      let resultIndex = 0;
      if (selectedImageFile) {
        const imageResult = results[resultIndex++];
        if (imageResult.success) {
          imageUrl = imageResult.url;
        } else {
          throw new Error(`Image upload failed: ${imageResult.error}`);
        }
      }

      if (selectedAudioFile) {
        const audioResult = results[resultIndex++];
        if (audioResult.success) {
          audioUrl = audioResult.url;
        } else {
          throw new Error(`Audio upload failed: ${audioResult.error}`);
        }
      }

      // Update form values with URLs
      const currentData = form.getFieldValue("data") || {};
      form.setFieldsValue({
        data: {
          ...currentData,
          picture_url: imageUrl,
          audio_url: audioUrl,
        },
      });

      setUploadedUrls({ imageUrl, audioUrl });
      setUploadStatus("success");
      setUploadProgress(100);
      setSelectedImageFile(null);
      setSelectedAudioFile(null);

      if (showModal) {
        message.success("Tải file lên thành công!");
      }
      return true;
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      message.error("Tải lên thất bại. Vui lòng thử lại.");
      return false;
    }
  };

  // Expose upload method to parent
  useImperativeHandle(ref, () => ({
    uploadFiles: () => handleUploadFiles(false),
  }));

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setUploadedUrls((prev) => ({ ...prev, imageUrl: undefined }));
    const currentData = form.getFieldValue("data") || {};
    form.setFieldsValue({
      data: {
        ...currentData,
        picture_url: undefined,
      },
    });
  };

  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedUrls((prev) => ({ ...prev, audioUrl: undefined }));
    const currentData = form.getFieldValue("data") || {};
    form.setFieldsValue({
      data: {
        ...currentData,
        audio_url: undefined,
      },
    });
  };

  return (
    <div>
      <Card title="Thông Tin Từ Vựng" className="mb-6">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="1. Văn Bản Tiếng Trung *"
              name={["data", "chinese_text"]}
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập văn bản tiếng Trung",
                },
              ]}
            >
              <Input
                onChange={(e) => handleChineseTextChange(e.target.value)}
                className="text-lg"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="2. Pinyin (Tự Động Tạo) *"
              name={["data", "pinyin"]}
              rules={[{ required: true, message: "Pinyin là bắt buộc" }]}
            >
              <Input
                value={generatedPinyin}
                onChange={(e) => setGeneratedPinyin(e.target.value)}
                addonAfter={<SoundOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="3. Loại Từ *"
          name={["data", "speech"]}
          rules={[{ required: true, message: "Vui lòng nhập loại từ" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="4. Dịch Nghĩa *"
          name={["data", "translation"]}
          rules={[{ required: true, message: "Vui lòng nhập bản dịch" }]}
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="5. Thông Tin Bổ Sung" name={["data", "additional_info"]}>
          <TextArea rows={4} />
        </Form.Item>
      </Card>

      <Card title="File Đa Phương Tiện" className="mb-6">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="6. File Hình Ảnh *"
              name={["data", "picture_url"]}
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
                >
                  <Button icon={<UploadOutlined />} className="mb-2">
                    {selectedImageFile
                      ? selectedImageFile.name
                      : "Chọn Hình Ảnh"}
                  </Button>
                </Upload>
                {uploadedUrls.imageUrl && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <PictureOutlined className="text-green-500" />
                      <span className="text-green-500">
                        Hình ảnh đã tải lên
                      </span>
                      <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={handleRemoveImage}
                        type="text"
                        danger
                      />
                    </div>
                    <div className="mt-1">
                      <img
                        src={uploadedUrls.imageUrl}
                        alt="Preview"
                        className="max-w-[100px] max-h-[100px] object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="7. File Âm Thanh *"
              name={["data", "audio_url"]}
              rules={[
                { required: true, message: "Vui lòng tải lên file âm thanh" },
              ]}
            >
              <div>
                <div className="mb-2 flex gap-2">
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
                      {selectedAudioFile
                        ? selectedAudioFile.name
                        : "Chọn Âm Thanh"}
                    </Button>
                  </Upload>
                  <TTSButton
                    text={chineseText}
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
                          contentType,
                          (progress: UploadProgress) => {
                            setUploadProgress(Math.round(progress.percentage));
                          }
                        );

                        if (result.success && result.url) {
                          setUploadedUrls((prev) => ({ ...prev, audioUrl: result.url }));
                          const currentData = form.getFieldValue("data") || {};
                          form.setFieldsValue({
                            data: {
                              ...currentData,
                              audio_url: result.url,
                            },
                          });
                          
                          setUploadStatus('success');
                          setUploadProgress(100);
                          message.success('Tạo và tải lên giọng nói thành công!');
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
                </div>
                {uploadedUrls.audioUrl && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <SoundOutlined className="text-green-500" />
                      <span className="text-green-500">
                        Âm thanh đã tải lên
                      </span>
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
                        <source src={uploadedUrls.audioUrl} />
                        Trình duyệt của bạn không hỗ trợ phần tử âm thanh.
                      </audio>
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>
          </Col>
        </Row>

        {DEV_MODE && (selectedImageFile || selectedAudioFile) && (
          <div className="text-center mt-4">
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => handleUploadFiles(true)}
              loading={uploadStatus === "uploading"}
              size="large"
            >
              Tải Lên S3 (Chế Độ Dev)
            </Button>
          </div>
        )}
      </Card>

      {/* {chineseText && (
        <Card title="Xem Trước" style={{ marginBottom: "24px" }}>
          <div
            style={{
              padding: "16px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              backgroundColor: "#fafafa",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <Text strong style={{ fontSize: "24px", color: "#1890ff" }}>
                {chineseText}
              </Text>
              {generatedPinyin && (
                <Text
                  style={{
                    fontSize: "16px",
                    color: "#666",
                    marginLeft: "12px",
                  }}
                >
                  ({generatedPinyin})
                </Text>
              )}
            </div>
            <div style={{ marginBottom: "4px" }}>
              <Text strong>Loại Từ: </Text>
              <Text>
                {form.getFieldValue(["data", "speech"]) || "Chưa xác định"}
              </Text>
            </div>
            <div>
              <Text strong>Dịch Nghĩa: </Text>
              <Text>
                {form.getFieldValue(["data", "translation"]) || "Chưa xác định"}
              </Text>
            </div>
          </div>
        </Card>
      )} */}

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={uploadedUrls}
        errorMessage={uploadError}
        fileNames={{
          imageName: selectedImageFile?.name,
          audioName: selectedAudioFile?.name,
        }}
      />
    </div>
  );
});

WordDefinitionForm.displayName = "WordDefinitionForm";

export default WordDefinitionForm;
