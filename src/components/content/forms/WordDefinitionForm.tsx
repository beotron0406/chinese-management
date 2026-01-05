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
  Upload,
  Button,
  message,
  Space,
} from "antd";
import {
  SoundOutlined,
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  BookOutlined,
  FileImageOutlined,
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
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { TextArea } = Input;

// Dev mode flag
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

    return false;
  };

  const handleAudioFileChange = async (file: File) => {
    setSelectedAudioFile(file);

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

    return false;
  };

  const handleUploadFiles = async (
    showModal: boolean = true
  ): Promise<boolean> => {
    if (!selectedImageFile && !selectedAudioFile) {
      if (uploadedUrls.imageUrl && uploadedUrls.audioUrl) {
        return true;
      }
      message.warning("Vui lòng chọn ít nhất một file để tải lên");
      return false;
    }

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

      if (selectedImageFile) {
        const imageUploadPromise = uploadImageByType(
          selectedImageFile,
          contentType,
          (progress: UploadProgress) => {
            setUploadProgress(Math.round(progress.percentage / 2));
          }
        );
        uploadPromises.push(imageUploadPromise);
      }

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
    <div className="max-w-2xl mx-auto">
      {/* Section 1: Word Info */}
      <SectionContainer>
        <SectionHeader
          step={1}
          title="Thông Tin Từ Vựng"
          description="Nhập chữ Hán, pinyin và nghĩa"
          icon={<BookOutlined />}
        />

        <FormField label="Văn bản tiếng Trung" required>
          <Form.Item
            name={["data", "chinese_text"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            className="mb-0"
          >
            <Input
              onChange={(e) => handleChineseTextChange(e.target.value)}
              size="large"
              className="rounded-lg text-xl"
              placeholder="Ví dụ: 你好"
            />
          </Form.Item>
        </FormField>

        <FormField label="Pinyin" required hint="Tự động tạo từ văn bản tiếng Trung">
          <Form.Item
            name={["data", "pinyin"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            className="mb-0"
          >
            <Input
              size="large"
              className="rounded-lg"
              placeholder="nǐ hǎo"
              suffix={<SoundOutlined className="text-gray-400" />}
            />
          </Form.Item>
        </FormField>

        <FormField label="Loại từ" required>
          <Form.Item
            name={["data", "speech"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            className="mb-0"
          >
            <Input size="large" className="rounded-lg" placeholder="Danh từ, Động từ, ..." />
          </Form.Item>
        </FormField>

        <FormField label="Dịch nghĩa" required>
          <Form.Item
            name={["data", "translation"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            className="mb-0"
          >
            <TextArea rows={2} className="rounded-lg" placeholder="Nghĩa tiếng Việt" />
          </Form.Item>
        </FormField>

        <FormField label="Thông tin bổ sung" hint="Ghi chú, ngữ cảnh sử dụng">
          <Form.Item name={["data", "additional_info"]} className="mb-0">
            <TextArea rows={3} className="rounded-lg" placeholder="Thông tin thêm..." />
          </Form.Item>
        </FormField>
      </SectionContainer>

      {/* Section 2: Media */}
      <SectionContainer>
        <SectionHeader
          step={2}
          title="File Đa Phương Tiện"
          description="Hình ảnh minh họa và âm thanh phát âm"
          icon={<FileImageOutlined />}
        />

        <FormField label="Hình ảnh" required>
          <Form.Item
            name={["data", "picture_url"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            className="mb-0"
          >
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageFileChange(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} size="large" className="rounded-lg">
                  {selectedImageFile ? selectedImageFile.name : "Chọn Hình Ảnh"}
                </Button>
              </Upload>
              {uploadedUrls.imageUrl && (
                <div className="mt-4 flex items-start gap-4">
                  <img
                    src={uploadedUrls.imageUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-green-600">
                      <PictureOutlined />
                      <span className="text-sm font-medium">Đã tải lên</span>
                    </div>
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                      type="text"
                      danger
                      className="mt-1"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Form.Item>
        </FormField>

        <FormField label="Âm thanh" required>
          <Form.Item
            name={["data", "audio_url"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            className="mb-0"
          >
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
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
                  <Button icon={<UploadOutlined />} size="large" className="rounded-lg">
                    {selectedAudioFile ? selectedAudioFile.name : "Chọn Âm Thanh"}
                  </Button>
                </Upload>
                <TTSButton
                  text={chineseText}
                  buttonText="Tạo TTS"
                  onAudioGenerated={async (audioUrl, audioBlob) => {
                    try {
                      setUploadModalVisible(true);
                      setUploadStatus("uploading");
                      setUploadProgress(0);
                      setUploadError("");

                      const filename = `tts_generated_${Date.now()}.wav`;
                      const file = new File([audioBlob], filename, { type: "audio/wav" });

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

                        setUploadStatus("success");
                        setUploadProgress(100);
                        message.success("Tạo và tải lên giọng nói thành công!");
                      } else {
                        throw new Error(result.error || "Upload failed");
                      }
                    } catch (error) {
                      console.error("TTS Upload error:", error);
                      setUploadStatus("error");
                      setUploadError(error instanceof Error ? error.message : "Upload failed");
                      message.error("Lỗi khi tải lên giọng nói");
                    }
                  }}
                />
              </Space>
              {uploadedUrls.audioUrl && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <SoundOutlined />
                    <span className="text-sm font-medium">Đã tải lên</span>
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveAudio}
                      type="text"
                      danger
                    >
                      Xóa
                    </Button>
                  </div>
                  <audio controls className="w-full">
                    <source src={uploadedUrls.audioUrl} />
                  </audio>
                </div>
              )}
            </div>
          </Form.Item>
        </FormField>

        {DEV_MODE && (selectedImageFile || selectedAudioFile) && (
          <div className="text-center mt-4">
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => handleUploadFiles(true)}
              loading={uploadStatus === "uploading"}
              size="large"
              className="rounded-lg"
            >
              Tải Lên S3 (Dev)
            </Button>
          </div>
        )}
      </SectionContainer>

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
