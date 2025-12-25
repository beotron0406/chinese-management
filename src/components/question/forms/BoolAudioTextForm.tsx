"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Button,
  Radio,
  Upload,
  message,
  Space,
  Typography,
  Switch,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  SoundOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { uploadAudioByType, validateFile, UploadProgress } from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TTSButton from "@/components/shared/TTSButton";
import TextContentInput from "@/components/shared/TextContentInput";
import type { FormInstance } from "antd/es/form";
import { BoolAudioTextQuestionData } from "@/types/questionType";
import { TextContent } from "@/types/textContent";
import { pinyin } from "pinyin-pro";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { TextArea } = Input;
const { Text } = Typography;

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

const BoolAudioTextForm = forwardRef<BoolAudioTextFormRef, BoolAudioTextFormProps>(
  ({ form, initialValues, questionType = "question_bool_audio_text" }, ref) => {
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "error" | "idle">("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(undefined);
    const [uploadError, setUploadError] = useState<string>("");
    const [transcriptText, setTranscriptText] = useState<string>("");
    const [generatedPinyin, setGeneratedPinyin] = useState<string>("");
    const [statementContent, setStatementContent] = useState<TextContent>({ text: "" });

    useEffect(() => {
      if (initialValues?.data) {
        const { data } = initialValues;
        if (data.audio || data.audio_url) setUploadedAudioUrl(data.audio_url || data.audio);
        if (data.transcriptContent) {
          if (data.transcriptContent.chinese && data.transcriptContent.chinese.length > 0) {
            setTranscriptText(data.transcriptContent.chinese.join(""));
            if (data.transcriptContent.pinyin) setGeneratedPinyin(data.transcriptContent.pinyin.join(" "));
          } else if (data.transcriptContent.text) {
            setTranscriptText(data.transcriptContent.text);
          }
        }
        if (data.statementContent) setStatementContent(data.statementContent);
      }
    }, [initialValues]);

    const generatePinyinText = (text: string) => {
      if (!text.trim()) { setGeneratedPinyin(""); return ""; }
      try {
        const pinyinText = pinyin(text, { toneType: "symbol", type: "array" }).join(" ");
        setGeneratedPinyin(pinyinText);
        form.setFieldsValue({ data: { ...form.getFieldValue("data"), pinyin: pinyinText } });
        return pinyinText;
      } catch (error) {
        console.warn("Failed to generate pinyin:", error);
        return "";
      }
    };

    const handleTranscriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setTranscriptText(text);
      const pinyinResult = generatePinyinText(text);
      const chinese = text.split("");
      const pinyinArray = pinyinResult.split(" ");
      form.setFieldsValue({
        data: { ...form.getFieldValue("data"), transcriptContent: { chinese, pinyin: pinyinArray } },
      });
    };

    const handleStatementChange = (content: TextContent) => {
      setStatementContent(content);
      form.setFieldsValue({ data: { ...form.getFieldValue("data"), statementContent: content } });
    };

    const handleAudioFileChange = async (file: File | null) => {
      if (!file) return false;
      const audioValidation = validateFile(file, "audio", 10);
      if (!audioValidation.isValid) { message.error(audioValidation.error); return false; }
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
          form.setFieldsValue({ data: { ...form.getFieldValue("data"), audio: result.url, audio_url: result.url } });
          setUploadStatus("success");
          setUploadProgress(100);
          setSelectedAudioFile(null);
          message.success("Tải âm thanh lên thành công!");
        } else {
          throw new Error(result.error || "Tải lên thất bại");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(error instanceof Error ? error.message : "Tải lên thất bại");
        message.error("Tải lên thất bại.");
      }
      return false;
    };

    const handleRemoveAudio = () => {
      setSelectedAudioFile(null);
      setUploadedAudioUrl(undefined);
      form.setFieldsValue({ data: { ...form.getFieldValue("data"), audio: "", audio_url: "" } });
    };

    const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
      if (uploadedAudioUrl) return true;
      if (!selectedAudioFile) { message.warning("Vui lòng chọn file âm thanh"); return false; }
      const audioValidation = validateFile(selectedAudioFile, "audio", 10);
      if (!audioValidation.isValid) { message.error(audioValidation.error); return false; }
      if (showModal) setUploadModalVisible(true);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setUploadError("");

      try {
        const result = await uploadAudioByType(selectedAudioFile, questionType, (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        });
        if (result.success && result.url) {
          setUploadedAudioUrl(result.url);
          form.setFieldsValue({ data: { ...form.getFieldValue("data"), audio: result.url, audio_url: result.url } });
          setUploadStatus("success");
          setUploadProgress(100);
          setSelectedAudioFile(null);
          if (showModal) message.success("Tải âm thanh lên thành công!");
          return true;
        } else {
          throw new Error(result.error || "Tải lên thất bại");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(error instanceof Error ? error.message : "Tải lên thất bại");
        message.error("Tải lên thất bại.");
        return false;
      }
    };

    useImperativeHandle(ref, () => ({ uploadFiles: () => handleUploadAllFiles(false) }));

    return (
      <div className="max-w-2xl mx-auto">
        {/* Section 1: Question Setup */}
        <SectionContainer>
          <SectionHeader step={1} title="Thiết Lập Câu Hỏi" description="Nhập hướng dẫn cho học sinh" icon={<QuestionCircleOutlined />} />
          <FormField label="Hướng dẫn câu hỏi" required>
            <Form.Item name={["data", "instruction"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <TextArea rows={2} className="rounded-lg" placeholder="VD: Nghe âm thanh và xác định câu phát biểu đúng hay sai" />
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 2: Audio */}
        <SectionContainer>
          <SectionHeader step={2} title="File Âm Thanh" description="Tải lên hoặc tạo âm thanh" icon={<SoundOutlined />} />
          <FormField label="File âm thanh" required>
            <Form.Item name={["data", "audio"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                <Space>
                  <Upload accept="audio/*" maxCount={1} showUploadList={false} beforeUpload={(file) => { handleAudioFileChange(file); return false; }}>
                    <Button icon={<UploadOutlined />} size="large" className="rounded-lg">
                      {selectedAudioFile ? selectedAudioFile.name : "Chọn Âm Thanh"}
                    </Button>
                  </Upload>
                  <TTSButton
                    text={transcriptText}
                    buttonText="Tạo TTS"
                    onAudioGenerated={async (audioUrl, audioBlob) => {
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
                          form.setFieldsValue({ data: { ...form.getFieldValue("data"), audio: result.url, audio_url: result.url } });
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
                    }}
                  />
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

          <FormField label="Bản ghi tiếng Trung" required hint="Dùng để tạo TTS">
            <Form.Item name={["data", "transcript"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <Input size="large" className="rounded-lg" placeholder="Nhập bản ghi tiếng Trung" onChange={handleTranscriptChange} />
            </Form.Item>
          </FormField>

          <FormField label="Pinyin" action={
            transcriptText && <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => generatePinyinText(transcriptText)}>Tạo lại</Button>
          }>
            <Form.Item name={["data", "pinyin"]} className="mb-0">
              <Input size="large" className="rounded-lg" value={generatedPinyin} onChange={(e) => setGeneratedPinyin(e.target.value)} />
            </Form.Item>
          </FormField>

          <FormField label="Bản dịch tiếng Anh">
            <Form.Item name={["data", "english"]} className="mb-0">
              <Input size="large" className="rounded-lg" placeholder="Nhập bản dịch tiếng Anh" />
            </Form.Item>
          </FormField>
          <Form.Item name={["data", "audio_url"]} className="hidden"><Input /></Form.Item>
        </SectionContainer>

        {/* Section 3: Statement */}
        <SectionContainer>
          <SectionHeader step={3} title="Câu Phát Biểu" description="Nhập câu cần đánh giá đúng/sai" icon={<CheckCircleOutlined />} />
          <FormField label="Câu phát biểu" required hint="Học sinh cần xác định câu này đúng hay sai dựa trên nội dung âm thanh">
            <TextContentInput value={statementContent} onChange={handleStatementChange} placeholder="Nhập câu phát biểu..." />
          </FormField>
          <Form.Item name={["data", "statementContent"]} className="hidden"><Input /></Form.Item>
        </SectionContainer>

        {/* Section 4: Answer */}
        <SectionContainer>
          <SectionHeader step={4} title="Đáp Án" description="Chọn đáp án đúng" icon={<CheckCircleOutlined />} />
          <FormField label="Đáp án đúng" required>
            <Form.Item name={["data", "correctAnswer"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value={true}>Đúng</Radio>
                  <Radio value={false}>Sai</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 5: Additional */}
        <SectionContainer>
          <SectionHeader step={5} title="Cài Đặt Bổ Sung" description="Giải thích và trạng thái" icon={<CheckCircleOutlined />} />
          <FormField label="Giải thích" hint="Hiển thị sau khi học sinh trả lời">
            <Form.Item name={["data", "explanation"]} className="mb-0">
              <TextArea rows={3} className="rounded-lg" placeholder="Giải thích tại sao câu phát biểu đúng hoặc sai..." />
            </Form.Item>
          </FormField>
          <FormField label="Kích hoạt">
            <Form.Item name="isActive" valuePropName="checked" initialValue={true} className="mb-0">
              <Switch />
            </Form.Item>
          </FormField>
        </SectionContainer>

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
  }
);

BoolAudioTextForm.displayName = "BoolAudioTextForm";

export default BoolAudioTextForm;