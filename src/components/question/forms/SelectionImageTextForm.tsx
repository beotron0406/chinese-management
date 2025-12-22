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
import { SelectionImageTextQuestionData, TextOption } from '@/types/questionType';
import { TextContent } from '@/types/textContent';
import { uploadImageByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';
import TextContentInput from '@/components/shared/TextContentInput';
import { getDisplayText } from '@/utils/textContentUtils';

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = false;

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
  const [options, setOptions] = useState<TextOption[]>([
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' }
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

  // Main image upload handlers - auto upload
  const handleImageFileChange = async (file: File | null) => {
    if (!file) {
      setSelectedImageFile(null);
      return false;
    }

    const imageValidation = validateFile(file, 'image', 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return false;
    }

    setSelectedImageFile(file);
    
    // Auto upload
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
        message.success('Tải hình ảnh lên thành công!');
      } else {
        throw new Error(result.error || 'Tải lên thất bại - không có URL trả về');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Tải lên thất bại');
      message.error('Tải lên thất bại. Vui lòng thử lại.');
    }

    return false;
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      message.warning('Vui lòng chọn file hình ảnh để tải lên');
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
        message.success('Tải hình ảnh lên thành công!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Tải lên thất bại. Vui lòng thử lại.');
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
  const handleOptionContentChange = (optionId: string, content: TextContent) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          content: content
        };
      }
      return option;
    });

    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    const newOptions: TextOption[] = [...options, { id: newId }];
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
        return true;
      }

      message.warning('Vui lòng chọn và tải lên file hình ảnh');
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
          message.success('Tải hình ảnh lên thành công!');
        }
        return true;
      } else {
        throw new Error(result.error);
      }
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
      
      if (data.image) {
        setUploadedImageUrl(data.image);
      }
      
      if (data.alt) {
        setImageAlt(data.alt);
      }
      
      if (data.options) {
        // Normalize options to support both legacy and new format
        const normalizedOptions: TextOption[] = data.options.map(opt => ({
          id: opt.id,
          content: opt.content || (opt.text ? { text: opt.text } : undefined),
          text: opt.text, // Keep legacy field
        }));
        setOptions(normalizedOptions);
      }
      
      if (data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
      }
    }
  }, [initialValues]);

  return (
    <div>
      {/* Question Setup */}
      <Card title="Thiết Lập Câu Hỏi" className="mb-6">
        <Form.Item
          label="1. Hướng Dẫn Câu Hỏi *"
          name={['data', 'instruction']}
          rules={[{ required: true, message: 'Vui lòng nhập hướng dẫn câu hỏi' }]}
        >
          <Input placeholder="ví dụ: Nhìn hình ảnh và chọn văn bản đúng" />
        </Form.Item>
      </Card>

      {/* Main Image Section */}
      <Card title="Hình Ảnh Câu Hỏi" className="mb-6">
        <Form.Item
          label="2. File Hình Ảnh *"
          name={['data', 'image']}
          rules={[{ required: true, message: "Vui lòng tải lên file hình ảnh" }]}
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
              >
                {selectedImageFile ? selectedImageFile.name : 'Chọn Hình Ảnh'}
              </Button>
            </Upload>
            {uploadedImageUrl && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <PictureOutlined className="text-green-500" />
                  <span className="text-green-500">Hình ảnh đã tải lên</span>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveImage}
                    type="text"
                    danger
                  />
                </div>
                <div className="mt-2">
                  <img
                    src={uploadedImageUrl}
                    alt={imageAlt || 'Question image'}
                    className="max-w-[300px] max-h-[300px] object-cover rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </Form.Item>

        {/* Alt Text for main image */}
        <Form.Item
          label="3. Văn Bản Thay Thế"
          name={['data', 'alt']}
          help="Mô tả nội dung trong hình ảnh"
        >
          <Input
            placeholder="Mô tả nội dung trong hình ảnh"
            value={imageAlt}
            onChange={(e) => handleAltTextChange(e.target.value)}
          />
        </Form.Item>
      </Card>

      {/* Answer Options */}
      <Card
        title="Các Lựa Chọn Trả Lời"
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
        className="mb-6"
      >
        <Space direction="vertical" className="w-full" size="large">
          {options.map((option, index) => (
            <Card
              key={option.id}
              size="small"
              className={`${correctAnswer === option.id ? 'border-2 border-blue-500 bg-green-50' : 'border border-gray-300 bg-white'}`}
              title={
                <div className="flex justify-between items-center">
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
              {/* Option Text */}
              <div>
                <Text strong>Văn Bản Tùy Chọn</Text>
                <div className="mt-2">
                  <TextContentInput
                    value={option.content}
                    onChange={(content) => handleOptionContentChange(option.id, content)}
                    placeholder={`Nhập văn bản tùy chọn ${index + 1}`}
                  />
                </div>
              </div>

              {/* Preview */}
              {/* {option.text && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                  <Text strong>Xem Trước: </Text>
                  <div style={{ marginTop: '4px', fontSize: '14px' }}>
                    {option.text}
                  </div>
                </div>
              )} */}
            </Card>
          ))}
        </Space>

        {/* Correct Answer Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <Text strong>Đáp Án Đúng: </Text>
          <Text>Tùy Chọn {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {(() => {
            const correctOpt = options.find(opt => opt.id === correctAnswer);
            const displayText = correctOpt?.content ? getDisplayText(correctOpt.content) : correctOpt?.text;
            return displayText && <Text> - {displayText}</Text>;
          })()}
        </div>
      </Card>

      {/* Additional Settings */}
      <Card title="Cài Đặt Thêm" className="mb-6">
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
      <Form.Item name={['data', 'options']} className="hidden">
        <Input />
      </Form.Item>
      <Form.Item name={['data', 'correctAnswer']} className="hidden">
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