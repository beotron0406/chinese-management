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
import { SelectionAudioTextQuestionData, TextOption } from '@/types/questionType';
import { TextContent } from '@/types/textContent';
import { uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';
import TTSButton from '@/components/shared/TTSButton';
import TextContentInput from '@/components/shared/TextContentInput';
import { getDisplayText } from '@/utils/textContentUtils';

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = false;

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
  const [options, setOptions] = useState<TextOption[]>([
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' }
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
  const handleAudioFileChange = async (file: File | null) => {
    if (!file) return false;

    // Validate file
    const audioValidation = validateFile(file, 'audio', 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }

    // Set file in state
    setSelectedAudioFile(file);

    // Auto-upload immediately
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
        message.success('Tải âm thanh lên thành công!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Tải lên thất bại. Vui lòng thử lại.');
    }

    return false;
  };

  const handleUploadAudio = async () => {
    if (!selectedAudioFile) {
      message.warning('Vui lòng chọn file âm thanh để tải lên');
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
        message.success('Tải âm thanh lên thành công!');
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

  // Handle TTS audio generated
  const handleTTSAudioGenerated = async (audioUrl: string, audioBlob: Blob) => {
    try {
      // 1. Set status to uploading
      setUploadModalVisible(true);
      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadError('');

      // 2. Use the passed blob directly
      
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

  // Unified upload method for audio file
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have audio to upload
    const hasAudioToUpload = selectedAudioFile && !uploadedAudioUrl;

    if (!hasAudioToUpload) {
      // Check if audio is already uploaded
      if (uploadedAudioUrl) {
        return true;
      }

      message.warning('Vui lòng chọn và tải lên file âm thanh');
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
          message.success('Tải âm thanh lên thành công!');
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
          <Input placeholder="ví dụ: Nghe audio và chọn văn bản đúng" />
        </Form.Item>
      </Card>

      {/* Audio Section */}
      <Card title="File Âm Thanh" className="mb-6">
        <Form.Item
          label="2. File Âm Thanh *"
          name={['data', 'audio']}
          rules={[{ required: true, message: "Vui lòng tải lên file âm thanh" }]}
        >
          <div>
            <Space>
              <Upload
                accept="audio/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  handleAudioFileChange(file);
                  return false;
                }}
              >
                <Button
                  icon={<UploadOutlined />}
                >
                  {selectedAudioFile ? selectedAudioFile.name : 'Chọn Âm Thanh'}
                </Button>
              </Upload>
              <TTSButton
                text={audioTranscriptChinese}
                onAudioGenerated={handleTTSAudioGenerated}
                buttonText="Tạo giọng nói"
              />
            </Space>
            {uploadedAudioUrl && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <SoundOutlined className="text-green-500" />
                  <span className="text-green-500">Âm thanh đã tải lên</span>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveAudio}
                    type="text"
                    danger
                  />
                </div>
                <div className="mt-1">
                  <audio controls className="w-full">
                    <source src={uploadedAudioUrl} />
                    Trình duyệt của bạn không hỗ trợ phần tử âm thanh.
                  </audio>
                </div>
              </div>
            )}
          </div>
        </Form.Item>

        {/* Audio Transcript */}
        <Form.Item
          label="3. Bản Ghi Âm Thanh (Tiếng Trung)"
          name={['data', 'audio_transcript_chinese']}
          help="Bản ghi tùy chọn của nội dung âm thanh"
        >
          <TextArea
            rows={2}
            placeholder="Nhập bản ghi tiếng Trung của âm thanh"
            onChange={(e) => handleTranscriptChange(e.target.value)}
            className="text-base"
          />
        </Form.Item>

        {audioTranscriptPinyin && (
          <Form.Item 
            label="4. Pinyin"
            name={['data', 'audio_transcript_pinyin']}
          >
            <Input
              value={audioTranscriptPinyin}
              onChange={(e) => {
                setAudioTranscriptPinyin(e.target.value);
                form.setFieldsValue({
                  data: {
                    ...form.getFieldValue('data'),
                    audio_transcript_pinyin: e.target.value
                  }
                });
              }}
              placeholder="Pinyin sẽ tự động tạo từ Bản Ghi Tiếng Trung"
            />
          </Form.Item>
        )}

        <Form.Item
          label="5. Bản Dịch Âm Thanh (Tiếng Việt)"
          name={['data', 'audio_transcript_translation']}
          help="Bản dịch tiếng Việt tùy chọn của âm thanh"
        >
          <TextArea
            rows={2}
            placeholder="Nhập bản dịch tiếng Việt"
          />
        </Form.Item>

        {/* Hidden form fields */}
        <Form.Item name={['data', 'audio_url']} className="hidden">
          <Input />
        </Form.Item>
        <Form.Item name={['data', 'audio_transcript_pinyin']} className="hidden">
          <Input />
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