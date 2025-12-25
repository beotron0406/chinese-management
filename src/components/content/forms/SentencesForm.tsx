"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Tag, Space, Select, Button, Upload, message, Typography } from "antd";
import {
  SoundOutlined,
  PictureOutlined,
  EditOutlined,
  ReloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { pinyin } from "pinyin-pro";
import type { FormInstance } from "antd/es/form";
import { SentencesData } from "@/types/contentTypes";
import { uploadImageByType, uploadAudioByType, validateFile, UploadProgress } from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TTSButton from "@/components/shared/TTSButton";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { Text } = Typography;
const { TextArea } = Input;

interface SentencesFormProps {
  form: FormInstance;
  initialValues?: SentencesData;
  contentType?: string;
}

export interface SentencesFormRef {
  uploadFiles: () => Promise<boolean>;
}

type SegmentationMode = "character" | "word" | "phrase" | "long_phrase" | "manual";

const SentencesForm = forwardRef<SentencesFormRef, SentencesFormProps>(
  ({ form, initialValues, contentType = "content_sentences" }, ref) => {
    const [chineseText, setChineseText] = useState<string>("");
    const [segmentedChinese, setSegmentedChinese] = useState<string[]>([]);
    const [segmentedPinyin, setSegmentedPinyin] = useState<string[]>([]);
    const [segmentationMode, setSegmentationMode] = useState<SegmentationMode>("word");
    const [manualMode, setManualMode] = useState<boolean>(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "error" | "idle">("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrls, setUploadedUrls] = useState<{ imageUrl?: string; audioUrl?: string }>({});
    const [uploadError, setUploadError] = useState<string>("");

    const segmentChineseText = (text: string, mode: SegmentationMode = segmentationMode) => {
      if (!text.trim()) { setSegmentedChinese([]); setSegmentedPinyin([]); return; }
      let chineseSegments: string[] = [];
      let pinyinSegments: string[] = [];
      try {
        switch (mode) {
          case "character":
            chineseSegments = Array.from(text);
            pinyinSegments = chineseSegments.map((char) => (/[\u4e00-\u9fff]/.test(char) ? pinyin(char, { toneType: "symbol" }) : char));
            break;
          case "word":
            try {
              const segmentResult = pinyin(text, { toneType: "symbol", segmentit: 1 });
              if (Array.isArray(segmentResult)) { segmentResult.forEach((item: any) => { if (typeof item === "object" && item.origin && item.pinyin) { chineseSegments.push(item.origin); pinyinSegments.push(item.pinyin); } }); }
              if (chineseSegments.length === 0) { chineseSegments = text.match(/[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g) || []; pinyinSegments = chineseSegments.map((segment) => (/[\u4e00-\u9fff]/.test(segment) ? pinyin(segment, { toneType: "symbol" }) : segment)); }
            } catch { chineseSegments = text.match(/[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g) || []; pinyinSegments = chineseSegments.map((segment) => (/[\u4e00-\u9fff]/.test(segment) ? pinyin(segment, { toneType: "symbol" }) : segment)); }
            break;
          case "phrase":
            try {
              const segmentResult = pinyin(text, { toneType: "symbol", segmentit: 2 });
              if (Array.isArray(segmentResult)) { segmentResult.forEach((item: any) => { if (typeof item === "object" && item.origin && item.pinyin) { chineseSegments.push(item.origin); pinyinSegments.push(item.pinyin); } }); }
              if (chineseSegments.length === 0) { chineseSegments = text.match(/[\u4e00-\u9fff]{2,4}|[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g) || []; pinyinSegments = chineseSegments.map((segment) => (/[\u4e00-\u9fff]/.test(segment) ? pinyin(segment, { toneType: "symbol" }) : segment)); }
            } catch { chineseSegments = text.match(/[\u4e00-\u9fff]{2,4}|[\u4e00-\u9fff]|[^\u4e00-\u9fff]/g) || []; pinyinSegments = chineseSegments.map((segment) => (/[\u4e00-\u9fff]/.test(segment) ? pinyin(segment, { toneType: "symbol" }) : segment)); }
            break;
          case "long_phrase":
            try {
              const segmentResult = pinyin(text, { toneType: "symbol", segmentit: 3 });
              if (Array.isArray(segmentResult)) { segmentResult.forEach((item: any) => { if (typeof item === "object" && item.origin && item.pinyin) { chineseSegments.push(item.origin); pinyinSegments.push(item.pinyin); } }); }
              if (chineseSegments.length === 0) { chineseSegments = text.match(/[\u4e00-\u9fff]{3,6}|[\u4e00-\u9fff]{1,2}|[^\u4e00-\u9fff]/g) || []; pinyinSegments = chineseSegments.map((segment) => (/[\u4e00-\u9fff]/.test(segment) ? pinyin(segment, { toneType: "symbol" }) : segment)); }
            } catch { chineseSegments = text.match(/[\u4e00-\u9fff]{3,6}|[\u4e00-\u9fff]{1,2}|[^\u4e00-\u9fff]/g) || []; pinyinSegments = chineseSegments.map((segment) => (/[\u4e00-\u9fff]/.test(segment) ? pinyin(segment, { toneType: "symbol" }) : segment)); }
            break;
          case "manual":
            chineseSegments = text.split(";").map((s) => s.trim()).filter((s) => s);
            pinyinSegments = chineseSegments.map((segment) => (/[\u4e00-\u9fff]/.test(segment) ? pinyin(segment, { toneType: "symbol" }).replace(/\s+/g, "") : segment));
        }
        setSegmentedChinese(chineseSegments);
        setSegmentedPinyin(pinyinSegments);
        form.setFieldsValue({ data: { ...form.getFieldValue("data"), chinese_text: chineseSegments, pinyin: pinyinSegments } });
      } catch (error) {
        console.warn("Failed to segment Chinese text:", error);
        const fallbackSegments = Array.from(text);
        const fallbackPinyin = fallbackSegments.map((char) => { if (/[\u4e00-\u9fff]/.test(char)) { try { return pinyin(char, { toneType: "symbol" }); } catch { return char; } } return char; });
        setSegmentedChinese(fallbackSegments);
        setSegmentedPinyin(fallbackPinyin);
        form.setFieldsValue({ data: { ...form.getFieldValue("data"), chinese_text: fallbackSegments, pinyin: fallbackPinyin } });
      }
    };

    const handleChineseTextChange = (value: string) => { setChineseText(value); segmentChineseText(value); };
    const handleSegmentationModeChange = (mode: SegmentationMode) => { setSegmentationMode(mode); setManualMode(mode === "manual"); if (mode !== "manual" && chineseText) segmentChineseText(chineseText, mode); };

    const handleImageFileChange = async (file: File) => {
      setSelectedImageFile(file);
      const imageValidation = validateFile(file, "image", 10);
      if (!imageValidation.isValid) { message.error(imageValidation.error); return false; }
      setUploadModalVisible(true); setUploadStatus("uploading"); setUploadProgress(0); setUploadError("");
      try {
        const result = await uploadImageByType(file, contentType, (progress: UploadProgress) => { setUploadProgress(Math.round(progress.percentage)); });
        if (result.success) {
          setUploadedUrls((prev) => ({ ...prev, imageUrl: result.url }));
          form.setFieldsValue({ data: { ...form.getFieldValue("data"), picture_url: result.url } });
          setUploadStatus("success"); setUploadProgress(100); setSelectedImageFile(null);
          message.success("Tải hình ảnh lên thành công!");
        } else { throw new Error(result.error); }
      } catch (error) { console.error("Upload error:", error); setUploadStatus("error"); setUploadError(error instanceof Error ? error.message : "Upload failed"); message.error("Tải lên thất bại."); }
      return false;
    };

    const handleAudioFileChange = async (file: File) => {
      setSelectedAudioFile(file);
      const audioValidation = validateFile(file, "audio", 10);
      if (!audioValidation.isValid) { message.error(audioValidation.error); return false; }
      setUploadModalVisible(true); setUploadStatus("uploading"); setUploadProgress(0); setUploadError("");
      try {
        const result = await uploadAudioByType(file, contentType, (progress: UploadProgress) => { setUploadProgress(Math.round(progress.percentage)); });
        if (result.success) {
          setUploadedUrls((prev) => ({ ...prev, audioUrl: result.url }));
          form.setFieldsValue({ data: { ...form.getFieldValue("data"), audio_url: result.url } });
          setUploadStatus("success"); setUploadProgress(100); setSelectedAudioFile(null);
          message.success("Tải âm thanh lên thành công!");
        } else { throw new Error(result.error); }
      } catch (error) { console.error("Upload error:", error); setUploadStatus("error"); setUploadError(error instanceof Error ? error.message : "Upload failed"); message.error("Tải lên thất bại."); }
      return false;
    };

    const handleUploadFiles = async (showModal: boolean = true): Promise<boolean> => {
      if (!selectedImageFile && !selectedAudioFile) { if (uploadedUrls.imageUrl && uploadedUrls.audioUrl) return true; message.warning("Vui lòng chọn ít nhất một file để tải lên"); return false; }
      if (selectedImageFile) { const imageValidation = validateFile(selectedImageFile, "image", 10); if (!imageValidation.isValid) { message.error(imageValidation.error); return false; } }
      if (selectedAudioFile) { const audioValidation = validateFile(selectedAudioFile, "audio", 10); if (!audioValidation.isValid) { message.error(audioValidation.error); return false; } }
      if (showModal) setUploadModalVisible(true);
      setUploadStatus("uploading"); setUploadProgress(0); setUploadError("");
      try {
        const uploadPromises: Promise<any>[] = [];
        let imageUrl = uploadedUrls.imageUrl;
        let audioUrl = uploadedUrls.audioUrl;
        if (selectedImageFile) { uploadPromises.push(uploadImageByType(selectedImageFile, contentType, (progress: UploadProgress) => { setUploadProgress(Math.round(progress.percentage / 2)); })); }
        if (selectedAudioFile) { uploadPromises.push(uploadAudioByType(selectedAudioFile, contentType, (progress: UploadProgress) => { const baseProgress = selectedImageFile ? 50 : 0; const audioProgress = selectedImageFile ? progress.percentage / 2 : progress.percentage; setUploadProgress(Math.round(baseProgress + audioProgress)); })); }
        const results = await Promise.all(uploadPromises);
        let resultIndex = 0;
        if (selectedImageFile) { const imageResult = results[resultIndex++]; if (imageResult.success) imageUrl = imageResult.url; else throw new Error(`Image upload failed: ${imageResult.error}`); }
        if (selectedAudioFile) { const audioResult = results[resultIndex++]; if (audioResult.success) audioUrl = audioResult.url; else throw new Error(`Audio upload failed: ${audioResult.error}`); }
        form.setFieldsValue({ data: { ...form.getFieldValue("data"), picture_url: imageUrl, audio_url: audioUrl } });
        setUploadedUrls({ imageUrl, audioUrl }); setUploadStatus("success"); setUploadProgress(100); setSelectedImageFile(null); setSelectedAudioFile(null);
        if (showModal) message.success("Tải file lên thành công!");
        return true;
      } catch (error) { console.error("Upload error:", error); setUploadStatus("error"); setUploadError(error instanceof Error ? error.message : "Upload failed"); message.error("Tải lên thất bại."); return false; }
    };

    useImperativeHandle(ref, () => ({ uploadFiles: () => handleUploadFiles(false) }));

    const handleRemoveImage = () => { setSelectedImageFile(null); setUploadedUrls((prev) => ({ ...prev, imageUrl: undefined })); form.setFieldsValue({ data: { ...form.getFieldValue("data"), picture_url: undefined } }); };
    const handleRemoveAudio = () => { setSelectedAudioFile(null); setUploadedUrls((prev) => ({ ...prev, audioUrl: undefined })); form.setFieldsValue({ data: { ...form.getFieldValue("data"), audio_url: undefined } }); };

    useEffect(() => {
      if (initialValues) {
        setChineseText(initialValues.chinese_text?.join("") || "");
        setSegmentedChinese(initialValues.chinese_text || []);
        setSegmentedPinyin(initialValues.pinyin || []);
        if (initialValues.picture_url) setUploadedUrls((prev) => ({ ...prev, imageUrl: initialValues.picture_url }));
        if (initialValues.audio_url) setUploadedUrls((prev) => ({ ...prev, audioUrl: initialValues.audio_url }));
      }
    }, [initialValues]);

    return (
      <div className="max-w-2xl mx-auto">
        {/* Section 1: Chinese Sentence */}
        <SectionContainer>
          <SectionHeader step={1} title="Câu Tiếng Trung" description="Nhập và cấu hình phân đoạn" icon={<FileTextOutlined />} />
          <FormField label="Câu tiếng Trung" required>
            <Form.Item name={["data", "chinese_sentence_input"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <TextArea rows={2} className="rounded-lg text-lg" onChange={(e) => handleChineseTextChange(e.target.value)} placeholder="Nhập câu tiếng Trung cần học..." />
            </Form.Item>
          </FormField>

          <FormField label="Chế độ phân đoạn" hint="Chọn cách phân chia câu thành các đoạn">
            <Space wrap>
              <Select value={segmentationMode} onChange={handleSegmentationModeChange} className="w-[180px]" size="large">
                <Select.Option value="character">Ký Tự (这 家 饭 店)</Select.Option>
                <Select.Option value="word">Từ (这 家 饭 店)</Select.Option>
                <Select.Option value="phrase">Cụm Từ (这家 饭店)</Select.Option>
                <Select.Option value="long_phrase">Cụm Từ Dài (这家饭店)</Select.Option>
                <Select.Option value="manual">Thủ Công</Select.Option>
              </Select>
              {segmentationMode !== "manual" && chineseText && (
                <Button icon={<ReloadOutlined />} onClick={() => segmentChineseText(chineseText, segmentationMode)} className="rounded-lg">
                  Phân Đoạn Lại
                </Button>
              )}
            </Space>
          </FormField>

          {manualMode && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-4">
              <Space>
                <EditOutlined className="text-blue-500 text-lg" />
                <div>
                  <Text strong className="text-blue-700">Chế Độ Thủ Công Đã Kích Hoạt</Text>
                  <Text type="secondary" className="block text-sm">Sử dụng dấu chấm phẩy (;) để xác định thủ công các đoạn.</Text>
                  <Text type="secondary" className="text-xs">VD: "这家饭店;怎么样;？" → ["这家饭店", "怎么样", "？"]</Text>
                </div>
              </Space>
            </div>
          )}

          {segmentedChinese.length > 0 && (
            <div className="mb-4">
              <Text strong className="text-gray-700 mb-2 block">Tiếng Trung Tự Động Phân Đoạn:</Text>
              <div className="p-4 bg-gray-50 rounded-xl">
                <Space wrap>{segmentedChinese.map((segment, index) => (<Tag key={index} color="blue" className="text-base py-1 px-3 rounded-lg">{segment}</Tag>))}</Space>
              </div>
            </div>
          )}

          {segmentedPinyin.length > 0 && (
            <div className="mb-4">
              <Text strong className="text-gray-700 mb-2 block">Pinyin Tự Động Tạo:</Text>
              <div className="p-4 bg-gray-50 rounded-xl">
                <Space wrap>{segmentedPinyin.map((segment, index) => (<Tag key={index} color="green" className="text-sm py-1 px-3 rounded-lg">{segment}</Tag>))}</Space>
              </div>
            </div>
          )}
          <Form.Item name={["data", "chinese_text"]} className="hidden"><Input /></Form.Item>
          <Form.Item name={["data", "pinyin"]} className="hidden"><Input /></Form.Item>
        </SectionContainer>

        {/* Section 2: Additional Info */}
        <SectionContainer>
          <SectionHeader step={2} title="Thông Tin Bổ Sung" description="Giải thích và ghi chú" icon={<InfoCircleOutlined />} />
          <FormField label="Giải thích" required>
            <Form.Item name={["data", "explaination"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <TextArea rows={2} className="rounded-lg" placeholder="Nhập giải thích về câu..." />
            </Form.Item>
          </FormField>
          <FormField label="Thông tin bổ sung" hint="Tùy chọn">
            <Form.Item name={["data", "additional_info"]} className="mb-0">
              <TextArea rows={3} className="rounded-lg" placeholder="Ghi chú, ngữ pháp, văn hóa liên quan..." />
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 3: Image */}
        <SectionContainer>
          <SectionHeader step={3} title="Hình Ảnh Minh Họa" description="Tải lên hình ảnh cho câu" icon={<PictureOutlined />} />
          <FormField label="File hình ảnh" required>
            <Form.Item name={["data", "picture_url"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                <Upload accept="image/*" maxCount={1} showUploadList={false} beforeUpload={(file) => { handleImageFileChange(file); return false; }}>
                  <Button icon={<UploadOutlined />} size="large" className="rounded-lg">{selectedImageFile ? selectedImageFile.name : "Chọn Hình Ảnh"}</Button>
                </Upload>
                {uploadedUrls.imageUrl && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <PictureOutlined /><span className="text-sm font-medium">Đã tải lên</span>
                      <Button size="small" icon={<DeleteOutlined />} onClick={handleRemoveImage} type="text" danger>Xóa</Button>
                    </div>
                    <img src={uploadedUrls.imageUrl} alt="Preview" className="max-w-[150px] max-h-[150px] object-cover rounded-lg border" />
                  </div>
                )}
              </div>
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 4: Audio */}
        <SectionContainer>
          <SectionHeader step={4} title="File Âm Thanh" description="Tải lên hoặc tạo audio" icon={<SoundOutlined />} />
          <FormField label="File âm thanh" required>
            <Form.Item name={["data", "audio_url"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                <Space wrap>
                  <Upload accept="audio/*" maxCount={1} showUploadList={false} beforeUpload={(file) => { handleAudioFileChange(file); return false; }}>
                    <Button icon={<UploadOutlined />} size="large" className="rounded-lg">{selectedAudioFile ? selectedAudioFile.name : "Chọn Âm Thanh"}</Button>
                  </Upload>
                  <TTSButton
                    text={chineseText}
                    buttonText="Tạo Giọng Nói"
                    onAudioGenerated={async (audioUrl, audioBlob) => {
                      try {
                        setUploadModalVisible(true); setUploadStatus("uploading"); setUploadProgress(0); setUploadError("");
                        const filename = `tts_generated_${Date.now()}.wav`;
                        const file = new File([audioBlob], filename, { type: "audio/wav" });
                        const result = await uploadAudioByType(file, contentType, (progress: UploadProgress) => { setUploadProgress(Math.round(progress.percentage)); });
                        if (result.success) {
                          setUploadedUrls((prev) => ({ ...prev, audioUrl: result.url }));
                          form.setFieldsValue({ data: { ...form.getFieldValue("data"), audio_url: result.url } });
                          setUploadStatus("success"); setUploadProgress(100);
                          message.success("Tạo và tải lên giọng nói thành công!");
                        } else { throw new Error(result.error); }
                      } catch (error) { console.error("TTS Upload error:", error); setUploadStatus("error"); setUploadError(error instanceof Error ? error.message : "Upload failed"); message.error("Lỗi khi tải lên giọng nói"); }
                    }}
                  />
                </Space>
                {uploadedUrls.audioUrl && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <SoundOutlined /><span className="text-sm font-medium">Đã tải lên</span>
                      <Button size="small" icon={<DeleteOutlined />} onClick={handleRemoveAudio} type="text" danger>Xóa</Button>
                    </div>
                    <audio controls className="w-full"><source src={uploadedUrls.audioUrl} /></audio>
                  </div>
                )}
              </div>
            </Form.Item>
          </FormField>
        </SectionContainer>

        <UploadModal visible={uploadModalVisible} onCancel={() => setUploadModalVisible(false)} uploadStatus={uploadStatus} uploadProgress={uploadProgress} uploadedUrls={{ imageUrl: uploadedUrls.imageUrl, audioUrl: uploadedUrls.audioUrl }} errorMessage={uploadError} fileNames={{ imageName: selectedImageFile?.name, audioName: selectedAudioFile?.name }} />
      </div>
    );
  }
);

SentencesForm.displayName = "SentencesForm";

export default SentencesForm;
