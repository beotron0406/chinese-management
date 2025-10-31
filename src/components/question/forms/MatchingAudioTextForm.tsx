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
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { MatchingAudioTextQuestionData } from '@/types/questionType';
import { uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

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

  // Audio upload handlers for left column
  const handleLeftAudioChange = (itemIndex: number, file: File | null) => {
    setLeftAudioUploads(prev => ({
      ...prev,
      [itemIndex]: { file, uploadedUrl: prev[itemIndex]?.uploadedUrl }
    }));
    return false;
  };

  const handleUploadLeftAudio = async (itemIndex: number) => {
    const audioUpload = leftAudioUploads[itemIndex];
    if (!audioUpload?.file) {
      message.warning('Please select an audio file to upload');
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
        message.success('Audio uploaded successfully!');
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
        console.log('All files already uploaded');
        return true;
      }

      message.warning('Please select and upload all required audio files');
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

  // Generate ID for right column (A, B, C...)
  const generateRightId = (index: number): string => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
  };

  return (
    <div>
      {/* Question Setup */}
      <Card title="Question Setup" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Question Instruction"
          name={["data", "instruction"]}
          rules={[{ required: true, message: "Please enter the question instruction" }]}
        >
          <TextArea
            placeholder="Enter instruction for the student (e.g., 'Listen to the audio and match with the correct text')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Left Column (Audio) */}
      <Card
        title="Left Column (Audio)"
        style={{ marginBottom: '24px' }}
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
                    style={{ marginBottom: '16px' }}
                    title={`Audio Item ${index + 1}`}
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
                      style={{ width: "100px" }}
                    >
                      <Input
                        disabled
                        style={{ textAlign: "center", fontWeight: "bold" }}
                      />
                    </Form.Item>

                    {/* Audio Upload */}
                    <Form.Item
                      {...restField}
                      label="Audio File"
                      name={[name, "audio"]}
                      rules={[{ required: true, message: "Please upload an audio file" }]}
                    >
                      <div>
                        <Upload
                          accept="audio/*"
                          maxCount={1}
                          showUploadList={false}
                          beforeUpload={(file) => {
                            handleLeftAudioChange(index, file);
                            return false;
                          }}
                          disabled={!!audioUpload?.uploadedUrl}
                        >
                          <Button
                            icon={<UploadOutlined />}
                            disabled={!!audioUpload?.uploadedUrl}
                            style={{ marginBottom: 8 }}
                          >
                            {audioUpload?.file ? audioUpload.file.name : 'Select Audio'}
                          </Button>
                        </Upload>
                        {audioUpload?.uploadedUrl && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <SoundOutlined style={{ color: '#52c41a' }} />
                              <span style={{ color: '#52c41a' }}>Audio uploaded</span>
                              <Button
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveLeftAudio(index)}
                                type="text"
                                danger
                              />
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <audio controls style={{ maxWidth: 300 }}>
                                <source src={audioUpload.uploadedUrl} />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          </div>
                        )}
                        {DEV_MODE && audioUpload?.file && !audioUpload?.uploadedUrl && (
                          <div style={{ marginTop: 8 }}>
                            <Button
                              type="primary"
                              icon={<UploadOutlined />}
                              onClick={() => handleUploadLeftAudio(index)}
                              loading={uploadStatus === 'uploading'}
                              size="small"
                            >
                              Upload Audio to S3 (Dev Mode)
                            </Button>
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    {/* Transcript (Optional) */}
                    <Form.Item
                      {...restField}
                      label="Transcript (Optional)"
                      name={[name, "transcript"]}
                      help="Optional transcript of the audio content"
                    >
                      <Input placeholder="Enter transcript of the audio" />
                    </Form.Item>

                    {/* Hidden audio_url field */}
                    <Form.Item
                      {...restField}
                      name={[name, "audio_url"]}
                      style={{ display: 'none' }}
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
                  Add Audio Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Right Column (Text) */}
      <Card
        title="Right Column (Text/Translation)"
        style={{ marginBottom: '24px' }}
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
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  {/* ID (Letter) */}
                  <Form.Item
                    {...restField}
                    name={[name, "id"]}
                    initialValue={generateRightId(index)}
                    style={{ width: "60px", marginRight: 8 }}
                  >
                    <Input
                      disabled
                      style={{ textAlign: "center", fontWeight: "bold" }}
                      placeholder="Letter"
                    />
                  </Form.Item>

                  {/* Text */}
                  <Form.Item
                    {...restField}
                    name={[name, "text"]}
                    rules={[{ required: true, message: "Missing text" }]}
                    style={{ width: "400px" }}
                  >
                    <Input placeholder="Enter text/translation" />
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
                  Add Text Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Correct Matches */}
      <Card
        title="Correct Matches"
        extra={
          <Text type="secondary">
            Select matching pairs from the left and right columns
          </Text>
        }
        style={{ marginBottom: '24px' }}
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
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Text strong>Match {index + 1}:</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "left"]}
                    rules={[{ required: true, message: "Select left item" }]}
                    style={{ width: "200px" }}
                  >
                    <Select placeholder="Select audio item">
                      {leftItems.map((item, itemIndex) => (
                        <Option key={`left-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.transcript || 'Audio file'}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Text type="secondary">matches with</Text>
                  <Form.Item
                    {...restField}
                    name={[name, "right"]}
                    rules={[{ required: true, message: "Select right item" }]}
                    style={{ width: "200px" }}
                  >
                    <Select placeholder="Select text item">
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
                  Add Match
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Match Preview */}
        {form.getFieldValue(['data', 'correctMatches'])?.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
            <Text strong>Match Summary:</Text>
            <div style={{ marginTop: '8px' }}>
              {form.getFieldValue(['data', 'correctMatches'])?.map((match: any, index: number) => {
                const leftItem = leftItems.find(item => item.id === match.left);
                const rightItem = rightItems.find(item => item.id === match.right);
                
                if (leftItem && rightItem) {
                  return (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <Text>
                        {leftItem.id}: {leftItem.transcript || 'Audio file'} 
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
      <Card title="Additional Settings" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Explanation (Optional)"
          name={['data', 'explanation']}
          help="Provide an explanation that will be shown after the student answers"
        >
          <TextArea
            rows={3}
            placeholder="Explain the matching logic or provide additional context..."
          />
        </Form.Item>

        <Form.Item
          label="Active"
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