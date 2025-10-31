"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { 
  Form, 
  Input, 
  Button, 
  Radio, 
  Upload, 
  message, 
  Card, 
  Space, 
  Typography,
  Switch 
} from "antd";
import { UploadOutlined, DeleteOutlined, SoundOutlined, ReloadOutlined } from "@ant-design/icons";
import { uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';
import type { FormInstance } from "antd/es/form";
import { BoolAudioTextQuestionData } from '@/types/questionType';
import { pinyin } from "pinyin-pro";

const { TextArea } = Input;
const { Text } = Typography;

const DEV_MODE = true;

interface BoolAudioTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: BoolAudioTextQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface BoolAudioTextFormRef {
  uploadFiles: () => Promise<boolean>;
}

const BoolAudioTextForm = forwardRef<BoolAudioTextFormRef, BoolAudioTextFormProps>(({
  form,
  initialValues,
  questionType = 'question_bool_audio_text',
}, ref) => {
  // Audio upload state
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string>('');
  
  // Transcript and Pinyin state
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [generatedPinyin, setGeneratedPinyin] = useState<string>("");

  // Initialize form with existing data
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      if (data.audio || data.audio_url) {
        setUploadedAudioUrl(data.audio_url || data.audio);
      }
      
      if (data.transcript) {
        setTranscriptText(data.transcript);
      }
      
      if (data.pinyin) {
        setGeneratedPinyin(data.pinyin);
      }
    }
  }, [initialValues]);

  // Generate Pinyin from transcript
  const generatePinyin = (text: string) => {
    if (!text.trim()) {
      setGeneratedPinyin("");
      return "";
    }

    try {
      const pinyinText = pinyin(text, { 
        toneType: "symbol",
        type: 'array'
      }).join(' ');
      setGeneratedPinyin(pinyinText);
      
      // Update the form field
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          pinyin: pinyinText,
        }
      });

      return pinyinText;
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
      return "";
    }
  };

  // Handle transcript change
  const handleTranscriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setTranscriptText(text);
    generatePinyin(text);
  };

  // Audio file selection handler
  const handleAudioFileChange = (file: File | null) => {
    setSelectedAudioFile(file);
    return false;
  };

  // Audio upload handler
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

      if (result.success && result.url) {
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
        throw new Error(result.error || 'Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Upload failed. Please try again.');
    }
  };

  // Remove audio handler
  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedAudioUrl(undefined);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        audio: '',
        audio_url: '',
      }
    });
  };

  // Expose upload method to parent
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we need to upload
    if (uploadedAudioUrl) {
      return true;
    }

    if (!selectedAudioFile) {
      message.warning('Please select an audio file to upload');
      return false;
    }

    const audioValidation = validateFile(selectedAudioFile, 'audio', 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }

    if (showModal) {
      setUploadModalVisible(true);
    }
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

      if (result.success && result.url) {
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
        
        if (showModal) {
          message.success('Audio uploaded successfully!');
        }
        return true;
      } else {
        throw new Error(result.error || 'Upload failed - no URL returned');
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
            placeholder="Enter instruction for the student (e.g., 'Listen to the audio and determine if the statement is true or false')"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Card>

      {/* Audio Section */}
      <Card title="Audio File" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Audio File"
          name={["data", "audio"]}
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

        {/* Hidden audio_url field */}
        <Form.Item name={["data", "audio_url"]} style={{ display: 'none' }}>
          <Input />
        </Form.Item>
      </Card>

      {/* Audio Content */}
      <Card title="Audio Content" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Transcript (Chinese)"
          name={["data", "transcript"]}
          rules={[
            { required: true, message: "Please enter the Chinese transcript" },
          ]}
        >
          <Input 
            placeholder="Enter the Chinese transcript of the audio" 
            onChange={handleTranscriptChange}
            style={{ fontSize: '16px' }}
          />
        </Form.Item>

        <Form.Item 
          label="Pinyin" 
          name={["data", "pinyin"]}
        >
          <Space style={{ width: '100%' }}>
            <Input 
              placeholder="Pinyin will be auto-generated"
              value={generatedPinyin}
              onChange={(e) => setGeneratedPinyin(e.target.value)}
              style={{ width: 400 }}
            />
            {transcriptText && (
              <Button
                icon={<ReloadOutlined />}
                onClick={() => generatePinyin(transcriptText)}
              >
                Regenerate Pinyin
              </Button>
            )}
          </Space>
        </Form.Item>

        {/* Pinyin Preview */}
        {generatedPinyin && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ margin: "8px 0" }}>
              <Text strong>Generated Pinyin:</Text>
            </div>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "6px",
                fontSize: "16px",
                color: "#1890ff",
              }}
            >
              {generatedPinyin}
            </div>
          </div>
        )}

        <Form.Item 
          label="English Translation" 
          name={["data", "english"]}
          help="Optional English translation of the audio content"
        >
          <Input placeholder="Enter the English translation of the audio" />
        </Form.Item>
      </Card>

      {/* Answer Section */}
      <Card title="Answer" style={{ marginBottom: '24px' }}>
        <Form.Item
          label="Correct Answer"
          name={["data", "correctAnswer"]}
          rules={[
            { required: true, message: "Please select the correct answer" },
          ]}
        >
          <Radio.Group>
            <Space direction="vertical">
              <Radio value={true}>True</Radio>
              <Radio value={false}>False</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {/* Answer Preview */}
        {form.getFieldValue(['data', 'correctAnswer']) !== undefined && (
          <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
            <Text strong>Selected Answer: </Text>
            <span style={{ 
              fontSize: '16px', 
              color: form.getFieldValue(['data', 'correctAnswer']) ? '#52c41a' : '#ff4d4f' 
            }}>
              {form.getFieldValue(['data', 'correctAnswer']) ? 'True' : 'False'}
            </span>
          </div>
        )}
      </Card>

      {/* Additional Settings */}
      <Card title="Additional Settings" style={{ marginBottom: '24px' }}>
        <Form.Item 
          label="Explanation (Optional)" 
          name={["data", "explanation"]}
          help="Provide an explanation that will be shown after the student answers"
        >
          <TextArea
            placeholder="Explain why the statement is true or false..."
            autoSize={{ minRows: 2, maxRows: 4 }}
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

      {/* Preview Section */}
      {transcriptText && (
        <Card title="Question Preview" style={{ marginBottom: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
            <div style={{ marginBottom: '12px' }}>
              <Text strong>Transcript: </Text>
              <span style={{ fontSize: '18px' }}>{transcriptText}</span>
            </div>
            {generatedPinyin && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Pinyin: </Text>
                <span style={{ fontSize: '16px', color: '#1890ff' }}>{generatedPinyin}</span>
              </div>
            )}
            {form.getFieldValue(['data', 'english']) && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong>English: </Text>
                <span style={{ fontSize: '16px', color: '#666' }}>
                  {form.getFieldValue(['data', 'english'])}
                </span>
              </div>
            )}
            {form.getFieldValue(['data', 'correctAnswer']) !== undefined && (
              <div>
                <Text strong>Correct Answer: </Text>
                <span style={{ 
                  fontSize: '16px', 
                  color: form.getFieldValue(['data', 'correctAnswer']) ? '#52c41a' : '#ff4d4f' 
                }}>
                  {form.getFieldValue(['data', 'correctAnswer']) ? 'True' : 'False'}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

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

BoolAudioTextForm.displayName = 'BoolAudioTextForm';

export default BoolAudioTextForm;