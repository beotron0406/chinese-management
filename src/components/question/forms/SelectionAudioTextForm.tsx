"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Upload,
  Button,
  message,
  Space,
  Typography,
} from "antd";
import {
  SoundOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  OrderedListOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { SelectionAudioTextQuestionData, TextOption } from "@/types/questionType";
import { TextContent } from "@/types/textContent";
import { uploadAudioByType, validateFile, UploadProgress } from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TTSButton from "@/components/shared/TTSButton";
import TextContentInput from "@/components/shared/TextContentInput";
import { getDisplayText } from "@/utils/textContentUtils";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { Text } = Typography;
const { TextArea } = Input;

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
  questionType = "question_selection_audio_text",
}, ref) => {
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [audioTranscriptChinese, setAudioTranscriptChinese] = useState<string>("");
  const [audioTranscriptPinyin, setAudioTranscriptPinyin] = useState<string>("");
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "error" | "idle">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string>("");
  const [options, setOptions] = useState<TextOption[]>([
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("1");

  const generatePinyin = (chinese: string): string => {
    try {
      return pinyin(chinese, { toneType: "symbol", type: "array" }).join(" ");
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
      return "";
    }
  };

  const updateFormData = (newOptions: SelectionAudioTextQuestionData["options"], newCorrectAnswer: string) => {
    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        options: newOptions,
        correctAnswer: newCorrectAnswer,
      },
    });
  };

  const handleTranscriptChange = (value: string) => {
    setTranscriptText(value);
    setAudioTranscriptChinese(value);
    const pinyinResult = generatePinyin(value);
    setAudioTranscriptPinyin(pinyinResult);
    form.setFieldsValue({
      data: {
        ...form.getFieldValue("data"),
        audio_transcript_chinese: value,
        audio_transcript_pinyin: pinyinResult,
      },
    });
  };

  const handleAudioFileChange = async (file: File | null) => {
    if (!file) return false;
    const audioValidation = validateFile(file, "audio", 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }
    setSelectedAudioFile(file);
    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadAudioByType(file, questionType, (progress: UploadProgress) => {
        setUploadProgress(Math.round(progress.percentage));
      });
      if (result.success && result.url) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: { ...form.getFieldValue("data"), audio: result.url, audio_url: result.url },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedAudioFile(null);
        message.success("Tải âm thanh lên thành công!");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      message.error("Tải lên thất bại.");
    }
    return false;
  };

  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedAudioUrl(undefined);
    form.setFieldsValue({
      data: { ...form.getFieldValue("data"), audio: undefined, audio_url: undefined },
    });
  };

  const handleTTSAudioGenerated = async (audioUrl: string, audioBlob: Blob) => {
    try {
      setUploadModalVisible(true);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setUploadError("");
      const filename = `tts_generated_${Date.now()}.wav`;
      const file = new File([audioBlob], filename, { type: "audio/wav" });
      const result = await uploadAudioByType(file, questionType, (progress: UploadProgress) => {
        setUploadProgress(Math.round(progress.percentage));
      });
      if (result.success && result.url) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: { ...form.getFieldValue("data"), audio: result.url, audio_url: result.url },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        message.success("Tạo và tải lên giọng nói thành công!");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("TTS Upload error:", error);
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      message.error("Lỗi khi tải lên giọng nói");
    }
  };

  const handleOptionContentChange = (optionId: string, content: TextContent) => {
    const updatedOptions = options.map((option) =>
      option.id === optionId ? { ...option, content } : option
    );
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
    if (options.length <= 2) return;
    const filteredOptions = options.filter((opt) => opt.id !== optionId);
    setOptions(filteredOptions);
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === optionId) {
      newCorrectAnswer = filteredOptions[0]?.id || "1";
      setCorrectAnswer(newCorrectAnswer);
    }
    updateFormData(filteredOptions, newCorrectAnswer);
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    setCorrectAnswer(optionId);
    updateFormData(options, optionId);
  };

  const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
    const hasAudioToUpload = selectedAudioFile && !uploadedAudioUrl;
    if (!hasAudioToUpload) {
      if (uploadedAudioUrl) return true;
      message.warning("Vui lòng chọn và tải lên file âm thanh");
      return false;
    }
    const audioValidation = validateFile(selectedAudioFile, "audio", 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return false;
    }
    if (showModal) setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadAudioByType(selectedAudioFile, questionType, (progress: UploadProgress) => {
        setUploadProgress(Math.round(progress.percentage));
      });
      if (result.success) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          data: { ...form.getFieldValue("data"), audio: result.url, audio_url: result.url },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedAudioFile(null);
        if (showModal) message.success("Tải âm thanh lên thành công!");
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      message.error("Tải lên thất bại.");
      return false;
    }
  };

  useImperativeHandle(ref, () => ({ uploadFiles: () => handleUploadAllFiles(false) }));

  useEffect(() => {
    if (initialValues?.data) {
      const { data } = initialValues;
      if (data.audio || data.audio_url) setUploadedAudioUrl(data.audio_url || data.audio);
      if (data.audio_transcript_chinese) {
        setAudioTranscriptChinese(data.audio_transcript_chinese);
        setTranscriptText(data.audio_transcript_chinese);
      }
      if (data.audio_transcript_pinyin) setAudioTranscriptPinyin(data.audio_transcript_pinyin);
      if (data.options) {
        const normalizedOptions: TextOption[] = data.options.map((opt) => ({
          id: opt.id,
          content: opt.content || (opt.text ? { text: opt.text } : undefined),
          text: opt.text,
        }));
        setOptions(normalizedOptions);
      }
      if (data.correctAnswer) setCorrectAnswer(data.correctAnswer);
    }
  }, [initialValues]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Section 1: Question Setup */}
      <SectionContainer>
        <SectionHeader
          step={1}
          title="Thiết Lập Câu Hỏi"
          description="Nhập hướng dẫn câu hỏi"
          icon={<QuestionCircleOutlined />}
        />
        <FormField label="Hướng dẫn câu hỏi" required>
          <Form.Item
            name={["data", "instruction"]}
            rules={[{ required: true, message: "Bắt buộc" }]}
            className="mb-0"
          >
            <Input size="large" className="rounded-lg" placeholder="VD: Nghe audio và chọn văn bản đúng" />
          </Form.Item>
        </FormField>
      </SectionContainer>

      {/* Section 2: Audio */}
      <SectionContainer>
        <SectionHeader
          step={2}
          title="File Âm Thanh"
          description="Tải lên hoặc tạo âm thanh cho câu hỏi"
          icon={<SoundOutlined />}
        />
        <FormField label="File âm thanh" required>
          <Form.Item name={["data", "audio"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
              <Space>
                <Upload
                  accept="audio/*"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => { handleAudioFileChange(file); return false; }}
                >
                  <Button icon={<UploadOutlined />} size="large" className="rounded-lg">
                    {selectedAudioFile ? selectedAudioFile.name : "Chọn Âm Thanh"}
                  </Button>
                </Upload>
                <TTSButton text={audioTranscriptChinese} onAudioGenerated={handleTTSAudioGenerated} buttonText="Tạo TTS" />
              </Space>
              {uploadedAudioUrl && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <SoundOutlined />
                    <span className="text-sm font-medium">Đã tải lên</span>
                    <Button size="small" icon={<DeleteOutlined />} onClick={handleRemoveAudio} type="text" danger>Xóa</Button>
                  </div>
                  <audio controls className="w-full"><source src={uploadedAudioUrl} /></audio>
                </div>
              )}
            </div>
          </Form.Item>
        </FormField>

        <FormField label="Bản ghi tiếng Trung" hint="Dùng để tạo TTS">
          <Form.Item name={["data", "audio_transcript_chinese"]} className="mb-0">
            <TextArea rows={2} className="rounded-lg" placeholder="Nhập bản ghi tiếng Trung" onChange={(e) => handleTranscriptChange(e.target.value)} />
          </Form.Item>
        </FormField>

        {audioTranscriptPinyin && (
          <FormField label="Pinyin">
            <Form.Item name={["data", "audio_transcript_pinyin"]} className="mb-0">
              <Input size="large" className="rounded-lg" value={audioTranscriptPinyin} onChange={(e) => {
                setAudioTranscriptPinyin(e.target.value);
                form.setFieldsValue({ data: { ...form.getFieldValue("data"), audio_transcript_pinyin: e.target.value } });
              }} />
            </Form.Item>
          </FormField>
        )}

        <FormField label="Dịch nghĩa tiếng Việt">
          <Form.Item name={["data", "audio_transcript_translation"]} className="mb-0">
            <TextArea rows={2} className="rounded-lg" placeholder="Nhập bản dịch" />
          </Form.Item>
        </FormField>

        <Form.Item name={["data", "audio_url"]} className="hidden"><Input /></Form.Item>
      </SectionContainer>

      {/* Section 3: Answer Options */}
      <SectionContainer>
        <SectionHeader step={3} title="Các Lựa Chọn Trả Lời" description="Thêm đáp án và chọn đáp án đúng" icon={<OrderedListOutlined />} />
        <div className="space-y-4">
          {options.map((option, index) => (
            <div
              key={option.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                correctAnswer === option.id ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-600">Lựa chọn {index + 1}</span>
                <Space>
                  <Button
                    type={correctAnswer === option.id ? "primary" : "default"}
                    size="small"
                    onClick={() => handleCorrectAnswerChange(option.id)}
                    className="rounded-lg"
                    icon={correctAnswer === option.id ? <CheckCircleOutlined /> : null}
                  >
                    {correctAnswer === option.id ? "Đáp án đúng" : "Đánh dấu đúng"}
                  </Button>
                  {options.length > 2 && (
                    <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeOption(option.id)} className="rounded-lg" />
                  )}
                </Space>
              </div>
              <TextContentInput value={option.content} onChange={(content) => handleOptionContentChange(option.id, content)} placeholder="Nhập nội dung lựa chọn" />
            </div>
          ))}
        </div>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addOption} disabled={options.length >= 6} className="w-full mt-4 h-10 rounded-lg">
          Thêm lựa chọn
        </Button>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Text strong className="text-blue-800">Đáp án đúng: </Text>
          <Text className="text-blue-700">
            Lựa chọn {options.findIndex((opt) => opt.id === correctAnswer) + 1}
            {(() => {
              const correctOpt = options.find((opt) => opt.id === correctAnswer);
              const displayText = correctOpt?.content ? getDisplayText(correctOpt.content) : correctOpt?.text;
              return displayText && <span> - {displayText}</span>;
            })()}
          </Text>
        </div>
      </SectionContainer>

      {/* Section 4: Additional Settings */}
      <SectionContainer>
        <SectionHeader step={4} title="Cài Đặt Bổ Sung" description="Giải thích đáp án" icon={<CheckCircleOutlined />} />
        <FormField label="Giải thích" hint="Hiển thị sau khi học viên trả lời">
          <Form.Item name={["data", "explanation"]} className="mb-0">
            <TextArea rows={3} className="rounded-lg" placeholder="Giải thích tại sao đây là đáp án đúng..." />
          </Form.Item>
        </FormField>
      </SectionContainer>

      <Form.Item name={["data", "options"]} className="hidden"><Input /></Form.Item>
      <Form.Item name={["data", "correctAnswer"]} className="hidden"><Input /></Form.Item>

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={{ audioUrl: uploadedAudioUrl }}
        errorMessage={uploadError}
        fileNames={{ audioName: selectedAudioFile?.name }}
      />
    </div>
  );
});

SelectionAudioTextForm.displayName = "SelectionAudioTextForm";

export default SelectionAudioTextForm;