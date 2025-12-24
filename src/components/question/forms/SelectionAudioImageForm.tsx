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
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { SelectionAudioImageQuestionData } from '@/types/questionType';
import { uploadImageByType, uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';
import TTSButton from '@/components/shared/TTSButton';
import TextContentInput from '@/components/shared/TextContentInput';
import { TextContent } from '@/types/textContent';

const { Text } = Typography;
const { TextArea } = Input;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = false;

interface SelectionAudioImageFormProps {
  form: FormInstance;
  initialValues?: {
    data?: SelectionAudioImageQuestionData;
    isActive?: boolean;
  };
  questionType?: string;
}

export interface SelectionAudioImageFormRef {
  uploadFiles: () => Promise<boolean>;
}


const SelectionAudioImageForm = forwardRef<SelectionAudioImageFormRef, SelectionAudioImageFormProps>(({
  form,
  initialValues,
  questionType = 'question_selection_audio_image',
}, ref) => {
  // Audio transcript state (using TextContent)
  const [transcriptContent, setTranscriptContent] = useState<TextContent>({ text: "" });
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [audioTranscriptChinese, setAudioTranscriptChinese] = useState<string>("");
  const [audioTranscriptPinyin, setAudioTranscriptPinyin] = useState<string>("");

  // Helper functions to extract display text and pinyin from TextContent
  const getDisplayText = (content: TextContent | undefined): string => {
    if (!content) return '';
    if (content.chinese && content.chinese.length > 0) {
      return content.chinese.filter(c => c).join('');
    }
    return content.text || '';
  };

  const getDisplayPinyin = (content: TextContent | undefined): string => {
    if (!content) return '';
    if (content.pinyin && content.pinyin.length > 0) {
      return content.pinyin.filter(p => p).join(' ');
    }
    return '';
  };

  // Audio upload state
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string>('');

  // Answer image uploads state (tracking which answer is being uploaded)
  const [answerImageUploads, setAnswerImageUploads] = useState<{
    [key: number]: {
      file: File | null;
      uploadedUrl?: string;
    }
  }>({});

  // Options state
  const [options, setOptions] = useState<SelectionAudioImageQuestionData['options']>([
    { id: '1', image: '', alt: '' },
    { id: '2', image: '', alt: '' },
    { id: '3', image: '', alt: '' },
    { id: '4', image: '', alt: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('1');

  const updateFormData = (newOptions: SelectionAudioImageQuestionData['options'], newCorrectAnswer: string) => {
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        options: newOptions,
        correctAnswer: newCorrectAnswer
      }
    });
  };

  // Handle transcript TextContent change
  const handleTranscriptContentChange = (content: TextContent) => {
    setTranscriptContent(content);
    
    const displayText = getDisplayText(content);
    const displayPinyin = getDisplayPinyin(content);
    
    setTranscriptText(displayText);
    setAudioTranscriptChinese(displayText);
    setAudioTranscriptPinyin(displayPinyin);

    // Update form with both new format and legacy fields for compatibility
    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        transcriptContent: content,
        audio_transcript_chinese: displayText,
        audio_transcript_pinyin: displayPinyin,
      },
    });
  };

  // Audio upload handlers - auto upload
  const handleAudioFileChange = async (file: File | null) => {
    if (!file) {
      setSelectedAudioFile(null);
      return false;
    }

    const audioValidation = validateFile(file, 'audio', 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }

    setSelectedAudioFile(file);
    
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

  // Answer image upload handlers - auto upload
  const handleAnswerImageChange = async (optionId: string, file: File | null) => {
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    if (optionIndex < 0) return false;

    if (!file) {
      setAnswerImageUploads(prev => ({
        ...prev,
        [optionIndex]: { file: null, uploadedUrl: prev[optionIndex]?.uploadedUrl }
      }));
      return false;
    }

    const imageValidation = validateFile(file, 'image', 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return false;
    }

    setAnswerImageUploads(prev => ({
      ...prev,
      [optionIndex]: { file, uploadedUrl: prev[optionIndex]?.uploadedUrl }
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
        setAnswerImageUploads(prev => ({
          ...prev,
          [optionIndex]: { file: null, uploadedUrl: result.url }
        }));

        const updatedOptions = options.map(option => {
          if (option.id === optionId) {
            return {
              ...option,
              image: result.url || '',
            };
          }
          return option;
        });

        setOptions(updatedOptions);
        updateFormData(updatedOptions, correctAnswer);

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

  const handleUploadAnswerImage = async (optionId: string) => {
  const optionIndex = options.findIndex(opt => opt.id === optionId);
  const answerUpload = answerImageUploads[optionIndex];
  
  if (!answerUpload?.file) {
    message.warning('Vui lòng chọn file hình ảnh để tải lên');
    return;
  }

  const imageValidation = validateFile(answerUpload.file, 'image', 10);
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
      answerUpload.file,
      questionType,
      (progress: UploadProgress) => {
        setUploadProgress(Math.round(progress.percentage));
      }
    );

    if (result.success && result.url) {
      // Update state
      setAnswerImageUploads(prev => ({
        ...prev,
        [optionIndex]: { file: null, uploadedUrl: result.url }
      }));

      // Update options - ensure image is always a string
      const updatedOptions = options.map(option => {
        if (option.id === optionId) {
          return {
            ...option,
            image: result.url || '', // Provide fallback empty string
          };
        }
        return option;
      });

      setOptions(updatedOptions);
      updateFormData(updatedOptions, correctAnswer);

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

  const handleRemoveAnswerImage = (optionId: string) => {
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    
    setAnswerImageUploads(prev => ({
      ...prev,
      [optionIndex]: { file: null, uploadedUrl: undefined }
    }));

    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          image: '',
        };
      }
      return option;
    });

    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  // Option management
  const handleAltTextChange = (optionId: string, value: string) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          alt: value
        };
      }
      return option;
    });

    setOptions(updatedOptions);
    updateFormData(updatedOptions, correctAnswer);
  };

  const addOption = () => {
    const newId = (options.length + 1).toString();
    const newOptions = [...options, { id: newId, image: '', alt: '' }];
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

  // Unified upload method for all files
  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    // Check if we have files to upload
    const hasAudioToUpload = selectedAudioFile && !uploadedAudioUrl;
    const answerImagesToUpload = Object.entries(answerImageUploads)
      .filter(([_, upload]) => upload.file && !upload.uploadedUrl);

    if (!hasAudioToUpload && answerImagesToUpload.length === 0) {
      // Check if everything is already uploaded
      const allOptionsHaveImages = options.every(option => option.image);

      if (uploadedAudioUrl && allOptionsHaveImages) {
        return true;
      }

      message.warning('Vui lòng chọn và tải lên tất cả file yêu cầu (âm thanh + tất cả hình ảnh tùy chọn)');
      return false;
    }

    // Validate all files
    if (selectedAudioFile) {
      const audioValidation = validateFile(selectedAudioFile, 'audio', 10);
      if (!audioValidation.isValid) {
        message.error(audioValidation.error);
        return false;
      }
    }

    for (const [index, upload] of answerImagesToUpload) {
      if (upload.file) {
        const imageValidation = validateFile(upload.file, 'image', 10);
        if (!imageValidation.isValid) {
          message.error(`Option ${parseInt(index) + 1} image: ${imageValidation.error}`);
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
      const totalFiles = (hasAudioToUpload ? 1 : 0) + answerImagesToUpload.length;
      let completedFiles = 0;

      // Upload audio if needed
      if (hasAudioToUpload && selectedAudioFile) {
        const audioPromise = uploadAudioByType(
          selectedAudioFile,
          questionType,
          (progress: UploadProgress) => {
            const fileProgress = progress.percentage / totalFiles;
            setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress));
          }
        ).then(result => ({ type: 'audio', result }));
        uploadPromises.push(audioPromise);
      }

      // Upload option images if needed
      for (const [index, upload] of answerImagesToUpload) {
        if (upload.file) {
          const imagePromise = uploadImageByType(
            upload.file,
            questionType,
            (progress: UploadProgress) => {
              const fileProgress = progress.percentage / totalFiles;
              setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress));
            }
          ).then(result => ({ type: 'option_image', index: parseInt(index), result }));
          uploadPromises.push(imagePromise);
        }
      }

      const results = await Promise.all(uploadPromises);

      // Process results
      let audioUrl = uploadedAudioUrl;
      const newAnswerUploads = { ...answerImageUploads };
      let updatedOptions = [...options];

      for (const item of results) {
        if (item.type === 'audio') {
          if (item.result.success) {
            audioUrl = item.result.url;
          } else {
            throw new Error(`Audio upload failed: ${item.result.error}`);
          }
        } else if (item.type === 'option_image') {
          if (item.result.success) {
            newAnswerUploads[item.index] = { file: null, uploadedUrl: item.result.url };
            updatedOptions[item.index] = {
              ...updatedOptions[item.index],
              image: item.result.url,
            };
          } else {
            throw new Error(`Option ${item.index + 1} image upload failed: ${item.result.error}`);
          }
        }
        completedFiles++;
      }

      // Update form and state
      setUploadedAudioUrl(audioUrl);
      setAnswerImageUploads(newAnswerUploads);
      setOptions(updatedOptions);
      
      form.setFieldsValue({
        data: {
          ...form.getFieldValue('data'),
          audio: audioUrl,
          audio_url: audioUrl,
          options: updatedOptions,
        }
      });

      setUploadStatus('success');
      setUploadProgress(100);
      setSelectedAudioFile(null);

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

  // Initialize values
  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      
      if (data.audio || data.audio_url) {
        setUploadedAudioUrl(data.audio_url || data.audio);
      }
      
      // Load transcript content - handle both new and legacy format
      const dataAny = data as any;
      if (dataAny.transcriptContent) {
        setTranscriptContent(dataAny.transcriptContent);
        setTranscriptText(getDisplayText(dataAny.transcriptContent));
        setAudioTranscriptChinese(getDisplayText(dataAny.transcriptContent));
        setAudioTranscriptPinyin(getDisplayPinyin(dataAny.transcriptContent));
      } else if (data.audio_transcript_chinese) {
        // Fallback to legacy format
        const legacyContent: TextContent = data.audio_transcript_pinyin 
          ? { chinese: [data.audio_transcript_chinese], pinyin: [data.audio_transcript_pinyin] }
          : { text: data.audio_transcript_chinese };
        setTranscriptContent(legacyContent);
        setAudioTranscriptChinese(data.audio_transcript_chinese);
        setTranscriptText(data.audio_transcript_chinese);
        if (data.audio_transcript_pinyin) {
          setAudioTranscriptPinyin(data.audio_transcript_pinyin);
        }
      }
      
      if (data.options) {
        setOptions(data.options);
        const imageUploads: typeof answerImageUploads = {};
        data.options.forEach((option, index) => {
          if (option.image) {
            imageUploads[index] = { file: null, uploadedUrl: option.image };
          }
        });
        setAnswerImageUploads(imageUploads);
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
          <Input placeholder="ví dụ: Nghe audio và chọn hình ảnh đúng" />
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
                text={transcriptText}
                buttonText="Tạo Giọng Nói"
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
                }}
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

        {/* Audio Transcript with TextContentInput */}
        <div className="mb-4">
          <Text strong className="block mb-2">3. Bản Ghi Âm Thanh (Tiếng Trung)</Text>
          <TextContentInput
            value={transcriptContent}
            onChange={handleTranscriptContentChange}
            placeholder="Nhập bản ghi tiếng Trung của âm thanh"
          />
        </div>

        {/* Preview Section */}
        {transcriptText && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <Text strong className="block mb-2">Xem Trước:</Text>
            <div className="flex flex-col gap-1">
              <Text className="text-lg">{transcriptText}</Text>
              {audioTranscriptPinyin && (
                <Text className="text-blue-500">{audioTranscriptPinyin}</Text>
              )}
            </div>
          </div>
        )}

        {/* Hidden fields for form data structure */}
        <Form.Item name={['data', 'transcriptContent']} className="hidden">
          <Input />
        </Form.Item>
        <Form.Item name={['data', 'audio_transcript_chinese']} className="hidden">
          <Input />
        </Form.Item>
        <Form.Item name={['data', 'audio_transcript_pinyin']} className="hidden">
          <Input />
        </Form.Item>

        <Form.Item
          label="4. Bản Dịch Âm Thanh (Tiếng Việt)"
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
          {options.map((option, index) => {
            const answerUpload = answerImageUploads[index];
            return (
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
                {/* Image Upload */}
                <div className="mb-4">
                  <Text strong>Hình Ảnh Tùy Chọn</Text>
                  <div className="mt-1">
                    <Upload
                      accept="image/*"
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleAnswerImageChange(option.id, file);
                        return false;
                      }}
                    >
                      <Button
                        icon={<UploadOutlined />}
                      >
                        {answerUpload?.file ? answerUpload.file.name : 'Chọn Hình Ảnh'}
                      </Button>
                    </Upload>
                    {answerUpload?.uploadedUrl && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <PictureOutlined className="text-green-500" />
                          <span className="text-green-500">Hình ảnh đã tải lên</span>
                          <Button
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveAnswerImage(option.id)}
                            type="text"
                            danger
                          />
                        </div>
                        <div className="mt-1">
                          <img
                            src={answerUpload.uploadedUrl}
                            alt={option.alt || `Option ${index + 1}`}
                            className="max-w-[150px] max-h-[150px] object-cover rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alt Text */}
                <div>
                  <Text strong>Văn Bản Thay Thế </Text>
                  <Input
                    placeholder="Mô tả nội dung trong hình ảnh"
                    value={option.alt}
                    onChange={(e) => handleAltTextChange(option.id, e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Preview
                {answerUpload?.uploadedUrl && (
                  <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                    <Text strong>Xem Trước: </Text>
                    <div style={{ marginTop: '4px' }}>
                      <img
                        src={answerUpload.uploadedUrl}
                        alt={option.alt || `Option ${index + 1}`}
                        style={{ maxWidth: 100, maxHeight: 100, objectFit: 'cover', borderRadius: '4px' }}
                      />
                      {option.alt && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          Mô tả: {option.alt}
                        </div>
                      )}
                    </div>
                  </div>
                )} */}
              </Card>
            );
          })}
        </Space>

        {/* Correct Answer Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <Text strong>Đáp Án Đúng: </Text>
          <Text>Tùy Chọn {options.findIndex(opt => opt.id === correctAnswer) + 1}</Text>
          {options.find(opt => opt.id === correctAnswer)?.alt && (
            <Text> - {options.find(opt => opt.id === correctAnswer)?.alt}</Text>
          )}
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

SelectionAudioImageForm.displayName = 'SelectionAudioImageForm';

export default SelectionAudioImageForm;