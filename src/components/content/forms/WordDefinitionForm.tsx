"use client";
import React, { useState, useEffect } from 'react';
import { Form, Input, Card, Typography, Row, Col, Upload, Button, message } from 'antd';
import { SoundOutlined, PictureOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { pinyin } from 'pinyin-pro';
import type { FormInstance } from 'antd/es/form';
import { WordDefinitionData } from '@/types/contentTypes';
import { uploadWordImageToS3, uploadWordAudioToS3, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;

interface WordDefinitionFormProps {
  form: FormInstance;
  initialValues?: WordDefinitionData;
}

const WordDefinitionForm: React.FC<WordDefinitionFormProps> = ({ form, initialValues }) => {
  const [chineseText, setChineseText] = useState<string>('');
  const [generatedPinyin, setGeneratedPinyin] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState<{ imageUrl?: string; audioUrl?: string }>({});
  const [uploadError, setUploadError] = useState<string>('');

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

  const handleChineseTextChange = (value: string) => {
    setChineseText(value);
    const pinyinResult = generatePinyin(value);
    setGeneratedPinyin(pinyinResult);

    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        chinese_text: value,
        pinyin: pinyinResult
      }
    });
  };

  useEffect(() => {
    if (initialValues) {
      setChineseText(initialValues.chinese_text || '');
      setGeneratedPinyin(initialValues.pinyin || '');
      // If editing existing content, set the URLs
      if (initialValues.picture_url) {
        setUploadedUrls(prev => ({ ...prev, imageUrl: initialValues.picture_url }));
      }
      if (initialValues.audio_url) {
        setUploadedUrls(prev => ({ ...prev, audioUrl: initialValues.audio_url }));
      }
    }
  }, [initialValues]);

  const handleImageFileChange = (file: File | null) => {
    setSelectedImageFile(file);
    return false; // Prevent automatic upload
  };

  const handleAudioFileChange = (file: File | null) => {
    setSelectedAudioFile(file);
    return false; // Prevent automatic upload
  };

  const handleUploadFiles = async () => {
    if (!selectedImageFile && !selectedAudioFile) {
      message.warning('Please select at least one file to upload');
      return;
    }

    // Validate files
    if (selectedImageFile) {
      const imageValidation = validateFile(selectedImageFile, 'image', 10);
      if (!imageValidation.isValid) {
        message.error(imageValidation.error);
        return;
      }
    }

    if (selectedAudioFile) {
      const audioValidation = validateFile(selectedAudioFile, 'audio', 10);
      if (!audioValidation.isValid) {
        message.error(audioValidation.error);
        return;
      }
    }

    setUploadModalVisible(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const uploadPromises: Promise<any>[] = [];
      let imageUrl = uploadedUrls.imageUrl;
      let audioUrl = uploadedUrls.audioUrl;

      // Upload image if selected
      if (selectedImageFile) {
        const imageUploadPromise = uploadWordImageToS3(
          selectedImageFile,
          (progress: UploadProgress) => {
            setUploadProgress(Math.round(progress.percentage / 2)); // 50% for image
          }
        );
        uploadPromises.push(imageUploadPromise);
      }

      // Upload audio if selected
      if (selectedAudioFile) {
        const audioUploadPromise = uploadWordAudioToS3(
          selectedAudioFile,
          (progress: UploadProgress) => {
            const baseProgress = selectedImageFile ? 50 : 0;
            const audioProgress = selectedImageFile ? progress.percentage / 2 : progress.percentage;
            setUploadProgress(Math.round(baseProgress + audioProgress));
          }
        );
        uploadPromises.push(audioUploadPromise);
      }

      const results = await Promise.all(uploadPromises);

      // Process results
      let resultIndex = 0;
      if (selectedImageFile) {
        const imageResult = results[resultIndex++];
        if (imageResult.success) {
          imageUrl = imageResult.url;
        } else {
          throw new Error(`Image upload failed: ${imageResult.error}`);
        }
      }

      if (selectedAudioFile) {
        const audioResult = results[resultIndex++];
        if (audioResult.success) {
          audioUrl = audioResult.url;
        } else {
          throw new Error(`Audio upload failed: ${audioResult.error}`);
        }
      }

      // Update form values with URLs
      const currentData = form.getFieldValue('data') || {};
      form.setFieldsValue({
        data: {
          ...currentData,
          picture_url: imageUrl,
          audio_url: audioUrl,
        }
      });

      setUploadedUrls({ imageUrl, audioUrl });
      setUploadStatus('success');
      setUploadProgress(100);
      setSelectedImageFile(null);
      setSelectedAudioFile(null);

      message.success('Files uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Upload failed. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setUploadedUrls(prev => ({ ...prev, imageUrl: undefined }));
    const currentData = form.getFieldValue('data') || {};
    form.setFieldsValue({
      data: {
        ...currentData,
        picture_url: undefined,
      }
    });
  };

  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedUrls(prev => ({ ...prev, audioUrl: undefined }));
    const currentData = form.getFieldValue('data') || {};
    form.setFieldsValue({
      data: {
        ...currentData,
        audio_url: undefined,
      }
    });
  };

  return (
    <div>
      <Card title="Word Information" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Chinese Text"
              name={['data', 'chinese_text']}
              rules={[{ required: true, message: 'Please enter the Chinese text' }]}
            >
              <Input
                onChange={(e) => handleChineseTextChange(e.target.value)}
                style={{ fontSize: '18px' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Pinyin (Auto-generated)"
              name={['data', 'pinyin']}
              rules={[{ required: true, message: 'Pinyin is required' }]}
            >
              <Input
                value={generatedPinyin}
                onChange={(e) => setGeneratedPinyin(e.target.value)}
                addonAfter={<SoundOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Part of Speech"
          name={['data', 'speech']}
          rules={[{ required: true, message: 'Please enter the part of speech' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Explanation"
          name={['data', 'explaination']}
          rules={[{ required: true, message: 'Please enter the explanation' }]}
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item
          label="Additional Information"
          name={['data', 'additional_info']}
        >
          <TextArea rows={4} />
        </Form.Item>
      </Card>

      <Card title="Media Files" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Picture File"
              name={['data', 'picture_url']}
              rules={[{ required: true, message: 'Please upload a picture file' }]}
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
                  disabled={!!uploadedUrls.imageUrl}
                >
                  <Button
                    icon={<UploadOutlined />}
                    disabled={!!uploadedUrls.imageUrl}
                    style={{ marginBottom: 8 }}
                  >
                    {selectedImageFile ? selectedImageFile.name : 'Select Image'}
                  </Button>
                </Upload>
                {uploadedUrls.imageUrl && (
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
                    <div style={{ marginTop: 4 }}>
                      <img
                        src={uploadedUrls.imageUrl}
                        alt="Preview"
                        style={{ maxWidth: 100, maxHeight: 100, objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Audio File"
              name={['data', 'audio_url']}
              rules={[{ required: true, message: 'Please upload an audio file' }]}
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
                  disabled={!!uploadedUrls.audioUrl}
                >
                  <Button
                    icon={<UploadOutlined />}
                    disabled={!!uploadedUrls.audioUrl}
                    style={{ marginBottom: 8 }}
                  >
                    {selectedAudioFile ? selectedAudioFile.name : 'Select Audio'}
                  </Button>
                </Upload>
                {uploadedUrls.audioUrl && (
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
                        <source src={uploadedUrls.audioUrl} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>
          </Col>
        </Row>

        {(selectedImageFile || selectedAudioFile) && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUploadFiles}
              loading={uploadStatus === 'uploading'}
              size="large"
            >
              Upload to S3
            </Button>
          </div>
        )}
      </Card>

      {chineseText && (
        <Card title="Preview" style={{ marginBottom: '24px' }}>
          <div style={{ padding: '16px', border: '1px solid #d9d9d9', borderRadius: '6px', backgroundColor: '#fafafa' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>{chineseText}</Text>
              {generatedPinyin && <Text style={{ fontSize: '16px', color: '#666', marginLeft: '12px' }}>({generatedPinyin})</Text>}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text strong>Part of Speech: </Text>
              <Text>{form.getFieldValue(['data', 'speech']) || 'Not specified'}</Text>
            </div>
            <div>
              <Text strong>Explanation: </Text>
              <Text>{form.getFieldValue(['data', 'explaination']) || 'Not specified'}</Text>
            </div>
          </div>
        </Card>
      )}

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={uploadedUrls}
        errorMessage={uploadError}
        fileNames={{
          imageName: selectedImageFile?.name,
          audioName: selectedAudioFile?.name,
        }}
      />
    </div>
  );
};

export default WordDefinitionForm;