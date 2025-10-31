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
  SoundOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { SelectionAudioTextQuestionData } from '@/types/questionType';
import { uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

interface SelectionAudioTextFormProps {
  form: FormInstance;
  initialValues?: {
    data?: SelectionAudioTextQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface SelectionAudioTextFormRef {
  uploadFiles: () => Promise<boolean>;
}

const SelectionAudioTextForm = forwardRef<SelectionAudioTextFormRef, SelectionAudioTextFormProps>(({
  form,
  initialValues,
  questionType = 'question_selection_audio_text',
}, ref) => {
  // Audio transcript state
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [audioTranscriptChinese, setAudioTranscriptChinese] = useState<string>("");
  const [audioTranscriptPinyin, setAudioTranscriptPinyin] = useState<string>("");

  // Audio upload state
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string>('');

  // Options state
  const [options, setOptions] = useState<SelectionAudioTextQuestionData['options']>([
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
    { id: '4', text: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('1');

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

  const updateFormData = (newOptions: SelectionAudioTextQuestionData['options'], newCorrectAnswer: string) => {
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        options: newOptions,
        correctAnswer: newCorrectAnswer
      }
    });
  };

  // Handle transcript changes
  const handleTranscriptChange = (value: string) => {
    setTranscriptText(value);
    setAudioTranscriptChinese(value);
    const pinyinResult = generatePinyin(value);
    setAudioTranscriptPinyin(pinyinResult);
    
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        audio_transcript_chinese: value,
        audio_transcript_pinyin: pinyinResult
      }
    });
  };

  // Audio upload handlers
  const handleAudioFileChange = (file: File | null) => {
    setSelectedAudioFile(file);
    return false;
  };

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
            audio_url: result.url,
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

  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedAudioUrl(undefined);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        audio: undefined,
        audio_url: undefined,
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

  // Unified upload method for audio file
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have audio to upload
    const hasAudioToUpload = selectedAudioFile && !uploadedAudioUrl;

    if (!hasAudioToUpload) {
      // Check if audio is already uploaded
      if (uploadedAudioUrl) {
        console.log('Audio already uploaded');
        return true;
      }

      message.warning('Please select and upload an audio file');
      return false;
    }

    // Validate audio file
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
      
      if (data.audio || data.audio_url) {
        setUploadedAudioUrl(data.audio_url || data.audio);
      }
      
      if (data.audio_transcript_chinese) {
        setAudioTranscriptChinese(data.audio_transcript_chinese);
        setTranscriptText(data.audio_transcript_chinese);
      }
      
      if (data.audio_transcript_pinyin) {
        setAudioTranscriptPinyin(data.audio_transcript_pinyin);
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
          <Input placeholder="e.g., Listen to the audio and choose the correct text" />
        </Form.Item>
      </Card>

      {/* Audio Section */}
      <Card title="Audio File" style={{ marginBottom: "24px" }}>
        <Form.Item
          label="Audio File"
          name={['data', 'audio']}
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

        {/* Audio Transcript */}
        <Form.Item
          label="Audio Transcript (Chinese)"
          name={['data', 'audio_transcript_chinese']}
          help="Optional transcript of the audio content"
        >
          <TextArea
            rows={2}
            placeholder="Enter Chinese transcript of the audio"
            onChange={(e) => handleTranscriptChange(e.target.value)}
            style={{ fontSize: "16px" }}
          />
        </Form.Item>

        {audioTranscriptPinyin && (
          <Form.Item label="Auto-generated Pinyin">
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              fontSize: '14px',
              color: '#666'
            }}>
              {audioTranscriptPinyin}
            </div>
          </Form.Item>
        )}

        <Form.Item
          label="Audio Translation (Vietnamese)"
          name={['data', 'audio_transcript_translation']}
          help="Optional Vietnamese translation of the audio"
        >
          <TextArea
            rows={2}
            placeholder="Enter Vietnamese translation"
          />
        </Form.Item>

        {/* Hidden form fields */}
        <Form.Item name={['data', 'audio_url']} style={{ display: 'none' }}>
          <Input />
        </Form.Item>
        <Form.Item name={['data', 'audio_transcript_pinyin']} style={{ display: 'none' }}>
          <Input />
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
        uploadedUrls={{ audioUrl: uploadedAudioUrl }}
        errorMessage={uploadError}
        fileNames={{
          audioName: selectedAudioFile?.name,
        }}
      />
    </div>
  );
});

SelectionAudioTextForm.displayName = 'SelectionAudioTextForm';

export default SelectionAudioTextForm;