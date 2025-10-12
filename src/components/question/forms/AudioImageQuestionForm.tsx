"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
  Space,
  Tag,
  Select,
} from "antd";
import {
  SoundOutlined,
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  EditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { uploadImageByType, uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

interface AudioImageQuestionData {
  audio_url: string;
  transcript_zh: string[];
  transcript_pinyin: string[];
  translation_vi: string;
  answers: {
    image_url: string;
    label_zh: string[];
    label_pinyin: string[];
    label_vi: string;
    correct: boolean;
  }[];
}

interface AudioImageQuestionFormProps {
  form: FormInstance;
  initialValues?: AudioImageQuestionData;
  questionType?: string;
}

export interface AudioImageQuestionFormRef {
  uploadFiles: () => Promise<boolean>;
}

type SegmentationMode = "character" | "word" | "phrase" | "long_phrase" | "manual";

const AudioImageQuestionForm = forwardRef<AudioImageQuestionFormRef, AudioImageQuestionFormProps>(({
  form,
  initialValues,
  questionType = 'question_audio_image',
}, ref) => {
  // Transcript state
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [segmentedTranscript, setSegmentedTranscript] = useState<string[]>([]);
  const [segmentedPinyin, setSegmentedPinyin] = useState<string[]>([]);
  const [segmentationMode, setSegmentationMode] = useState<SegmentationMode>("word");
  const [manualMode, setManualMode] = useState<boolean>(false);

  // Audio upload state
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string>('');

  // Answer image uploads state (tracking which answer is being uploaded)
  const [answerImageUploads, setAnswerImageUploads] = useState<{
    [key: number]: {
      file: File | null;
      uploadedUrl?: string;
    }
  }>({});

  // Segment Chinese transcript
  const segmentTranscript = (
    text: string,
    mode: SegmentationMode = segmentationMode
  ) => {
    if (!text.trim()) {
      setSegmentedTranscript([]);
      setSegmentedPinyin([]);
      return;
    }

    let zhSegments: string[] = [];
    let pinyinSegments: string[] = [];

    try {
      if (mode === "manual") {
        // Manual mode - split by semicolons
        zhSegments = text
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s);
        pinyinSegments = zhSegments.map((segment) => {
          if (/[\u4e00-\u9fff]/.test(segment)) {
            return pinyin(segment, { toneType: "symbol" }).replace(/\s+/g, "");
          }
          return segment;
        });
      } else if (mode === "character") {
        // Character by character
        zhSegments = Array.from(text);
        pinyinSegments = zhSegments.map((char) => {
          if (/[\u4e00-\u9fff]/.test(char)) {
            return pinyin(char, { toneType: "symbol" });
          }
          return char;
        });
      } else {
        // Word/phrase segmentation
        const segmentitLevel = mode === "word" ? 1 : mode === "phrase" ? 2 : 3;
        try {
          const segmentResult = pinyin(text, {
            toneType: "symbol",
            type: "array",
            segmentit: segmentitLevel,
          });

          console.log('Segmentation result:', segmentResult, 'for mode:', mode);

          if (Array.isArray(segmentResult)) {
            segmentResult.forEach((item: any) => {
              if (typeof item === "object" && item.origin && item.pinyin) {
                zhSegments.push(item.origin);
                pinyinSegments.push(item.pinyin);
              }
            });
          }

          // If segmentit doesn't return proper structure, fallback to character splitting
          if (zhSegments.length === 0) {
            console.log('Fallback: segmentit did not return proper structure');
            const fallbackPattern = mode === "phrase"
              ? /[\u4e00-\u9fff]{2,4}|[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g
              : mode === "long_phrase"
              ? /[\u4e00-\u9fff]{3,6}|[\u4e00-\u9fff]{1,2}|[^\u4e00-\u9fff]/g
              : /[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g;

            zhSegments = text.match(fallbackPattern) || [];
            pinyinSegments = zhSegments.map((segment) => {
              if (/[\u4e00-\u9fff]/.test(segment)) {
                return pinyin(segment, { toneType: "symbol" });
              }
              return segment;
            });
          }
        } catch (error) {
          console.error('Segmentation error:', error);
          zhSegments = Array.from(text);
          pinyinSegments = zhSegments.map((char) => {
            if (/[\u4e00-\u9fff]/.test(char)) {
              return pinyin(char, { toneType: "symbol" });
            }
            return char;
          });
        }
      }

      setSegmentedTranscript(zhSegments);
      setSegmentedPinyin(pinyinSegments);

      // Update form
      form.setFieldsValue({
        data: {
          ...form.getFieldValue("data"),
          transcript_zh: zhSegments,
          transcript_pinyin: pinyinSegments,
        },
      });
    } catch (error) {
      console.warn("Failed to segment transcript:", error);
    }
  };

  const handleTranscriptChange = (value: string) => {
    setTranscriptText(value);
    segmentTranscript(value);
  };

  const handleSegmentationModeChange = (mode: SegmentationMode) => {
    setSegmentationMode(mode);
    setManualMode(mode === "manual");
    if (mode !== "manual" && transcriptText) {
      segmentTranscript(transcriptText, mode);
    }
  };

  // Audio upload handlers
  const handleAudioFileChange = (file: File | null) => {
    setSelectedAudioFile(file);
    return false;
  };

  const handleUploadAudio = async () => {
    if (!selectedAudioFile) {
      message.warning('Please select an audio file to upload');
      return;
    }

    const audioValidation = validateFile(selectedAudioFile, 'audio', 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return;
    }

    setUploadModalVisible(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadAudioByType(
        selectedAudioFile,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            audio_url: result.url,
          }
        });
        setUploadStatus('success');
        setUploadProgress(100);
        setSelectedAudioFile(null);
        message.success('Audio uploaded successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Upload failed. Please try again.');
    }
  };

  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedAudioUrl(undefined);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        audio_url: undefined,
      }
    });
  };

  // Answer image upload handlers
  const handleAnswerImageChange = (answerIndex: number, file: File | null) => {
    setAnswerImageUploads(prev => ({
      ...prev,
      [answerIndex]: { file, uploadedUrl: prev[answerIndex]?.uploadedUrl }
    }));
    return false;
  };

  const handleUploadAnswerImage = async (answerIndex: number) => {
    const answerUpload = answerImageUploads[answerIndex];
    if (!answerUpload?.file) {
      message.warning('Please select an image file to upload');
      return;
    }

    const imageValidation = validateFile(answerUpload.file, 'image', 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return;
    }

    setUploadModalVisible(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadImageByType(
        answerUpload.file,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        // Update state
        setAnswerImageUploads(prev => ({
          ...prev,
          [answerIndex]: { file: null, uploadedUrl: result.url }
        }));

        // Update form
        const answers = form.getFieldValue(['data', 'answers']) || [];
        answers[answerIndex] = {
          ...answers[answerIndex],
          image_url: result.url,
        };
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            answers,
          }
        });

        setUploadStatus('success');
        setUploadProgress(100);
        message.success('Image uploaded successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Upload failed. Please try again.');
    }
  };

  const handleRemoveAnswerImage = (answerIndex: number) => {
    setAnswerImageUploads(prev => ({
      ...prev,
      [answerIndex]: { file: null, uploadedUrl: undefined }
    }));

    const answers = form.getFieldValue(['data', 'answers']) || [];
    if (answers[answerIndex]) {
      answers[answerIndex].image_url = undefined;
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          answers,
        }
      });
    }
  };

  // Unified upload method for all files
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have files to upload
    const hasAudioToUpload = selectedAudioFile && !uploadedAudioUrl;
    const answerImagesToUpload = Object.entries(answerImageUploads)
      .filter(([_, upload]) => upload.file && !upload.uploadedUrl);

    if (!hasAudioToUpload && answerImagesToUpload.length === 0) {
      // Check if everything is already uploaded
      const answers = form.getFieldValue(['data', 'answers']) || [];
      const allAnswersHaveImages = answers.length > 0 && answers.every((answer: any) =>
        answer && (answer.image_url || answerImageUploads[answers.indexOf(answer)]?.uploadedUrl)
      );

      if (uploadedAudioUrl && allAnswersHaveImages) {
        console.log('All files already uploaded');
        return true;
      }

      console.log('Missing files:', {
        hasAudio: !!uploadedAudioUrl,
        answerImagesUploaded: Object.values(answerImageUploads).filter(u => u.uploadedUrl).length,
        totalAnswers: answers.length
      });
      message.warning('Please select and upload all required files (audio + all answer images)');
      return false;
    }

    // Validate all files
    if (selectedAudioFile) {
      const audioValidation = validateFile(selectedAudioFile, 'audio', 10);
      if (!audioValidation.isValid) {
        message.error(audioValidation.error);
        return false;
      }
    }

    for (const [index, upload] of answerImagesToUpload) {
      if (upload.file) {
        const imageValidation = validateFile(upload.file, 'image', 10);
        if (!imageValidation.isValid) {
          message.error(`Answer ${parseInt(index) + 1} image: ${imageValidation.error}`);
          return false;
        }
      }
    }

    if (showModal) {
      setUploadModalVisible(true);
    }
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const uploadPromises: Promise<any>[] = [];
      const totalFiles = (hasAudioToUpload ? 1 : 0) + answerImagesToUpload.length;
      let completedFiles = 0;

      // Upload audio if needed
      if (hasAudioToUpload && selectedAudioFile) {
        const audioPromise = uploadAudioByType(
          selectedAudioFile,
          questionType,
          (progress: UploadProgress) => {
            const fileProgress = progress.percentage / totalFiles;
            setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress));
          }
        ).then(result => ({ type: 'audio', result }));
        uploadPromises.push(audioPromise);
      }

      // Upload answer images if needed
      for (const [index, upload] of answerImagesToUpload) {
        if (upload.file) {
          const imagePromise = uploadImageByType(
            upload.file,
            questionType,
            (progress: UploadProgress) => {
              const fileProgress = progress.percentage / totalFiles;
              setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress));
            }
          ).then(result => ({ type: 'answer_image', index: parseInt(index), result }));
          uploadPromises.push(imagePromise);
        }
      }

      const results = await Promise.all(uploadPromises);

      // Process results
      let audioUrl = uploadedAudioUrl;
      const newAnswerUploads = { ...answerImageUploads };
      const answers = form.getFieldValue(['data', 'answers']) || [];

      for (const item of results) {
        if (item.type === 'audio') {
          if (item.result.success) {
            audioUrl = item.result.url;
          } else {
            throw new Error(`Audio upload failed: ${item.result.error}`);
          }
        } else if (item.type === 'answer_image') {
          if (item.result.success) {
            newAnswerUploads[item.index] = { file: null, uploadedUrl: item.result.url };
            answers[item.index] = {
              ...answers[item.index],
              image_url: item.result.url,
            };
          } else {
            throw new Error(`Answer ${item.index + 1} image upload failed: ${item.result.error}`);
          }
        }
        completedFiles++;
      }

      // Update form and state
      setUploadedAudioUrl(audioUrl);
      setAnswerImageUploads(newAnswerUploads);
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          audio_url: audioUrl,
          answers,
        }
      });

      setUploadStatus('success');
      setUploadProgress(100);
      setSelectedAudioFile(null);

      if (showModal) {
        message.success('All files uploaded successfully!');
      }
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Upload failed. Please try again.');
      return false;
    }
  };

  // Expose upload method to parent
  useImperativeHandle(ref, () => ({
    uploadFiles: () => handleUploadAllFiles(false),
  }));

  // Segment answer label
  const segmentAnswerLabel = (answerIndex: number, text: string) => {
    if (!text.trim()) return;

    let zhSegments: string[] = [];
    let pinyinSegments: string[] = [];

    try {
      // Use word-level segmentation for answer labels
      const segmentResult = pinyin(text, {
        toneType: "symbol",
        segmentit: 1,
      });

      if (Array.isArray(segmentResult)) {
        segmentResult.forEach((item: any) => {
          if (typeof item === "object" && item.origin && item.pinyin) {
            zhSegments.push(item.origin);
            pinyinSegments.push(item.pinyin);
          }
        });
      }

      if (zhSegments.length === 0) {
        zhSegments = Array.from(text);
        pinyinSegments = zhSegments.map((char) => {
          if (/[\u4e00-\u9fff]/.test(char)) {
            return pinyin(char, { toneType: "symbol" });
          }
          return char;
        });
      }

      const answers = form.getFieldValue(['data', 'answers']) || [];
      answers[answerIndex] = {
        ...answers[answerIndex],
        label_zh: zhSegments,
        label_pinyin: pinyinSegments,
      };
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          answers,
        }
      });
    } catch (error) {
      console.warn("Failed to segment answer label:", error);
    }
  };

  // Initialize values
  useEffect(() => {
    if (initialValues) {
      setTranscriptText(initialValues.transcript_zh?.join("") || "");
      setSegmentedTranscript(initialValues.transcript_zh || []);
      setSegmentedPinyin(initialValues.transcript_pinyin || []);
      if (initialValues.audio_url) {
        setUploadedAudioUrl(initialValues.audio_url);
      }
      if (initialValues.answers) {
        const imageUploads: typeof answerImageUploads = {};
        initialValues.answers.forEach((answer, index) => {
          if (answer.image_url) {
            imageUploads[index] = { file: null, uploadedUrl: answer.image_url };
          }
        });
        setAnswerImageUploads(imageUploads);
      }
    }
  }, [initialValues]);

  return (
    <div>
      {/* Audio Section */}
      <Card title="Audio File" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Audio File"
          name={["data", "audio_url"]}
          rules={[{ required: true, message: "Please upload an audio file" }]}
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
              disabled={!!uploadedAudioUrl}
            >
              <Button
                icon={<UploadOutlined />}
                disabled={!!uploadedAudioUrl}
                style={{ marginBottom: 8 }}
              >
                {selectedAudioFile ? selectedAudioFile.name : 'Select Audio'}
              </Button>
            </Upload>
            {uploadedAudioUrl && (
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
                    <source src={uploadedAudioUrl} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            )}
            {DEV_MODE && selectedAudioFile && !uploadedAudioUrl && (
              <div style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleUploadAudio}
                  loading={uploadStatus === 'uploading'}
                >
                  Upload Audio to S3 (Dev Mode)
                </Button>
              </div>
            )}
          </div>
        </Form.Item>
      </Card>

      {/* Transcript Section */}
      <Card title="Transcript" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Chinese Transcript"
          name={["data", "transcript_input"]}
          rules={[{ required: true, message: "Please enter the transcript" }]}
        >
          <TextArea
            rows={2}
            onChange={(e) => handleTranscriptChange(e.target.value)}
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
              <Select.Option value="character">Character (这 家 饭 店)</Select.Option>
              <Select.Option value="word">Word (这 家 饭 店)</Select.Option>
              <Select.Option value="phrase">Phrase (这家 饭店)</Select.Option>
              <Select.Option value="long_phrase">Long Phrase (这家饭店)</Select.Option>
              <Select.Option value="manual">Manual Override</Select.Option>
            </Select>
            {segmentationMode !== "manual" && transcriptText && (
              <Button
                icon={<ReloadOutlined />}
                onClick={() => segmentTranscript(transcriptText, segmentationMode)}
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
                  Use semicolons (;) in your transcript to manually define segments.
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Example: "这家饭店;怎么样;？" → ["这家饭店", "怎么样", "？"]
                </Text>
              </div>
            </Space>
          </Card>
        )}

        {/* Segmentation Preview */}
        {segmentedTranscript.length > 0 && (
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
                {segmentedTranscript.map((segment, index) => (
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
          label="Vietnamese Translation"
          name={["data", "translation_vi"]}
          rules={[{ required: true, message: "Please enter the Vietnamese translation" }]}
        >
          <TextArea rows={2} />
        </Form.Item>

        {/* Hidden form fields */}
        <Form.Item name={["data", "transcript_zh"]} style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name={["data", "transcript_pinyin"]} style={{ display: "none" }}>
          <Input />
        </Form.Item>
      </Card>

      {/* Answers Section */}
      <Card title="Answer Options" style={{ marginBottom: "24px" }}>
        <Form.List name={["data", "answers"]} initialValue={[{}, {}, {}, {}]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => {
                const answerUpload = answerImageUploads[index];
                return (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: "16px" }}
                    title={`Answer ${index + 1}`}
                    extra={
                      fields.length > 2 && (
                        <Button
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      )
                    }
                  >
                    {/* Image Upload */}
                    <Form.Item
                      {...restField}
                      label="Answer Image"
                      name={[name, "image_url"]}
                      rules={[{ required: true, message: "Please upload an image" }]}
                    >
                      <div>
                        <Upload
                          accept="image/*"
                          maxCount={1}
                          showUploadList={false}
                          beforeUpload={(file) => {
                            handleAnswerImageChange(index, file);
                            return false;
                          }}
                          disabled={!!answerUpload?.uploadedUrl}
                        >
                          <Button
                            icon={<UploadOutlined />}
                            disabled={!!answerUpload?.uploadedUrl}
                            style={{ marginBottom: 8 }}
                          >
                            {answerUpload?.file ? answerUpload.file.name : 'Select Image'}
                          </Button>
                        </Upload>
                        {answerUpload?.uploadedUrl && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <PictureOutlined style={{ color: '#52c41a' }} />
                              <span style={{ color: '#52c41a' }}>Image uploaded</span>
                              <Button
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveAnswerImage(index)}
                                type="text"
                                danger
                              />
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <img
                                src={answerUpload.uploadedUrl}
                                alt={`Answer ${index + 1}`}
                                style={{ maxWidth: 100, maxHeight: 100, objectFit: 'cover' }}
                              />
                            </div>
                          </div>
                        )}
                        {DEV_MODE && answerUpload?.file && !answerUpload?.uploadedUrl && (
                          <div style={{ marginTop: 8 }}>
                            <Button
                              type="primary"
                              icon={<UploadOutlined />}
                              onClick={() => handleUploadAnswerImage(index)}
                              loading={uploadStatus === 'uploading'}
                              size="small"
                            >
                              Upload Image to S3 (Dev Mode)
                            </Button>
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    {/* Label Chinese */}
                    <Form.Item
                      {...restField}
                      label="Label (Chinese)"
                      name={[name, "label_zh_input"]}
                      rules={[{ required: true, message: "Please enter Chinese label" }]}
                    >
                      <Input
                        placeholder="Enter Chinese label"
                        onChange={(e) => segmentAnswerLabel(index, e.target.value)}
                      />
                    </Form.Item>

                    {/* Label Vietnamese */}
                    <Form.Item
                      {...restField}
                      label="Label (Vietnamese)"
                      name={[name, "label_vi"]}
                      rules={[{ required: true, message: "Please enter Vietnamese label" }]}
                    >
                      <Input placeholder="Enter Vietnamese label" />
                    </Form.Item>

                    {/* Correct Answer */}
                    <Form.Item
                      {...restField}
                      label="Correct Answer"
                      name={[name, "correct"]}
                      valuePropName="checked"
                    >
                      <Button
                        type={form.getFieldValue(['data', 'answers', index, 'correct']) ? 'primary' : 'default'}
                        onClick={() => {
                          const answers = form.getFieldValue(['data', 'answers']) || [];
                          // Set all to false first
                          answers.forEach((_: any, i: number) => {
                            answers[i] = { ...answers[i], correct: false };
                          });
                          // Set current to true
                          answers[index] = { ...answers[index], correct: true };
                          form.setFieldsValue({ data: { ...form.getFieldValue('data'), answers } });
                        }}
                      >
                        {form.getFieldValue(['data', 'answers', index, 'correct']) ? 'Correct Answer ✓' : 'Mark as Correct'}
                      </Button>
                    </Form.Item>

                    {/* Hidden fields for segmented data */}
                    <Form.Item {...restField} name={[name, "label_zh"]} style={{ display: "none" }}>
                      <Input />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "label_pinyin"]} style={{ display: "none" }}>
                      <Input />
                    </Form.Item>
                  </Card>
                );
              })}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Add Answer Option
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Preview */}
      {transcriptText && (
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
                  {segmentedTranscript.join(" ")}
                </Text>
              </div>
              <div>
                <Text style={{ fontSize: "14px", color: "#666" }}>
                  [{segmentedPinyin.join(" ")}]
                </Text>
              </div>
              <div>
                <Text strong>Translation (VI): </Text>
                <Text>
                  {form.getFieldValue(["data", "translation_vi"]) || "Not specified"}
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
        uploadedUrls={{ audioUrl: uploadedAudioUrl }}
        errorMessage={uploadError}
        fileNames={{
          audioName: selectedAudioFile?.name,
        }}
      />
    </div>
  );
});

AudioImageQuestionForm.displayName = 'AudioImageQuestionForm';

export default AudioImageQuestionForm;
