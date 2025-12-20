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
  SoundOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { MatchingAudioTextQuestionData } from '@/types/questionType';
import { uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';
import TTSButton from '@/components/shared/TTSButton';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = false;

interface MatchingAudioTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: MatchingAudioTextQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface MatchingAudioTextFormRef {
  uploadFiles: () => Promise<boolean>;
}

const MatchingAudioTextForm = forwardRef<MatchingAudioTextFormRef, MatchingAudioTextFormProps>(({
  form,
  initialValues,
  questionType = 'question_matching_audio_text',
}, ref) => {
  // Audio uploads state for left column (tracking which audio is being uploaded)
  const [leftAudioUploads, setLeftAudioUploads] = useState<{
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
  const [leftItems, setLeftItems] = useState<MatchingAudioTextQuestionData['leftColumn']>([]);
  const [rightItems, setRightItems] = useState<MatchingAudioTextQuestionData['rightColumn']>([]);

  // Watch for changes in the columns to update the select options
  const leftValues = Form.useWatch(["data", "leftColumn"], form) || [];
  const rightValues = Form.useWatch(["data", "rightColumn"], form) || [];

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      if (data.leftColumn) {
        setLeftItems(data.leftColumn);
        // Initialize audio uploads state
        const audioUploads: typeof leftAudioUploads = {};
        data.leftColumn.forEach((item, index) => {
          if (item.audio || item.audio_url) {
            audioUploads[index] = { file: null, uploadedUrl: item.audio_url || item.audio };
          }
        });
        setLeftAudioUploads(audioUploads);
      }
      
      if (data.rightColumn) {
        setRightItems(data.rightColumn);
      }
    }
  }, [initialValues]);

  // Update left and right items when form values change
  useEffect(() => {
    const updatedLeftItems = leftValues
      .map((item: any, index: number) => ({
        id: item?.id || `${index + 1}`,
        audio: item?.audio || '',
        audio_url: item?.audio_url || item?.audio || '',
        transcript: item?.transcript || '',
      }))
      .filter((item: any) => item.transcript || item.audio || item.audio_url);

    setLeftItems(updatedLeftItems);
  }, [leftValues]);

  useEffect(() => {
    const updatedRightItems = rightValues
      .map((item: any, index: number) => ({
        id: item?.id || String.fromCharCode(65 + index), // A, B, C...
        text: item?.text || "",
      }))
      .filter((item: any) => item.text);

    setRightItems(updatedRightItems);
  }, [rightValues]);

  // Audio upload handlers for left column - auto upload
  const handleLeftAudioChange = async (itemIndex: number, file: File | null) => {
    if (!file) {
      setLeftAudioUploads(prev => ({
        ...prev,
        [itemIndex]: { file: null, uploadedUrl: prev[itemIndex]?.uploadedUrl }
      }));
      return false;
    }

    const audioValidation = validateFile(file, 'audio', 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }

    setLeftAudioUploads(prev => ({
      ...prev,
      [itemIndex]: { file, uploadedUrl: prev[itemIndex]?.uploadedUrl }
    }));

    // Auto upload
    setUploadModalVisible(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadAudioByType(
        file,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        setLeftAudioUploads(prev => ({
          ...prev,
          [itemIndex]: { file: null, uploadedUrl: result.url }
        }));

        const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];
        leftItems[itemIndex] = {
          ...leftItems[itemIndex],
          audio: result.url,
          audio_url: result.url,
        };
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            leftColumn: leftItems,
          }
        });

        setUploadStatus('success');
        setUploadProgress(100);
        message.success('Tải âm thanh lên thành công!');
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

  const handleUploadLeftAudio = async (itemIndex: number) => {
    const audioUpload = leftAudioUploads[itemIndex];
    if (!audioUpload?.file) {
      message.warning('Vui lòng chọn file âm thanh để tải lên');
      return;
    }

    const audioValidation = validateFile(audioUpload.file, 'audio', 10);
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
        audioUpload.file,
        questionType,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        // Update state
        setLeftAudioUploads(prev => ({
          ...prev,
          [itemIndex]: { file: null, uploadedUrl: result.url }
        }));

        // Update form
        const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];
        leftItems[itemIndex] = {
          ...leftItems[itemIndex],
          audio: result.url,
          audio_url: result.url,
        };
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            leftColumn: leftItems,
          }
        });

        setUploadStatus('success');
        setUploadProgress(100);
        message.success('Tải âm thanh lên thành công!');
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

  const handleRemoveLeftAudio = (itemIndex: number) => {
    setLeftAudioUploads(prev => ({
      ...prev,
      [itemIndex]: { file: null, uploadedUrl: undefined }
    }));

    const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];
    if (leftItems[itemIndex]) {
      leftItems[itemIndex] = {
        ...leftItems[itemIndex],
        audio: '',
        audio_url: '',
      };
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          leftColumn: leftItems,
        }
      });
    }
  };

  // Unified upload method for all files
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have files to upload
    const leftAudiosToUpload = Object.entries(leftAudioUploads)
      .filter(([_, upload]) => upload.file && !upload.uploadedUrl);

    if (leftAudiosToUpload.length === 0) {
      // Check if everything is already uploaded
      const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];
      const allLeftItemsHaveAudios = leftItems.length > 0 && leftItems.every((item: any, index: number) =>
        item && (item.audio || item.audio_url || leftAudioUploads[index]?.uploadedUrl)
      );

      if (allLeftItemsHaveAudios) {
        return true;
      }

      message.warning('Vui lòng chọn và tải lên tất cả file âm thanh yêu cầu');
      return false;
    }

    // Validate all files
    for (const [index, upload] of leftAudiosToUpload) {
      if (upload.file) {
        const audioValidation = validateFile(upload.file, 'audio', 10);
        if (!audioValidation.isValid) {
          message.error(`Left item ${parseInt(index) + 1} audio: ${audioValidation.error}`);
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
      const totalFiles = leftAudiosToUpload.length;
      let completedFiles = 0;

      // Upload left column audios if needed
      for (const [index, upload] of leftAudiosToUpload) {
        if (upload.file) {
          const audioPromise = uploadAudioByType(
            upload.file,
            questionType,
            (progress: UploadProgress) => {
              const fileProgress = progress.percentage / totalFiles;
              setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress));
            }
          ).then(result => ({ type: 'left_audio', index: parseInt(index), result }));
          uploadPromises.push(audioPromise);
        }
      }

      const results = await Promise.all(uploadPromises);

      // Process results
      const newLeftAudioUploads = { ...leftAudioUploads };
      const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];

      for (const item of results) {
        if (item.type === 'left_audio') {
          if (item.result.success && item.result.url) {
            newLeftAudioUploads[item.index] = { file: null, uploadedUrl: item.result.url };
            leftItems[item.index] = {
              ...leftItems[item.index],
              audio: item.result.url,
              audio_url: item.result.url,
            };
          } else {
            throw new Error(`Left item ${item.index + 1} audio upload failed: ${item.result.error}`);
          }
        }
        completedFiles++;
      }

      // Update form and state
      setLeftAudioUploads(newLeftAudioUploads);
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          leftColumn: leftItems,
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
          label="Hướng Dẫn Câu Hỏi"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Vui lòng nhập hướng dẫn câu hỏi" }]}
        >
          <TextArea
            placeholder="Nhập hướng dẫn cho học viên (ví dụ: 'Nghe audio và ghép với văn bản đúng')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Left Column (Audio) */}
      <Card
        title="Cột Trái (Âm Thanh)"
        className="mb-6"
      >
        <Form.List
          name={["data", "leftColumn"]}
          initialValue={[{ id: "1", audio: "", audio_url: "", transcript: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => {
                const audioUpload = leftAudioUploads[index];
                return (
                  <Card
                    key={key}
                    size="small"
                    className="mb-4"
                    title={`Mục Âm Thanh ${index + 1}`}
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

                    {/* Audio Upload */}
                    <Form.Item
                      {...restField}
                      label="File Âm Thanh"
                      name={[name, "audio"]}
                      rules={[{ required: true, message: "Vui lòng tải lên file âm thanh" }]}
                    >
                      <div>
                        <Space>
                          <Upload
                            accept="audio/*"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={(file) => {
                              handleLeftAudioChange(index, file);
                              return false;
                            }}
                          >
                            <Button
                              icon={<UploadOutlined />}
                            >
                              {audioUpload?.file ? audioUpload.file.name : 'Chọn Âm Thanh'}
                            </Button>
                          </Upload>
                          <TTSButton
                            text={form.getFieldValue(['data', 'leftColumn', index, 'transcript']) || ''}
                            buttonText="Tạo Giọng Nói"
                            size="middle"
                            onAudioGenerated={async (audioUrl, audioBlob) => {
                              try {
                                // 1. Set status to uploading
                                setUploadModalVisible(true);
                                setUploadStatus('uploading');
                                setUploadProgress(0);
                                setUploadError('');

                                // 2. Use passed blob directly
                                
                                // 3. Create a File object
                                const filename = `tts_generated_${Date.now()}.wav`;
                                const file = new File([audioBlob], filename, { type: 'audio/wav' });

                                // 4. Upload to S3
                                const result = await uploadAudioByType(
                                  file,
                                  questionType,
                                  (progress: UploadProgress) => {
                                    setUploadProgress(Math.round(progress.percentage));
                                  }
                                );

                                if (result.success && result.url) {
                                  // Update upload state
                                  setLeftAudioUploads(prev => ({
                                    ...prev,
                                    [index]: { file: null, uploadedUrl: result.url }
                                  }));

                                  // Update form data
                                  const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];
                                  leftItems[index] = {
                                    ...leftItems[index],
                                    audio: result.url,
                                    audio_url: result.url,
                                  };
                                  form.setFieldsValue({
                                    data: {
                                      ...form.getFieldValue('data'),
                                      leftColumn: leftItems,
                                    }
                                  });
                                  
                                  setUploadStatus('success');
                                  setUploadProgress(100);
                                  message.success('Tạo và tải lên giọng nói thành công!');
                                } else {
                                  throw new Error(result.error || 'Upload failed');
                                }
                              } catch (error) {
                                console.error('TTS Upload error:', error);
                                setUploadStatus('error');
                                setUploadError(error instanceof Error ? error.message : 'Upload failed');
                                message.error('Lỗi khi tải lên giọng nói');
                              }
                            }}
                          />
                        </Space>
                        {audioUpload?.uploadedUrl && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <SoundOutlined className="text-green-500" />
                              <span className="text-green-500">Âm thanh đã tải lên</span>
                              <Button
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveLeftAudio(index)}
                                type="text"
                                danger
                              />
                            </div>
                            <div className="mt-1">
                              <audio controls className="max-w-[300px]">
                                <source src={audioUpload.uploadedUrl} />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    {/* Transcript (Optional) */}
                    <Form.Item
                      {...restField}
                      label="Bản Ghi (Tùy Chọn)"
                      name={[name, "transcript"]}
                      help="Bản ghi tùy chọn của nội dung âm thanh"
                    >
                      <Input placeholder="Nhập bản ghi của âm thanh" />
                    </Form.Item>

                    {/* Hidden audio_url field */}
                    <Form.Item
                      {...restField}
                      name={[name, "audio_url"]}
                      className="hidden"
                    >
                      <Input />
                    </Form.Item>
                  </Card>
                );
              })}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({ id: `${fields.length + 1}`, audio: "", audio_url: "", transcript: "" })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Mục Âm Thanh
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Right Column (Text) */}
      <Card
        title="Cột Phải (Văn Bản/Bản Dịch)"
        className="mb-6"
      >
        <Form.List
          name={["data", "rightColumn"]}
          initialValue={[{ id: "A", text: "" }]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Space
                  key={key}
                  className="flex mb-2"
                  align="baseline"
                >
                  {/* ID (Letter) */}
                  <Form.Item
                    {...restField}
                    name={[name, "id"]}
                    initialValue={generateRightId(index)}
                    className="w-[60px] mr-2"
                  >
                    <Input
                      disabled
                      className="text-center font-bold"
                      placeholder="Chữ Cái"
                    />
                  </Form.Item>

                  {/* Text */}
                  <Form.Item
                    {...restField}
                    name={[name, "text"]}
                    rules={[{ required: true, message: "Thiếu văn bản" }]}
                    className="w-[400px]"
                  >
                    <Input placeholder="Nhập văn bản/bản dịch" />
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
                  onClick={() =>
                    add({
                      id: generateRightId(fields.length),
                      text: "",
                    })
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
                    <Select placeholder="Chọn mục âm thanh">
                      {leftItems.map((item, itemIndex) => (
                        <Option key={`left-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.transcript || 'File âm thanh'}
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
                    <Select placeholder="Chọn mục văn bản">
                      {rightItems.map((item, itemIndex) => (
                        <Option key={`right-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.text}
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
                        {leftItem.id}: {leftItem.transcript || 'File âm thanh'} 
                        {' → '}
                        {rightItem.id}: {rightItem.text}
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
          label="Giải Thích (Tùy Chọn)"
          name={['data', 'explanation']}
          help="Cung cấp giải thích sẽ được hiển thị sau khi học viên trả lời"
        >
          <TextArea
            rows={3}
            placeholder="Giải thích logic ghép hoặc cung cấp ngữ cảnh thêm..."
          />
        </Form.Item>

        <Form.Item
          label="Kích Hoạt"
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

MatchingAudioTextForm.displayName = 'MatchingAudioTextForm';

export default MatchingAudioTextForm;