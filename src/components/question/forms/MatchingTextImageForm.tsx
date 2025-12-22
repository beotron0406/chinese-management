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
  Select,
  Switch,
} from "antd";
import {
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { MatchingTextImageQuestionData } from '@/types/questionType';
import { uploadImageByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = false;

interface MatchingTextImageFormProps {
  form: FormInstance;
  initialValues?: {
    data?: MatchingTextImageQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface MatchingTextImageFormRef {
  uploadFiles: () => Promise<boolean>;
}

const MatchingTextImageForm = forwardRef<MatchingTextImageFormRef, MatchingTextImageFormProps>(({
  form,
  initialValues,
  questionType = 'question_matching_text_image',
}, ref) => {
  // Image uploads state for right column (tracking which image is being uploaded)
  const [rightImageUploads, setRightImageUploads] = useState<{
    [key: number]: {
      file: File | null;
      uploadedUrl?: string;
    }
  }>({});

  // Upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>('');

  // State for watching form values
  const [leftItems, setLeftItems] = useState<MatchingTextImageQuestionData['leftColumn']>([]);
  const [rightItems, setRightItems] = useState<MatchingTextImageQuestionData['rightColumn']>([]);

  // Watch for changes in the columns to update the select options
  const leftValues = Form.useWatch(["data", "leftColumn"], form) || [];
  const rightValues = Form.useWatch(["data", "rightColumn"], form) || [];

  // Generate pinyin for Chinese text
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

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      if (data.leftColumn) {
        setLeftItems(data.leftColumn);
      }
      
      if (data.rightColumn) {
        setRightItems(data.rightColumn);
        // Initialize image uploads state
        const imageUploads: typeof rightImageUploads = {};
        data.rightColumn.forEach((item, index) => {
          if (item.image) {
            imageUploads[index] = { file: null, uploadedUrl: item.image };
          }
        });
        setRightImageUploads(imageUploads);
      }
    }
  }, [initialValues]);

  // Update left and right items when form values change
  useEffect(() => {
    const updatedLeftItems = leftValues
      .map((item: any, index: number) => ({
        id: item?.id || `${index + 1}`,
        text: item?.text || '',
        pinyin: item?.pinyin || '',
      }))
      .filter((item: any) => item.text);

    setLeftItems(updatedLeftItems);
  }, [leftValues]);

  useEffect(() => {
    const updatedRightItems = rightValues
      .map((item: any, index: number) => ({
        id: item?.id || String.fromCharCode(65 + index), // A, B, C...
        image: item?.image || "",
        alt: item?.alt || "",
      }))
      .filter((item: any) => item.image || item.alt);

    setRightItems(updatedRightItems);
  }, [rightValues]);

  // Handle text changes with automatic pinyin generation
  const handleLeftTextChange = (itemIndex: number, value: string) => {
    const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];
    const pinyinResult = generatePinyin(value);
    
    if (leftItems[itemIndex]) {
      leftItems[itemIndex] = {
        ...leftItems[itemIndex],
        text: value,
        pinyin: pinyinResult,
      };
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          leftColumn: leftItems,
        }
      });
    }
  };

  // Image upload handlers for right column - auto upload
  const handleRightImageChange = async (itemIndex: number, file: File | null) => {
    if (!file) {
      setRightImageUploads(prev => ({
        ...prev,
        [itemIndex]: { file: null, uploadedUrl: prev[itemIndex]?.uploadedUrl }
      }));
      return false;
    }

    const imageValidation = validateFile(file, 'image', 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return false;
    }

    setRightImageUploads(prev => ({
      ...prev,
      [itemIndex]: { file, uploadedUrl: prev[itemIndex]?.uploadedUrl }
    }));

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
        setRightImageUploads(prev => ({
          ...prev,
          [itemIndex]: { file: null, uploadedUrl: result.url }
        }));

        const rightItems = form.getFieldValue(['data', 'rightColumn']) || [];
        rightItems[itemIndex] = {
          ...rightItems[itemIndex],
          image: result.url,
        };
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            rightColumn: rightItems,
          }
        });

        setUploadStatus('success');
        setUploadProgress(100);
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

  const handleUploadRightImage = async (itemIndex: number) => {
    const imageUpload = rightImageUploads[itemIndex];
    if (!imageUpload?.file) {
      message.warning('Vui lòng chọn file hình ảnh để tải lên');
      return;
    }

    const imageValidation = validateFile(imageUpload.file, 'image', 10);
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
        imageUpload.file,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        // Update state
        setRightImageUploads(prev => ({
          ...prev,
          [itemIndex]: { file: null, uploadedUrl: result.url }
        }));

        // Update form
        const rightItems = form.getFieldValue(['data', 'rightColumn']) || [];
        rightItems[itemIndex] = {
          ...rightItems[itemIndex],
          image: result.url,
        };
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            rightColumn: rightItems,
          }
        });

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

  const handleRemoveRightImage = (itemIndex: number) => {
    setRightImageUploads(prev => ({
      ...prev,
      [itemIndex]: { file: null, uploadedUrl: undefined }
    }));

    const rightItems = form.getFieldValue(['data', 'rightColumn']) || [];
    if (rightItems[itemIndex]) {
      rightItems[itemIndex] = {
        ...rightItems[itemIndex],
        image: '',
      };
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          rightColumn: rightItems,
        }
      });
    }
  };

  // Alt text handler for right column images
  const handleRightAltTextChange = (itemIndex: number, value: string) => {
    const rightItems = form.getFieldValue(['data', 'rightColumn']) || [];
    if (rightItems[itemIndex]) {
      rightItems[itemIndex] = {
        ...rightItems[itemIndex],
        alt: value,
      };
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          rightColumn: rightItems,
        }
      });
    }
  };

  // Unified upload method for all files
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have files to upload
    const rightImagesToUpload = Object.entries(rightImageUploads)
      .filter(([_, upload]) => upload.file && !upload.uploadedUrl);

    if (rightImagesToUpload.length === 0) {
      // Check if everything is already uploaded
      const rightItems = form.getFieldValue(['data', 'rightColumn']) || [];
      const allRightItemsHaveImages = rightItems.length > 0 && rightItems.every((item: any, index: number) =>
        item && (item.image || rightImageUploads[index]?.uploadedUrl)
      );

      if (allRightItemsHaveImages) {
        return true;
      }

      message.warning('Vui lòng chọn và tải lên tất cả file hình ảnh yêu cầu');
      return false;
    }

    // Validate all files
    for (const [index, upload] of rightImagesToUpload) {
      if (upload.file) {
        const imageValidation = validateFile(upload.file, 'image', 10);
        if (!imageValidation.isValid) {
          message.error(`Right item ${parseInt(index) + 1} image: ${imageValidation.error}`);
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
      const totalFiles = rightImagesToUpload.length;
      let completedFiles = 0;

      // Upload right column images if needed
      for (const [index, upload] of rightImagesToUpload) {
        if (upload.file) {
          const imagePromise = uploadImageByType(
            upload.file,
            questionType,
            (progress: UploadProgress) => {
              const fileProgress = progress.percentage / totalFiles;
              setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress));
            }
          ).then(result => ({ type: 'right_image', index: parseInt(index), result }));
          uploadPromises.push(imagePromise);
        }
      }

      const results = await Promise.all(uploadPromises);

      // Process results
      const newRightImageUploads = { ...rightImageUploads };
      const rightItems = form.getFieldValue(['data', 'rightColumn']) || [];

      for (const item of results) {
        if (item.type === 'right_image') {
          if (item.result.success && item.result.url) {
            newRightImageUploads[item.index] = { file: null, uploadedUrl: item.result.url };
            rightItems[item.index] = {
              ...rightItems[item.index],
              image: item.result.url,
            };
          } else {
            throw new Error(`Right item ${item.index + 1} image upload failed: ${item.result.error}`);
          }
        }
        completedFiles++;
      }

      // Update form and state
      setRightImageUploads(newRightImageUploads);
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          rightColumn: rightItems,
        }
      });

      setUploadStatus('success');
      setUploadProgress(100);

      if (showModal) {
        message.success('Tất cả file đã tải lên thành công!');
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

  // Generate ID for right column (A, B, C...)
  const generateRightId = (index: number): string => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
  };

  return (
    <div>
      {/* Question Setup */}
      <Card title="Thiết Lập Câu Hỏi" className="mb-6">
        <Form.Item
          label="1. Hướng Dẫn Câu Hỏi *"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Vui lòng nhập hướng dẫn câu hỏi" }]}
        >
          <TextArea
            placeholder="Nhập hướng dẫn cho học viên (ví dụ: 'Ghép văn bản tiếng Trung với hình ảnh tương ứng')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Left Column (Text) */}
      <Card
        title="Cột Trái (Chữ Trung)"
        className="mb-6"
      >
        <Form.List
          name={["data", "leftColumn"]}
          initialValue={[{ id: "1", text: "", pinyin: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  size="small"
                  className="mb-4"
                  title={`Mục Văn Bản ${index + 1}`}
                  extra={
                    fields.length > 1 && (
                      <Button
                        danger
                        size="small"
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    )
                  }
                >
                  {/* ID (Number) */}
                  <Form.Item
                    {...restField}
                    label="ID"
                    name={[name, "id"]}
                    initialValue={`${index + 1}`}
                    className="w-[100px]"
                  >
                    <Input
                      disabled
                      className="text-center font-bold"
                    />
                  </Form.Item>

                  {/* Chinese Text */}
                  <Form.Item
                    {...restField}
                    label="Chữ Trung"
                    name={[name, "text"]}
                    rules={[{ required: true, message: "Vui lòng nhập chữ Trung" }]}
                  >
                    <Input
                      placeholder="Nhập chữ Trung"
                      onChange={(e) => handleLeftTextChange(index, e.target.value)}
                      className="text-base"
                    />
                  </Form.Item>

                  {/* Auto-generated Pinyin */}
                  <Form.Item
                    {...restField}
                    label="Pinyin (Tự động tạo)"
                    name={[name, "pinyin"]}
                  >
                    <Input
                      placeholder="Pinyin sẽ được tự động tạo"
                      disabled
                      className="bg-gray-100 text-gray-500"
                    />
                  </Form.Item>

                  {/* Preview
                  {form.getFieldValue(['data', 'leftColumn', index, 'text']) && (
                    <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                      <Text strong>Xem Trước: </Text>
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                          {form.getFieldValue(['data', 'leftColumn', index, 'text'])}
                        </div>
                        {form.getFieldValue(['data', 'leftColumn', index, 'pinyin']) && (
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {form.getFieldValue(['data', 'leftColumn', index, 'pinyin'])}
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}
                </Card>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({ id: `${fields.length + 1}`, text: "", pinyin: "" })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Mục Văn Bản
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Right Column (Images) */}
      <Card
        title="Cột Phải (Hình Ảnh)"
        className="mb-6"
      >
        <Form.List
          name={["data", "rightColumn"]}
          initialValue={[{ id: "A", image: "", alt: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => {
                const imageUpload = rightImageUploads[index];
                return (
                  <Card
                    key={key}
                    size="small"
                    className="mb-4"
                    title={`Mục Hình Ảnh ${generateRightId(index)}`}
                    extra={
                      fields.length > 1 && (
                        <Button
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      )
                    }
                  >
                    {/* ID (Letter) */}
                    <Form.Item
                      {...restField}
                      label="ID"
                      name={[name, "id"]}
                      initialValue={generateRightId(index)}
                      className="w-[100px]"
                    >
                      <Input
                        disabled
                        className="text-center font-bold"
                      />
                    </Form.Item>

                    {/* Image Upload */}
                    <Form.Item
                      {...restField}
                      label="File Hình Ảnh"
                      name={[name, "image"]}
                      rules={[{ required: true, message: "Vui lòng tải lên file hình ảnh" }]}
                    >
                      <div>
                        <Upload
                          accept="image/*"
                          maxCount={1}
                          showUploadList={false}
                          beforeUpload={(file) => {
                            handleRightImageChange(index, file);
                            return false;
                          }}
                          disabled={!!imageUpload?.uploadedUrl}
                        >
                          <Button
                            icon={<UploadOutlined />}
                            disabled={!!imageUpload?.uploadedUrl}
                          >
                            {imageUpload?.file ? imageUpload.file.name : 'Chọn Hình Ảnh'}
                          </Button>
                        </Upload>
                        {imageUpload?.uploadedUrl && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <PictureOutlined className="text-green-500" />
                              <span className="text-green-500">Hình ảnh đã tải lên</span>
                              <Button
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveRightImage(index)}
                                type="text"
                                danger
                              />
                            </div>
                            <div className="mt-1">
                              <img
                                src={imageUpload.uploadedUrl}
                                alt={`Right item ${index + 1}`}
                                className="max-w-[200px] max-h-[200px] object-cover rounded"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    {/* Alt Text */}
                    <Form.Item
                      {...restField}
                      label="Văn Bản Thay Thế "
                      name={[name, "alt"]}
                      help="Mô tả nội dung trong hình ảnh"
                    >
                      <Input
                        placeholder="Mô tả nội dung trong hình ảnh"
                        onChange={(e) => handleRightAltTextChange(index, e.target.value)}
                      />
                    </Form.Item>
                  </Card>
                );
              })}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      id: generateRightId(fields.length),
                      image: "",
                      alt: "",
                    })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Mục Hình Ảnh
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Correct Matches */}
      <Card
        title="Các Cặp Đúng"
        extra={
          <Text type="secondary">
            Chọn các cặp ghép từ cột trái và cột phải
          </Text>
        }
        className="mb-6"
      >
        <Form.List
          name={["data", "correctMatches"]}
          initialValue={[{ left: "", right: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Space
                  key={key}
                  className="flex mb-2"
                  align="baseline"
                >
                  <Text strong>Cặp {index + 1}:</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "left"]}
                    rules={[{ required: true, message: "Chọn mục bên trái" }]}
                    className="w-[200px]"
                  >
                    <Select placeholder="Chọn mục văn bản">
                      {leftItems.map((item, itemIndex) => (
                        <Option key={`left-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.text}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Text type="secondary">ghép với</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "right"]}
                    rules={[{ required: true, message: "Chọn mục bên phải" }]}
                    className="w-[200px]"
                  >
                    <Select placeholder="Chọn mục hình ảnh">
                      {rightItems.map((item, itemIndex) => (
                        <Option key={`right-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.alt || 'Hình ảnh'}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  {fields.length > 1 && (
                    <Button
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  )}
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ left: "", right: "" })}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Cặp
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Match Preview */}
        {form.getFieldValue(['data', 'correctMatches'])?.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <Text strong>Tóm Tắt Các Cặp:</Text>
            <div className="mt-2">
              {form.getFieldValue(['data', 'correctMatches'])?.map((match: any, index: number) => {
                const leftItem = leftItems.find(item => item.id === match.left);
                const rightItem = rightItems.find(item => item.id === match.right);
                
                if (leftItem && rightItem) {
                  return (
                    <div key={index} className="mb-1">
                      <Text>
                        {leftItem.id}: {leftItem.text} 
                        {' → '}
                        {rightItem.id}: {rightItem.alt || 'Hình ảnh'}
                      </Text>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Additional Settings */}
      <Card title="Cài Đặt Thêm" className="mb-6">
        <Form.Item
          label="2. Giải Thích (Tùy Chọn)"
          name={['data', 'explanation']}
          help="Cung cấp giải thích sẽ được hiển thị sau khi học viên trả lời"
        >
          <TextArea
            rows={3}
            placeholder="Giải thích logic ghép hoặc cung cấp ngữ cảnh thêm..."
          />
        </Form.Item>

        <Form.Item
          label="3. Kích Hoạt"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>

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

MatchingTextImageForm.displayName = 'MatchingTextImageForm';

export default MatchingTextImageForm;