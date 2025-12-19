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
  Tag,
  Space,
  Select,
  Button,
  Divider,
  Upload,
  message,
} from "antd";
import {
  SoundOutlined,
  PictureOutlined,
  EditOutlined,
  ReloadOutlined,
  UploadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { SentencesData } from "@/types/contentTypes";
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

interface SentencesFormProps {
  form: FormInstance;
  initialValues?: SentencesData;
  contentType?: string;
}

export interface SentencesFormRef {
  uploadFiles: () => Promise<boolean>;
}

type SegmentationMode =
  | "character"
  | "word"
  | "phrase"
  | "long_phrase"
  | "manual";

const SentencesForm = forwardRef<SentencesFormRef, SentencesFormProps>(
  ({ form, initialValues, contentType = "content_sentences" }, ref) => {
    const [chineseText, setChineseText] = useState<string>("");
    const [segmentedChinese, setSegmentedChinese] = useState<string[]>([]);
    const [segmentedPinyin, setSegmentedPinyin] = useState<string[]>([]);
    const [segmentationMode, setSegmentationMode] =
      useState<SegmentationMode>("word");
    const [manualMode, setManualMode] = useState<boolean>(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(
      null
    );
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(
      null
    );
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

    // Auto-segment Chinese text with different modes
    const segmentChineseText = (
      text: string,
      mode: SegmentationMode = segmentationMode
    ) => {
      if (!text.trim()) {
        setSegmentedChinese([]);
        setSegmentedPinyin([]);
        return;
      }

      let chineseSegments: string[] = [];
      let pinyinSegments: string[] = [];

      try {
        switch (mode) {
          case "character":
            // Character by character segmentation
            chineseSegments = Array.from(text);
            pinyinSegments = chineseSegments.map((char) => {
              if (/[\u4e00-\u9fff]/.test(char)) {
                return pinyin(char, { toneType: "symbol" });
              }
              return char;
            });
            break;

          case "word":
            // Word-level segmentation using pinyin-pro segmentit
            try {
              const segmentResult = pinyin(text, {
                toneType: "symbol",
                segmentit: 1, // Reverse Maximum Matching for proper word boundaries
              });

              if (Array.isArray(segmentResult)) {
                // If segmentResult returns array of objects with origin and pinyin
                segmentResult.forEach((item: any) => {
                  if (typeof item === "object" && item.origin && item.pinyin) {
                    chineseSegments.push(item.origin);
                    pinyinSegments.push(item.pinyin);
                  }
                });
              }

              // If segmentit doesn't return proper structure, fallback to character splitting
              if (chineseSegments.length === 0) {
                chineseSegments =
                  text.match(/[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g) || [];
                pinyinSegments = chineseSegments.map((segment) => {
                  if (/[\u4e00-\u9fff]/.test(segment)) {
                    return pinyin(segment, { toneType: "symbol" });
                  }
                  return segment;
                });
              }
            } catch (error) {
              // Fallback to character-by-character if segmentit fails
              chineseSegments =
                text.match(/[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g) || [];
              pinyinSegments = chineseSegments.map((segment) => {
                if (/[\u4e00-\u9fff]/.test(segment)) {
                  return pinyin(segment, { toneType: "symbol" });
                }
                return segment;
              });
            }
            break;

          case "phrase":
            // Phrase-level segmentation using pinyin-pro with segmentit
            try {
              const segmentResult = pinyin(text, {
                toneType: "symbol",
                segmentit: 2, // Maximum Probability for most accurate phrase segmentation
              });

              if (Array.isArray(segmentResult)) {
                segmentResult.forEach((item: any) => {
                  if (typeof item === "object" && item.origin && item.pinyin) {
                    chineseSegments.push(item.origin);
                    pinyinSegments.push(item.pinyin);
                  }
                });
              }

              // Fallback if segmentation didn't work
              if (chineseSegments.length === 0) {
                // Phrase-level: group 2-4 character sequences
                chineseSegments =
                  text.match(
                    /[\u4e00-\u9fff]{2,4}|[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g
                  ) || [];
                pinyinSegments = chineseSegments.map((segment) => {
                  if (/[\u4e00-\u9fff]/.test(segment)) {
                    return pinyin(segment, { toneType: "symbol" });
                  }
                  return segment;
                });
              }
            } catch (error) {
              // Fallback to phrase grouping
              chineseSegments =
                text.match(
                  /[\u4e00-\u9fff]{2,4}|[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g
                ) || [];
              pinyinSegments = chineseSegments.map((segment) => {
                if (/[\u4e00-\u9fff]/.test(segment)) {
                  return pinyin(segment, { toneType: "symbol" });
                }
                return segment;
              });
            }
            break;

          case "long_phrase":
            // Long phrase segmentation using pinyin-pro with segmentit
            try {
              const segmentResult = pinyin(text, {
                toneType: "symbol",
                segmentit: 3, // Minimum Segmentation for longest possible segments
              });

              if (Array.isArray(segmentResult)) {
                segmentResult.forEach((item: any) => {
                  if (typeof item === "object" && item.origin && item.pinyin) {
                    chineseSegments.push(item.origin);
                    pinyinSegments.push(item.pinyin);
                  }
                });
              }

              // Fallback if segmentation didn't work
              if (chineseSegments.length === 0) {
                // Long phrase fallback: try to group larger sequences
                chineseSegments =
                  text.match(
                    /[\u4e00-\u9fff]{3,6}|[\u4e00-\u9fff]{1,2}|[^\u4e00-\u9fff]/g
                  ) || [];
                pinyinSegments = chineseSegments.map((segment) => {
                  if (/[\u4e00-\u9fff]/.test(segment)) {
                    return pinyin(segment, { toneType: "symbol" });
                  }
                  return segment;
                });
              }
            } catch (error) {
              // Fallback to longer grouping
              chineseSegments =
                text.match(
                  /[\u4e00-\u9fff]{3,6}|[\u4e00-\u9fff]{1,2}|[^\u4e00-\u9fff]/g
                ) || [];
              pinyinSegments = chineseSegments.map((segment) => {
                if (/[\u4e00-\u9fff]/.test(segment)) {
                  return pinyin(segment, { toneType: "symbol" });
                }
                return segment;
              });
            }
            break;

          case "manual":
            // Manual mode - split by semicolons
            chineseSegments = text
              .split(";")
              .map((s) => s.trim())
              .filter((s) => s);
            pinyinSegments = chineseSegments.map((segment) => {
              if (/[\u4e00-\u9fff]/.test(segment)) {
                // Remove spaces from pinyin to combine words like "fàn diàn" → "fàndiàn"
                return pinyin(segment, { toneType: "symbol" }).replace(
                  /\s+/g,
                  ""
                );
              }
              return segment;
            });
        }

        setSegmentedChinese(chineseSegments);
        setSegmentedPinyin(pinyinSegments);

        // Update form with the segmented arrays
        form.setFieldsValue({
          data: {
            ...form.getFieldValue("data"),
            chinese_text: chineseSegments,
            pinyin: pinyinSegments,
          },
        });
      } catch (error) {
        console.warn("Failed to segment Chinese text:", error);

        // Final fallback: character by character
        const fallbackSegments = Array.from(text);
        const fallbackPinyin = fallbackSegments.map((char) => {
          if (/[\u4e00-\u9fff]/.test(char)) {
            try {
              return pinyin(char, { toneType: "symbol" });
            } catch {
              return char;
            }
          }
          return char;
        });

        setSegmentedChinese(fallbackSegments);
        setSegmentedPinyin(fallbackPinyin);

        form.setFieldsValue({
          data: {
            ...form.getFieldValue("data"),
            chinese_text: fallbackSegments,
            pinyin: fallbackPinyin,
          },
        });
      }
    };

    const handleChineseTextChange = (value: string) => {
      setChineseText(value);
      segmentChineseText(value);
    };

    const handleSegmentationModeChange = (mode: SegmentationMode) => {
      setSegmentationMode(mode);
      setManualMode(mode === "manual");
      if (mode !== "manual" && chineseText) {
        segmentChineseText(chineseText, mode);
      }
    };

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
          message.success(
            "T\u1ea3i h\u00ecnh \u1ea3nh l\u00ean th\u00e0nh c\u00f4ng!"
          );
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(
          error instanceof Error ? error.message : "Upload failed"
        );
        message.error(
          "T\u1ea3i l\u00ean th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i."
        );
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
          message.success(
            "T\u1ea3i \u00e2m thanh l\u00ean th\u00e0nh c\u00f4ng!"
          );
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(
          error instanceof Error ? error.message : "Upload failed"
        );
        message.error(
          "T\u1ea3i l\u00ean th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i."
        );
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
        setUploadError(
          error instanceof Error ? error.message : "Upload failed"
        );
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

    // Initialize values if provided
    useEffect(() => {
      if (initialValues) {
        setChineseText(initialValues.chinese_text?.join("") || "");
        setSegmentedChinese(initialValues.chinese_text || []);
        setSegmentedPinyin(initialValues.pinyin || []);
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

    return (
      <div>
        {/* Sentence Information */}
        <Card title="Thông Tin Câu" className="mb-6">
          <Form.Item
            label="Câu Tiếng Trung"
            name={["data", "chinese_sentence_input"]}
            rules={[
              { required: true, message: "Vui lòng nhập câu tiếng Trung" },
            ]}
          >
            <TextArea
              rows={2}
              onChange={(e) => handleChineseTextChange(e.target.value)}
              className="text-lg"
            />
          </Form.Item>

          {/* Segmentation Mode Controls */}
          <Form.Item label="Chế Độ Phân Đoạn">
            <Space>
              <Select
                value={segmentationMode}
                onChange={handleSegmentationModeChange}
                className="w-[150px]"
              >
                <Select.Option value="character">
                  Ký Tự (这 家 饭 店)
                </Select.Option>
                <Select.Option value="word">Từ (这 家 饭 店)</Select.Option>
                <Select.Option value="phrase">Cụm Từ (这家 饭店)</Select.Option>
                <Select.Option value="long_phrase">
                  Cụm Từ Dài (这家饭店)
                </Select.Option>
                <Select.Option value="manual">Thủ Công</Select.Option>
              </Select>
              {segmentationMode !== "manual" && chineseText && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    segmentChineseText(chineseText, segmentationMode)
                  }
                >
                  Phân Đoạn Lại
                </Button>
              )}
            </Space>
          </Form.Item>

          {/* Manual Segmentation Instructions */}
          {manualMode && (
            <Card
              size="small"
              className="mb-4 bg-blue-50 border-blue-300"
            >
              <Space>
                <EditOutlined className="text-blue-500" />
                <div>
                  <Text strong className="text-blue-500">
                    Chế Độ Thủ Công Đã Kích Hoạt
                  </Text>
                  <Text type="secondary" className="block">
                    Sử dụng dấu chấm phẩy (;) trong câu của bạn để xác định thủ
                    công các đoạn.
                  </Text>
                  <Text type="secondary" className="text-xs">
                    Ví dụ: "这家饭店;怎么样;？" → ["这家饭店", "怎么样", "？"]
                  </Text>
                </div>
              </Space>
            </Card>
          )}

          {/* Segmentation Preview */}
          {segmentedChinese.length > 0 && (
            <div className="mb-4">
              <Text strong>Tiếng Trung Tự Động Phân Đoạn:</Text>
              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                <Space wrap>
                  {segmentedChinese.map((segment, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      className="text-base py-1 px-2"
                    >
                      {segment}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}

          {segmentedPinyin.length > 0 && (
            <div className="mb-4">
              <Text strong>Pinyin Tự Động Tạo:</Text>
              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                <Space wrap>
                  {segmentedPinyin.map((segment, index) => (
                    <Tag
                      key={index}
                      color="green"
                      className="text-sm py-1 px-2"
                    >
                      {segment}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}

          <Form.Item
            label="Giải Thích"
            name={["data", "explaination"]}
            rules={[{ required: true, message: "Vui lòng nhập giải thích" }]}
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            label="Thông Tin Bổ Sung"
            name={["data", "additional_info"]}
          >
            <TextArea rows={3} />
          </Form.Item>

          {/* Hidden form fields to store the segmented arrays */}
          <Form.Item
            name={["data", "chinese_text"]}
            className="hidden"
          >
            <Input />
          </Form.Item>
          <Form.Item name={["data", "pinyin"]} className="hidden">
            <Input />
          </Form.Item>
        </Card>

        {/* Media Files */}
        <Card title="File Đa Phương Tiện" className="mb-6">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="File Hình Ảnh"
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
                    <Button
                      icon={<UploadOutlined />}
                      className="mb-2"
                    >
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
                label="File Âm Thanh"
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
                      onAudioGenerated={(audioUrl) => {
                        setUploadedUrls((prev) => ({ ...prev, audioUrl }));
                        const currentData = form.getFieldValue("data") || {};
                        form.setFieldsValue({
                          data: {
                            ...currentData,
                            audio_url: audioUrl,
                          },
                        });
                        message.success("Âm thanh đã được tạo thành công!");
                      }}
                      buttonText="Tạo Giọng Nói"
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

        {/* Preview
        {chineseText && (
          <Card title="Xem Trước" style={{ marginBottom: "24px" }}>
            <div
              style={{
                padding: "16px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                backgroundColor: "#fafafa",
              }}
            >
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div>
                  <Text strong style={{ fontSize: "20px", color: "#1890ff" }}>
                    {segmentedChinese.join(" ")}
                  </Text>
                </div>
                <div>
                  <Text style={{ fontSize: "14px", color: "#666" }}>
                    [{segmentedPinyin.join(" ")}]
                  </Text>
                </div>
                <div>
                  <Text strong>Giải Thích: </Text>
                  <Text>
                    {form.getFieldValue(["data", "explaination"]) ||
                      "Chưa xác định"}
                  </Text>
                </div>
              </Space>
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
  }
);

SentencesForm.displayName = "SentencesForm";

export default SentencesForm;
