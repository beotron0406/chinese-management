"use client";
import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, Radio, Upload, message, Card, Space } from "antd";
import { UploadOutlined, DeleteOutlined, SoundOutlined } from "@ant-design/icons";
import { uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';
import type { FormInstance } from "antd/es/form";
import { pinyin } from "pinyin-pro"; // Import pinyin library

const { TextArea } = Input;

const DEV_MODE = true;

interface AudioBoolFormProps {
  form: FormInstance;
  initialValues?: any;
  questionType?: string;
}

export interface AudioBoolFormRef {
  uploadFiles: () => Promise<boolean>;
}

const AudioBoolForm = forwardRef<AudioBoolFormRef, AudioBoolFormProps>(({
  form,
  initialValues,
  questionType = 'question_audio_bool',
}, ref) => {
  // Audio upload state
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(initialValues?.audio);
  const [uploadError, setUploadError] = useState<string>('');
  
  // Transcript and Pinyin state
  const [transcriptText, setTranscriptText] = useState<string>(initialValues?.transcript || "");
  const [generatedPinyin, setGeneratedPinyin] = useState<string>(initialValues?.pinyin || "");

  // Generate Pinyin from transcript
  const generatePinyin = (text: string) => {
    if (!text.trim()) {
      setGeneratedPinyin("");
      return;
    }

    try {
      const pinyinText = pinyin(text, { toneType: "symbol" });
      setGeneratedPinyin(pinyinText);
      
      // Update the form field
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          pinyin: pinyinText,
        }
      });
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
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

      if (result.success) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            audio: result.url,
          }
        });
        setUploadStatus('success');
        setUploadProgress(100);
        setSelectedAudioFile(null);
        message.success('Audio uploaded successfully!');
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

  // Remove audio handler
  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedAudioUrl(undefined);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        audio: undefined,
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

      if (result.success) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: {
            ...form.getFieldValue('data'),
            audio: result.url,
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

  return (
    <div>
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
      </Card>

      <Form.Item
        label="Instruction"
        name={["data", "instruction"]}
        rules={[{ required: true, message: "Please enter instruction" }]}
      >
        <TextArea
          placeholder="Enter instruction for the student (e.g., 'Listen to the audio and determine if the statement is true or false')"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

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
        />
      </Form.Item>

      <Form.Item 
        label="Pinyin" 
        name={["data", "pinyin"]}
        extra={generatedPinyin ? <span style={{ color: '#52c41a' }}>Auto-generated: {generatedPinyin}</span> : null}
      >
        <Input 
          placeholder="Enter the pinyin transcript of the audio" 
          value={generatedPinyin}
          onChange={(e) => setGeneratedPinyin(e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Vietnamese Translation" name={["data", "vietnamese"]}>
        <Input placeholder="Enter the Vietnamese translation of the audio" />
      </Form.Item>

      <Form.Item
        label="Correct Answer"
        name={["data", "correctAnswer"]}
        rules={[
          { required: true, message: "Please select the correct answer" },
        ]}
      >
        <Radio.Group>
          <Radio value={true}>True</Radio>
          <Radio value={false}>False</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item label="Explanation" name={["data", "explanation"]}>
        <TextArea
          placeholder="Enter explanation that will be shown after answering"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

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

AudioBoolForm.displayName = 'AudioBoolForm';

export default AudioBoolForm;