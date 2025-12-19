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
const DEV_MODE = false;

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
  const handleAnswerImageChange = async (optionId: string, file: File | null) => {
    if (!file) return false;
    
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    if (optionIndex < 0) return false;

    // Validate file
    const imageValidation = validateFile(file, 'image', 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return false;
    }

    // Set file in state
    setAnswerImageUploads(prev => ({
      ...prev,
      [optionIndex]: { file, uploadedUrl: prev[optionIndex]?.uploadedUrl }
    }));

    // Auto-upload immediately
    setUploadModalVisible(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadImageByType(
        file,
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

        // Update options
        const updatedOptions = options.map(option => {
          if (option.id === optionId) {
            return {
              ...option,
              image: result.url || '',
            };
          }
          return option;
        });

        setOptions(updatedOptions);
        updateFormData(updatedOptions, correctAnswer);

        setUploadStatus('success');
        setUploadProgress(100);
        message.success('Tải hình ảnh lên thành công!');
      } else {
        throw new Error(result.error || 'Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Tải lên thất bại. Vui lòng thử lại.');
    }

    return false;
  };

  const handleUploadAnswerImage = async (optionId: string) => {
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    const answerUpload = answerImageUploads[optionIndex];
    
    if (!answerUpload?.file) {
      message.warning('Vui lòng chọn file hình ảnh để tải lên');
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
        message.success('Tải hình ảnh lên thành công!');
      } else {
        throw new Error(result.error || 'Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Tải lên thất bại. Vui lòng thử lại.');
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

      message.warning('Vui lòng chọn và tải lên tất cả hình ảnh tùy chọn');
      return false;
    }

    // Validate all image files
    for (const [index, upload] of answerImagesToUpload) {
      if (upload.file) {
        const imageValidation = validateFile(upload.file, 'image', 10);
        if (!imageValidation.isValid) {
          message.error(`Hình ảnh tùy chọn ${parseInt(index) + 1}: ${imageValidation.error}`);
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
            throw new Error(`Tải hình ảnh tùy chọn ${item.index + 1} thất bại: ${item.result.error}`);
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
        message.success('Tất cả hình ảnh đã tải lên thành công!');
      }
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Tải lên thất bại. Vui lòng thử lại.');
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
      <Card title="Thiết Lập Câu Hỏi" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Hướng Dẫn Câu Hỏi"
          name={['data', 'instruction']}
          rules={[{ required: true, message: 'Vui lòng nhập hướng dẫn câu hỏi' }]}
        >
          <Input placeholder="ví dụ: Đọc văn bản và chọn hình ảnh đúng" />
        </Form.Item>

        <Form.Item
          label="Văn Bản Câu Hỏi"
          name={['data', 'question']}
          rules={[{ required: true, message: 'Vui lòng nhập văn bản câu hỏi' }]}
        >
          <TextArea
            rows={3}
            placeholder="Nhập văn bản câu hỏi mà học viên sẽ đọc"
            style={{ fontSize: '16px' }}
          />
        </Form.Item>
      </Card>

      {/* Answer Options */}
      <Card
        title="Các Lựa Chọn Trả Lời (Hình Ảnh)"
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addOption}
            disabled={options.length >= 6}
          >
            Thêm Tùy Chọn
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
                    <span>Tùy Chọn {index + 1}</span>
                    <Space>
                      <Button
                        type={correctAnswer === option.id ? 'primary' : 'default'}
                        size="small"
                        onClick={() => handleCorrectAnswerChange(option.id)}
                      >
                        {correctAnswer === option.id ? 'Đáp Án Đúng' : 'Đánh Dấu Là Đúng'}
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
                  <Text strong>Hình Ảnh Tùy Chọn</Text>
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
                      >
                        {answerUpload?.file ? answerUpload.file.name : 'Chọn Hình Ảnh'}
                      </Button>
                    </Upload>
                    {answerUpload?.uploadedUrl && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <PictureOutlined style={{ color: '#52c41a' }} />
                          <span style={{ color: '#52c41a' }}>Hình ảnh đã tải lên</span>
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
                  </div>
                </div>

                {/* Alt Text */}
                <div>
                  <Text strong>Văn Bản Thay Thế (cho khả năng tiếp cận)</Text>
                  <Input
                    placeholder="Mô tả nội dung trong hình ảnh"
                    value={option.alt}
                    onChange={(e) => handleAltTextChange(option.id, e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                </div>

                {/* Preview */}
                {answerUpload?.uploadedUrl && (
                  <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                    <Text strong>Xem Trước: </Text>
                    <div style={{ marginTop: '4px' }}>
                      <img
                        src={answerUpload.uploadedUrl}
                        alt={option.alt || `Option ${index + 1}`}
                        style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: '4px' }}
                      />
                      {option.alt && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          Mô tả: {option.alt}
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
          <Text strong>Đáp Án Đúng: </Text>
          <Text>Tùy Chọn {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {options.find(opt => opt.id === correctAnswer)?.alt && (
            <Text> - {options.find(opt => opt.id === correctAnswer)?.alt}</Text>
          )}
        </div>
      </Card>

      {/* Additional Settings */}
      <Card title="Cài Đặt Thêm" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Giải Thích (Tùy Chọn)"
          name={['data', 'explanation']}
          help="Cung cấp giải thích sẽ được hiển thị sau khi học viên trả lời"
        >
          <TextArea
            rows={3}
            placeholder="Giải thích tại sao đây là đáp án đúng..."
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