"use client";
import React, { useState, useEffect } from "react";
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
import { uploadImageByType, uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;

interface SentencesFormProps {
  form: FormInstance;
  initialValues?: SentencesData;
  contentType?: string;
}

type SegmentationMode = "character" | "word" | "phrase" | "long_phrase" | "manual";

const SentencesForm: React.FC<SentencesFormProps> = ({
  form,
  initialValues,
  contentType = 'content_sentences',
}) => {
  const [chineseText, setChineseText] = useState<string>("");
  const [segmentedChinese, setSegmentedChinese] = useState<string[]>([]);
  const [segmentedPinyin, setSegmentedPinyin] = useState<string[]>([]);
  const [segmentationMode, setSegmentationMode] =
    useState<SegmentationMode>("word");
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState<{ imageUrl?: string; audioUrl?: string }>({});
  const [uploadError, setUploadError] = useState<string>('');

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
              segmentit: 1 // Reverse Maximum Matching for proper word boundaries
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
              segmentit: 2 // Maximum Probability for most accurate phrase segmentation
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
              segmentit: 3 // Minimum Segmentation for longest possible segments
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
              return pinyin(segment, { toneType: "symbol" }).replace(/\s+/g, "");
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

  const handleImageFileChange = (file: File | null) => {
    setSelectedImageFile(file);
    return false; // Prevent automatic upload
  };

  const handleAudioFileChange = (file: File | null) => {
    setSelectedAudioFile(file);
    return false; // Prevent automatic upload
  };

  const handleUploadFiles = async () => {
    if (!selectedImageFile && !selectedAudioFile) {
      message.warning('Please select at least one file to upload');
      return;
    }

    // Validate files
    if (selectedImageFile) {
      const imageValidation = validateFile(selectedImageFile, 'image', 10);
      if (!imageValidation.isValid) {
        message.error(imageValidation.error);
        return;
      }
    }

    if (selectedAudioFile) {
      const audioValidation = validateFile(selectedAudioFile, 'audio', 10);
      if (!audioValidation.isValid) {
        message.error(audioValidation.error);
        return;
      }
    }

    setUploadModalVisible(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

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
            const audioProgress = selectedImageFile ? progress.percentage / 2 : progress.percentage;
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
      const currentData = form.getFieldValue('data') || {};
      form.setFieldsValue({
        data: {
          ...currentData,
          picture_url: imageUrl,
          audio_url: audioUrl,
        }
      });

      setUploadedUrls({ imageUrl, audioUrl });
      setUploadStatus('success');
      setUploadProgress(100);
      setSelectedImageFile(null);
      setSelectedAudioFile(null);

      message.success('Files uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Upload failed. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setUploadedUrls(prev => ({ ...prev, imageUrl: undefined }));
    const currentData = form.getFieldValue('data') || {};
    form.setFieldsValue({
      data: {
        ...currentData,
        picture_url: undefined,
      }
    });
  };

  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedUrls(prev => ({ ...prev, audioUrl: undefined }));
    const currentData = form.getFieldValue('data') || {};
    form.setFieldsValue({
      data: {
        ...currentData,
        audio_url: undefined,
      }
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
        setUploadedUrls(prev => ({ ...prev, imageUrl: initialValues.picture_url }));
      }
      if (initialValues.audio_url) {
        setUploadedUrls(prev => ({ ...prev, audioUrl: initialValues.audio_url }));
      }
    }
  }, [initialValues]);

  return (
    <div>
      {/* Sentence Information */}
      <Card title="Sentence Information" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Chinese Sentence"
          name={["data", "chinese_sentence_input"]}
          rules={[
            { required: true, message: "Please enter the Chinese sentence" },
          ]}
        >
          <TextArea
            rows={2}
            onChange={(e) => handleChineseTextChange(e.target.value)}
            style={{ fontSize: "18px" }}
          />
        </Form.Item>

        {/* Segmentation Mode Controls */}
        <Form.Item label="Segmentation Mode">
          <Space>
            <Select
              value={segmentationMode}
              onChange={handleSegmentationModeChange}
              style={{ width: 150 }}
            >
              <Select.Option value="character">
                Character (这 家 饭 店)
              </Select.Option>
              <Select.Option value="word">Word (这 家 饭 店)</Select.Option>
              <Select.Option value="phrase">Phrase (这家 饭店)</Select.Option>
              <Select.Option value="long_phrase">Long Phrase (这家饭店)</Select.Option>
              <Select.Option value="manual">Manual Override</Select.Option>
            </Select>
            {segmentationMode !== "manual" && chineseText && (
              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  segmentChineseText(chineseText, segmentationMode)
                }
              >
                Re-segment
              </Button>
            )}
          </Space>
        </Form.Item>

        {/* Manual Segmentation Instructions */}
        {manualMode && (
          <Card
            size="small"
            style={{
              marginBottom: "16px",
              backgroundColor: "#e6f7ff",
              borderColor: "#91d5ff",
            }}
          >
            <Space>
              <EditOutlined style={{ color: "#1890ff" }} />
              <div>
                <Text strong style={{ color: "#1890ff" }}>
                  Manual Mode Active
                </Text>
                <Text type="secondary" style={{ display: "block" }}>
                  Use semicolons (;) in your sentence to manually define
                  segments.
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Example: "这家饭店;怎么样;？" → ["这家饭店", "怎么样", "？"]
                </Text>
              </div>
            </Space>
          </Card>
        )}

        {/* Segmentation Preview */}
        {segmentedChinese.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <Text strong>Auto-segmented Chinese:</Text>
            <div
              style={{
                marginTop: "8px",
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "6px",
              }}
            >
              <Space wrap>
                {segmentedChinese.map((segment, index) => (
                  <Tag
                    key={index}
                    color="blue"
                    style={{ fontSize: "16px", padding: "4px 8px" }}
                  >
                    {segment}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        )}

        {segmentedPinyin.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <Text strong>Auto-generated Pinyin:</Text>
            <div
              style={{
                marginTop: "8px",
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "6px",
              }}
            >
              <Space wrap>
                {segmentedPinyin.map((segment, index) => (
                  <Tag
                    key={index}
                    color="green"
                    style={{ fontSize: "14px", padding: "4px 8px" }}
                  >
                    {segment}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        )}

        <Form.Item
          label="Explanation"
          name={["data", "explaination"]}
          rules={[{ required: true, message: "Please enter the explanation" }]}
        >
          <TextArea rows={2} />
        </Form.Item>

        <Form.Item
          label="Additional Information"
          name={["data", "additional_info"]}
        >
          <TextArea rows={3} />
        </Form.Item>

        {/* Hidden form fields to store the segmented arrays */}
        <Form.Item name={["data", "chinese_text"]} style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name={["data", "pinyin"]} style={{ display: "none" }}>
          <Input />
        </Form.Item>
      </Card>

      {/* Media Files */}
      <Card title="Media Files" style={{ marginBottom: "24px" }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Picture File"
              name={["data", "picture_url"]}
              rules={[
                { required: true, message: "Please upload a picture file" },
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
                  disabled={!!uploadedUrls.imageUrl}
                >
                  <Button
                    icon={<UploadOutlined />}
                    disabled={!!uploadedUrls.imageUrl}
                    style={{ marginBottom: 8 }}
                  >
                    {selectedImageFile ? selectedImageFile.name : 'Select Image'}
                  </Button>
                </Upload>
                {uploadedUrls.imageUrl && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PictureOutlined style={{ color: '#52c41a' }} />
                      <span style={{ color: '#52c41a' }}>Image uploaded</span>
                      <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={handleRemoveImage}
                        type="text"
                        danger
                      />
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <img
                        src={uploadedUrls.imageUrl}
                        alt="Preview"
                        style={{ maxWidth: 100, maxHeight: 100, objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Audio File"
              name={["data", "audio_url"]}
              rules={[
                { required: true, message: "Please upload an audio file" },
              ]}
            >
              <div>
                <Upload
                  accept="audio/*"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleAudioFileChange(file);
                    return false;
                  }}
                  disabled={!!uploadedUrls.audioUrl}
                >
                  <Button
                    icon={<UploadOutlined />}
                    disabled={!!uploadedUrls.audioUrl}
                    style={{ marginBottom: 8 }}
                  >
                    {selectedAudioFile ? selectedAudioFile.name : 'Select Audio'}
                  </Button>
                </Upload>
                {uploadedUrls.audioUrl && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SoundOutlined style={{ color: '#52c41a' }} />
                      <span style={{ color: '#52c41a' }}>Audio uploaded</span>
                      <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={handleRemoveAudio}
                        type="text"
                        danger
                      />
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <audio controls style={{ width: '100%' }}>
                        <source src={uploadedUrls.audioUrl} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>
          </Col>
        </Row>

        {(selectedImageFile || selectedAudioFile) && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUploadFiles}
              loading={uploadStatus === 'uploading'}
              size="large"
            >
              Upload to S3
            </Button>
          </div>
        )}
      </Card>

      {/* Preview */}
      {chineseText && (
        <Card title="Preview" style={{ marginBottom: "24px" }}>
          <div
            style={{
              padding: "16px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              backgroundColor: "#fafafa",
            }}
          >
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
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
                <Text strong>Explanation: </Text>
                <Text>
                  {form.getFieldValue(["data", "explaination"]) ||
                    "Not specified"}
                </Text>
              </div>
            </Space>
          </div>
        </Card>
      )}

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
};

export default SentencesForm;
