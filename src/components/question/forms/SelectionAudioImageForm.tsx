"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Card,
  Typography,
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
  PlusOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { SelectionAudioImageQuestionData } from '@/types/questionType';
import { uploadImageByType, uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

interface SelectionAudioImageFormProps {
  form: FormInstance;
  initialValues?: {
    data?: SelectionAudioImageQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface SelectionAudioImageFormRef {
  uploadFiles: () => Promise<boolean>;
}


const SelectionAudioImageForm = forwardRef<SelectionAudioImageFormRef, SelectionAudioImageFormProps>(({
  form,
  initialValues,
  questionType = 'question_selection_audio_image',
}, ref) => {
  // Audio transcript state
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [audioTranscriptChinese, setAudioTranscriptChinese] = useState<string>("");
  const [audioTranscriptPinyin, setAudioTranscriptPinyin] = useState<string>("");

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

  // Options state
  const [options, setOptions] = useState<SelectionAudioImageQuestionData['options']>([
    { id: '1', image: '', alt: '' },
    { id: '2', image: '', alt: '' },
    { id: '3', image: '', alt: '' },
    { id: '4', image: '', alt: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('1');

  const generatePinyin = (chinese: string): string => {
    try {
      return pinyin(chinese, {
        toneType: 'symbol',
        type: 'array'
      }).join(' ');
    } catch (error) {
      console.warn('Failed to generate pinyin:', error);
      return '';
    }
  };

  const updateFormData = (newOptions: SelectionAudioImageQuestionData['options'], newCorrectAnswer: string) => {
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        options: newOptions,
        correctAnswer: newCorrectAnswer
      }
    });
  };

  // Handle transcript changes
  const handleTranscriptChange = (value: string) => {
    setTranscriptText(value);
    setAudioTranscriptChinese(value);
    const pinyinResult = generatePinyin(value);
    setAudioTranscriptPinyin(pinyinResult);
    
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        audio_transcript_chinese: value,
        audio_transcript_pinyin: pinyinResult
      }
    });
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
            audio: result.url,
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
        audio: undefined,
        audio_url: undefined,
      }
    });
  };

  // Answer image upload handlers
  const handleAnswerImageChange = (optionId: string, file: File | null) => {
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    if (optionIndex >= 0) {
      setAnswerImageUploads(prev => ({
        ...prev,
        [optionIndex]: { file, uploadedUrl: prev[optionIndex]?.uploadedUrl }
      }));
    }
    return false;
  };

  const handleUploadAnswerImage = async (optionId: string) => {
  const optionIndex = options.findIndex(opt => opt.id === optionId);
  const answerUpload = answerImageUploads[optionIndex];
  
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

    if (result.success && result.url) {
      // Update state
      setAnswerImageUploads(prev => ({
        ...prev,
        [optionIndex]: { file: null, uploadedUrl: result.url }
      }));

      // Update options - ensure image is always a string
      const updatedOptions = options.map(option => {
        if (option.id === optionId) {
          return {
            ...option,
            image: result.url || '', // Provide fallback empty string
          };
        }
        return option;
      });

      setOptions(updatedOptions);
      updateFormData(updatedOptions, correctAnswer);

      setUploadStatus('success');
      setUploadProgress(100);
      message.success('Image uploaded successfully!');
    } else {
      throw new Error(result.error || 'Upload failed - no URL returned');
    }
  } catch (error) {
    console.error('Upload error:', error);
    setUploadStatus('error');
    setUploadError(error instanceof Error ? error.message : 'Upload failed');
    message.error('Upload failed. Please try again.');
  }
};

  const handleRemoveAnswerImage = (optionId: string) => {
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    
    setAnswerImageUploads(prev => ({
      ...prev,
      [optionIndex]: { file: null, uploadedUrl: undefined }
    }));

    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          image: '',
        };
      }
      return option;
    });

    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  // Option management
  const handleAltTextChange = (optionId: string, value: string) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          alt: value
        };
      }
      return option;
    });

    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    const newOptions = [...options, { id: newId, image: '', alt: '' }];
    setOptions(newOptions);
    updateFormData(newOptions, correctAnswer);
  };

  const removeOption = (optionId: string) => {
    if (options.length <= 2) return; // Keep minimum 2 options

    const filteredOptions = options.filter(opt => opt.id !== optionId);
    setOptions(filteredOptions);

    // If removed option was correct answer, reset to first option
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === optionId) {
      newCorrectAnswer = filteredOptions[0]?.id || '1';
      setCorrectAnswer(newCorrectAnswer);
    }

    updateFormData(filteredOptions, newCorrectAnswer);
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    setCorrectAnswer(optionId);
    updateFormData(options, optionId);
  };

  // Unified upload method for all files
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have files to upload
    const hasAudioToUpload = selectedAudioFile && !uploadedAudioUrl;
    const answerImagesToUpload = Object.entries(answerImageUploads)
      .filter(([_, upload]) => upload.file && !upload.uploadedUrl);

    if (!hasAudioToUpload && answerImagesToUpload.length === 0) {
      // Check if everything is already uploaded
      const allOptionsHaveImages = options.every(option => option.image);

      if (uploadedAudioUrl && allOptionsHaveImages) {
        console.log('All files already uploaded');
        return true;
      }

      message.warning('Please select and upload all required files (audio + all option images)');
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
          message.error(`Option ${parseInt(index) + 1} image: ${imageValidation.error}`);
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

      // Upload option images if needed
      for (const [index, upload] of answerImagesToUpload) {
        if (upload.file) {
          const imagePromise = uploadImageByType(
            upload.file,
            questionType,
            (progress: UploadProgress) => {
              const fileProgress = progress.percentage / totalFiles;
              setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress));
            }
          ).then(result => ({ type: 'option_image', index: parseInt(index), result }));
          uploadPromises.push(imagePromise);
        }
      }

      const results = await Promise.all(uploadPromises);

      // Process results
      let audioUrl = uploadedAudioUrl;
      const newAnswerUploads = { ...answerImageUploads };
      let updatedOptions = [...options];

      for (const item of results) {
        if (item.type === 'audio') {
          if (item.result.success) {
            audioUrl = item.result.url;
          } else {
            throw new Error(`Audio upload failed: ${item.result.error}`);
          }
        } else if (item.type === 'option_image') {
          if (item.result.success) {
            newAnswerUploads[item.index] = { file: null, uploadedUrl: item.result.url };
            updatedOptions[item.index] = {
              ...updatedOptions[item.index],
              image: item.result.url,
            };
          } else {
            throw new Error(`Option ${item.index + 1} image upload failed: ${item.result.error}`);
          }
        }
        completedFiles++;
      }

      // Update form and state
      setUploadedAudioUrl(audioUrl);
      setAnswerImageUploads(newAnswerUploads);
      setOptions(updatedOptions);
      
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          audio: audioUrl,
          audio_url: audioUrl,
          options: updatedOptions,
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

  // Initialize values
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      if (data.audio || data.audio_url) {
        setUploadedAudioUrl(data.audio_url || data.audio);
      }
      
      if (data.audio_transcript_chinese) {
        setAudioTranscriptChinese(data.audio_transcript_chinese);
        setTranscriptText(data.audio_transcript_chinese);
      }
      
      if (data.audio_transcript_pinyin) {
        setAudioTranscriptPinyin(data.audio_transcript_pinyin);
      }
      
      if (data.options) {
        setOptions(data.options);
        const imageUploads: typeof answerImageUploads = {};
        data.options.forEach((option, index) => {
          if (option.image) {
            imageUploads[index] = { file: null, uploadedUrl: option.image };
          }
        });
        setAnswerImageUploads(imageUploads);
      }
      
      if (data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
      }
    }
  }, [initialValues]);

  return (
    <div>
      {/* Question Setup */}
      <Card title="Question Setup" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Question Instruction"
          name={['data', 'instruction']}
          rules={[{ required: true, message: 'Please enter the question instruction' }]}
        >
          <Input placeholder="e.g., Listen to the audio and choose the correct image" />
        </Form.Item>
      </Card>

      {/* Audio Section */}
      <Card title="Audio File" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Audio File"
          name={['data', 'audio']}
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

        {/* Audio Transcript */}
        <Form.Item
          label="Audio Transcript (Chinese)"
          name={['data', 'audio_transcript_chinese']}
          help="Optional transcript of the audio content"
        >
          <TextArea
            rows={2}
            placeholder="Enter Chinese transcript of the audio"
            onChange={(e) => handleTranscriptChange(e.target.value)}
            style={{ fontSize: "16px" }}
          />
        </Form.Item>

        {audioTranscriptPinyin && (
          <Form.Item label="Auto-generated Pinyin">
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              fontSize: '14px',
              color: '#666'
            }}>
              {audioTranscriptPinyin}
            </div>
          </Form.Item>
        )}

        <Form.Item
          label="Audio Translation (Vietnamese)"
          name={['data', 'audio_transcript_translation']}
          help="Optional Vietnamese translation of the audio"
        >
          <TextArea
            rows={2}
            placeholder="Enter Vietnamese translation"
          />
        </Form.Item>

        {/* Hidden form fields */}
        <Form.Item name={['data', 'audio_url']} style={{ display: 'none' }}>
          <Input />
        </Form.Item>
        <Form.Item name={['data', 'audio_transcript_pinyin']} style={{ display: 'none' }}>
          <Input />
        </Form.Item>
      </Card>

      {/* Answer Options */}
      <Card
        title="Answer Options"
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addOption}
            disabled={options.length >= 6}
          >
            Add Option
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {options.map((option, index) => {
            const answerUpload = answerImageUploads[index];
            return (
              <Card
                key={option.id}
                size="small"
                style={{
                  border: correctAnswer === option.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  backgroundColor: correctAnswer === option.id ? '#f6ffed' : 'white'
                }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Option {index + 1}</span>
                    <Space>
                      <Button
                        type={correctAnswer === option.id ? 'primary' : 'default'}
                        size="small"
                        onClick={() => handleCorrectAnswerChange(option.id)}
                      >
                        {correctAnswer === option.id ? 'Correct Answer' : 'Mark as Correct'}
                      </Button>
                      {options.length > 2 && (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeOption(option.id)}
                        />
                      )}
                    </Space>
                  </div>
                }
              >
                {/* Image Upload */}
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Option Image</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Upload
                      accept="image/*"
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleAnswerImageChange(option.id, file);
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
                            onClick={() => handleRemoveAnswerImage(option.id)}
                            type="text"
                            danger
                          />
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <img
                            src={answerUpload.uploadedUrl}
                            alt={option.alt || `Option ${index + 1}`}
                            style={{ maxWidth: 150, maxHeight: 150, objectFit: 'cover', borderRadius: '4px' }}
                          />
                        </div>
                      </div>
                    )}
                    {DEV_MODE && answerUpload?.file && !answerUpload?.uploadedUrl && (
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="primary"
                          icon={<UploadOutlined />}
                          onClick={() => handleUploadAnswerImage(option.id)}
                          loading={uploadStatus === 'uploading'}
                          size="small"
                        >
                          Upload Image to S3 (Dev Mode)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alt Text */}
                <div>
                  <Text strong>Alt Text (for accessibility)</Text>
                  <Input
                    placeholder="Describe what's in the image"
                    value={option.alt}
                    onChange={(e) => handleAltTextChange(option.id, e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                </div>

                {/* Preview */}
                {answerUpload?.uploadedUrl && (
                  <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                    <Text strong>Preview: </Text>
                    <div style={{ marginTop: '4px' }}>
                      <img
                        src={answerUpload.uploadedUrl}
                        alt={option.alt || `Option ${index + 1}`}
                        style={{ maxWidth: 100, maxHeight: 100, objectFit: 'cover', borderRadius: '4px' }}
                      />
                      {option.alt && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          Alt: {option.alt}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </Space>

        {/* Correct Answer Summary */}
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
          <Text strong>Correct Answer: </Text>
          <Text>Option {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {options.find(opt => opt.id === correctAnswer)?.alt && (
            <Text> - {options.find(opt => opt.id === correctAnswer)?.alt}</Text>
          )}
        </div>
      </Card>

      {/* Additional Settings */}
      <Card title="Additional Settings" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Explanation (Optional)"
          name={['data', 'explanation']}
          help="Provide an explanation that will be shown after the student answers"
        >
          <TextArea
            rows={3}
            placeholder="Explain why this is the correct answer..."
          />
        </Form.Item>
      </Card>

      {/* Hidden form fields for proper data structure */}
      <Form.Item name={['data', 'options']} style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name={['data', 'correctAnswer']} style={{ display: 'none' }}>
        <Input />
      </Form.Item>

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

SelectionAudioImageForm.displayName = 'SelectionAudioImageForm';

export default SelectionAudioImageForm;