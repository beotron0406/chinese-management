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
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { SelectionTextImageQuestionData } from '@/types/questionType';
import { uploadImageByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

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
  questionType = 'question_selection_text_image',
}, ref) => {
  // Upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>('');

  // Answer image uploads state (tracking which answer is being uploaded)
  const [answerImageUploads, setAnswerImageUploads] = useState<{
    [key: number]: {
      file: File | null;
      uploadedUrl?: string;
    }
  }>({});

  // Options state
  const [options, setOptions] = useState<SelectionTextImageQuestionData['options']>([
    { id: '1', image: '', alt: '' },
    { id: '2', image: '', alt: '' },
    { id: '3', image: '', alt: '' },
    { id: '4', image: '', alt: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('1');

  const updateFormData = (newOptions: SelectionTextImageQuestionData['options'], newCorrectAnswer: string) => {
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        options: newOptions,
        correctAnswer: newCorrectAnswer
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

  // Unified upload method for all image files
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have images to upload
    const answerImagesToUpload = Object.entries(answerImageUploads)
      .filter(([_, upload]) => upload.file && !upload.uploadedUrl);

    if (answerImagesToUpload.length === 0) {
      // Check if all options have images uploaded
      const allOptionsHaveImages = options.every(option => option.image);

      if (allOptionsHaveImages) {
        console.log('All images already uploaded');
        return true;
      }

      message.warning('Please select and upload all option images');
      return false;
    }

    // Validate all image files
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
      const totalFiles = answerImagesToUpload.length;
      let completedFiles = 0;

      // Upload option images
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
      const newAnswerUploads = { ...answerImageUploads };
      let updatedOptions = [...options];

      for (const item of results) {
        if (item.type === 'option_image') {
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
      setAnswerImageUploads(newAnswerUploads);
      setOptions(updatedOptions);
      
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          options: updatedOptions,
        }
      });

      setUploadStatus('success');
      setUploadProgress(100);

      if (showModal) {
        message.success('All images uploaded successfully!');
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
          <Input placeholder="e.g., Read the text and choose the correct image" />
        </Form.Item>

        <Form.Item
          label="Question Text"
          name={['data', 'question']}
          rules={[{ required: true, message: 'Please enter the question text' }]}
        >
          <TextArea
            rows={3}
            placeholder="Enter the question text that students will read"
            style={{ fontSize: '16px' }}
          />
        </Form.Item>
      </Card>

      {/* Answer Options */}
      <Card
        title="Answer Options (Images)"
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
                            style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: '4px' }}
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
                        style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: '4px' }}
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
        uploadedUrls={{}}
        errorMessage={uploadError}
        fileNames={{}}
      />
    </div>
  );
});

SelectionTextImageForm.displayName = 'SelectionTextImageForm';

export default SelectionTextImageForm;