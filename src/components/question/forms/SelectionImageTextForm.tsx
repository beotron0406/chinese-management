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
import { SelectionImageTextQuestionData } from '@/types/questionType';
import { uploadImageByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

interface SelectionImageTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: SelectionImageTextQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface SelectionImageTextFormRef {
  uploadFiles: () => Promise<boolean>;
}

const SelectionImageTextForm = forwardRef<SelectionImageTextFormRef, SelectionImageTextFormProps>(({
  form,
  initialValues,
  questionType = 'question_selection_image_text',
}, ref) => {
  // Main image upload state
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');

  // Options state
  const [options, setOptions] = useState<SelectionImageTextQuestionData['options']>([
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
    { id: '4', text: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('1');

  const updateFormData = (newOptions: SelectionImageTextQuestionData['options'], newCorrectAnswer: string) => {
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        options: newOptions,
        correctAnswer: newCorrectAnswer
      }
    });
  };

  // Main image upload handlers
  const handleImageFileChange = (file: File | null) => {
    setSelectedImageFile(file);
    return false;
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      message.warning('Please select an image file to upload');
      return;
    }

    const imageValidation = validateFile(selectedImageFile, 'image', 10);
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
        selectedImageFile,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedImageUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            image: result.url,
            alt: imageAlt,
          }
        });
        setUploadStatus('success');
        setUploadProgress(100);
        setSelectedImageFile(null);
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

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setUploadedImageUrl(undefined);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        image: undefined,
        alt: undefined,
      }
    });
  };

  const handleAltTextChange = (value: string) => {
    setImageAlt(value);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        alt: value,
      }
    });
  };

  // Option management
  const handleOptionTextChange = (optionId: string, value: string) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          text: value
        };
      }
      return option;
    });

    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    const newOptions = [...options, { id: newId, text: '' }];
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

  // Unified upload method for image file
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have image to upload
    const hasImageToUpload = selectedImageFile && !uploadedImageUrl;

    if (!hasImageToUpload) {
      // Check if image is already uploaded
      if (uploadedImageUrl) {
        console.log('Image already uploaded');
        return true;
      }

      message.warning('Please select and upload an image file');
      return false;
    }

    // Validate image file
    const imageValidation = validateFile(selectedImageFile, 'image', 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return false;
    }

    if (showModal) {
      setUploadModalVisible(true);
    }
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadImageByType(
        selectedImageFile,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedImageUrl(result.url);
        
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            image: result.url,
            alt: imageAlt,
          }
        });

        setUploadStatus('success');
        setUploadProgress(100);
        setSelectedImageFile(null);

        if (showModal) {
          message.success('Image uploaded successfully!');
        }
        return true;
      } else {
        throw new Error(result.error);
      }
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
      
      if (data.image) {
        setUploadedImageUrl(data.image);
      }
      
      if (data.alt) {
        setImageAlt(data.alt);
      }
      
      if (data.options) {
        setOptions(data.options);
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
          <Input placeholder="e.g., Look at the image and choose the correct text" />
        </Form.Item>
      </Card>

      {/* Main Image Section */}
      <Card title="Question Image" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Image File"
          name={['data', 'image']}
          rules={[{ required: true, message: "Please upload an image file" }]}
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
                style={{ marginBottom: 8 }}
              >
                {selectedImageFile ? selectedImageFile.name : 'Select Image'}
              </Button>
            </Upload>
            {uploadedImageUrl && (
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
                <div style={{ marginTop: 8 }}>
                  <img
                    src={uploadedImageUrl}
                    alt={imageAlt || 'Question image'}
                    style={{ maxWidth: 300, maxHeight: 300, objectFit: 'cover', borderRadius: '4px' }}
                  />
                </div>
              </div>
            )}
            {DEV_MODE && selectedImageFile && !uploadedImageUrl && (
              <div style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleUploadImage}
                  loading={uploadStatus === 'uploading'}
                >
                  Upload Image to S3 (Dev Mode)
                </Button>
              </div>
            )}
          </div>
        </Form.Item>

        {/* Alt Text for main image */}
        <Form.Item
          label="Alt Text (for accessibility)"
          name={['data', 'alt']}
          help="Describe what's in the image"
        >
          <Input
            placeholder="Describe what's in the image"
            value={imageAlt}
            onChange={(e) => handleAltTextChange(e.target.value)}
          />
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
          {options.map((option, index) => (
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
              {/* Option Text */}
              <div>
                <Text strong>Option Text</Text>
                <Input
                  placeholder={`Enter option ${index + 1} text`}
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  style={{ marginTop: '4px', fontSize: '16px' }}
                />
              </div>

              {/* Preview */}
              {option.text && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                  <Text strong>Preview: </Text>
                  <div style={{ marginTop: '4px', fontSize: '14px' }}>
                    {option.text}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </Space>

        {/* Correct Answer Summary */}
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
          <Text strong>Correct Answer: </Text>
          <Text>Option {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {options.find(opt => opt.id === correctAnswer)?.text && (
            <Text> - {options.find(opt => opt.id === correctAnswer)?.text}</Text>
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
        uploadedUrls={{ imageUrl: uploadedImageUrl }}
        errorMessage={uploadError}
        fileNames={{
          imageName: selectedImageFile?.name,
        }}
      />
    </div>
  );
});

SelectionImageTextForm.displayName = 'SelectionImageTextForm';

export default SelectionImageTextForm;