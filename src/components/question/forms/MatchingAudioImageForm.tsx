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
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { MatchingAudioImageQuestionData } from '@/types/questionType';
import { uploadImageByType, uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

interface MatchingAudioImageFormProps {
  form: FormInstance;
  initialValues?: {
    data?: MatchingAudioImageQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface MatchingAudioImageFormRef {
  uploadFiles: () => Promise<boolean>;
}

const MatchingAudioImageForm = forwardRef<MatchingAudioImageFormRef, MatchingAudioImageFormProps>(({
  form,
  initialValues,
  questionType = 'question_matching_audio_image',
}, ref) => {
  // Audio uploads state for left column (tracking which audio is being uploaded)
  const [leftAudioUploads, setLeftAudioUploads] = useState<{
    [key: number]: {
      file: File | null;
      uploadedUrl?: string;
    }
  }>({});

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
  const [leftItems, setLeftItems] = useState<MatchingAudioImageQuestionData['leftColumn']>([]);
  const [rightItems, setRightItems] = useState<MatchingAudioImageQuestionData['rightColumn']>([]);

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
        image: item?.image || "",
        alt: item?.alt || "",
      }))
      .filter((item: any) => item.image || item.alt);

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

  // Image upload handlers for right column
  const handleRightImageChange = (itemIndex: number, file: File | null) => {
    setRightImageUploads(prev => ({
      ...prev,
      [itemIndex]: { file, uploadedUrl: prev[itemIndex]?.uploadedUrl }
    }));
    return false;
  };

  const handleUploadRightImage = async (itemIndex: number) => {
    const imageUpload = rightImageUploads[itemIndex];
    if (!imageUpload?.file) {
      message.warning('Please select an image file to upload');
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
    const leftAudiosToUpload = Object.entries(leftAudioUploads)
      .filter(([_, upload]) => upload.file && !upload.uploadedUrl);
    const rightImagesToUpload = Object.entries(rightImageUploads)
      .filter(([_, upload]) => upload.file && !upload.uploadedUrl);

    if (leftAudiosToUpload.length === 0 && rightImagesToUpload.length === 0) {
      // Check if everything is already uploaded
      const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];
      const rightItems = form.getFieldValue(['data', 'rightColumn']) || [];
      
      const allLeftItemsHaveAudios = leftItems.length > 0 && leftItems.every((item: any, index: number) =>
        item && (item.audio || item.audio_url || leftAudioUploads[index]?.uploadedUrl)
      );
      const allRightItemsHaveImages = rightItems.length > 0 && rightItems.every((item: any, index: number) =>
        item && (item.image || rightImageUploads[index]?.uploadedUrl)
      );

      if (allLeftItemsHaveAudios && allRightItemsHaveImages) {
        console.log('All files already uploaded');
        return true;
      }

      message.warning('Please select and upload all required audio and image files');
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
      const totalFiles = leftAudiosToUpload.length + rightImagesToUpload.length;
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
      const newLeftAudioUploads = { ...leftAudioUploads };
      const newRightImageUploads = { ...rightImageUploads };
      const leftItems = form.getFieldValue(['data', 'leftColumn']) || [];
      const rightItems = form.getFieldValue(['data', 'rightColumn']) || [];

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
        } else if (item.type === 'right_image') {
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
      setLeftAudioUploads(newLeftAudioUploads);
      setRightImageUploads(newRightImageUploads);
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          leftColumn: leftItems,
          rightColumn: rightItems,
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
            placeholder="Enter instruction for the student (e.g., 'Listen to the audio and match with the correct image')"
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

      {/* Right Column (Images) */}
      <Card
        title="Right Column (Images)"
        style={{ marginBottom: '24px' }}
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
                    style={{ marginBottom: '16px' }}
                    title={`Image Item ${generateRightId(index)}`}
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
                      style={{ width: "100px" }}
                    >
                      <Input
                        disabled
                        style={{ textAlign: "center", fontWeight: "bold" }}
                      />
                    </Form.Item>

                    {/* Image Upload */}
                    <Form.Item
                      {...restField}
                      label="Image File"
                      name={[name, "image"]}
                      rules={[{ required: true, message: "Please upload an image file" }]}
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
                            style={{ marginBottom: 8 }}
                          >
                            {imageUpload?.file ? imageUpload.file.name : 'Select Image'}
                          </Button>
                        </Upload>
                        {imageUpload?.uploadedUrl && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <PictureOutlined style={{ color: '#52c41a' }} />
                              <span style={{ color: '#52c41a' }}>Image uploaded</span>
                              <Button
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveRightImage(index)}
                                type="text"
                                danger
                              />
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <img
                                src={imageUpload.uploadedUrl}
                                alt={`Right item ${index + 1}`}
                                style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: '4px' }}
                              />
                            </div>
                          </div>
                        )}
                        {DEV_MODE && imageUpload?.file && !imageUpload?.uploadedUrl && (
                          <div style={{ marginTop: 8 }}>
                            <Button
                              type="primary"
                              icon={<UploadOutlined />}
                              onClick={() => handleUploadRightImage(index)}
                              loading={uploadStatus === 'uploading'}
                              size="small"
                            >
                              Upload Image to S3 (Dev Mode)
                            </Button>
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    {/* Alt Text */}
                    <Form.Item
                      {...restField}
                      label="Alt Text (for accessibility)"
                      name={[name, "alt"]}
                      help="Describe what's in the image"
                    >
                      <Input
                        placeholder="Describe what's in the image"
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
                  Add Image Item
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
                    <Select placeholder="Select image item">
                      {rightItems.map((item, itemIndex) => (
                        <Option key={`right-option-${item.id}-${itemIndex}`} value={item.id}>
                          {item.id}: {item.alt || 'Image'}
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
                        {rightItem.id}: {rightItem.alt || 'Image'}
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

MatchingAudioImageForm.displayName = 'MatchingAudioImageForm';

export default MatchingAudioImageForm;