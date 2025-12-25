"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Upload,
  Button,
  message,
  Space,
  Select,
  Typography,
  Switch,
} from "antd";
import {
  SoundOutlined,
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  QuestionCircleOutlined,
  LinkOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { MatchingAudioImageQuestionData } from "@/types/questionType";
import { uploadAudioByType, uploadImageByType, validateFile, UploadProgress } from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TTSButton from "@/components/shared/TTSButton";
import { SectionContainer, SectionHeader, FormField } from "@/components/shared/FormStyles";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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

const MatchingAudioImageForm = forwardRef<MatchingAudioImageFormRef, MatchingAudioImageFormProps>(
  ({ form, initialValues, questionType = "question_matching_audio_image" }, ref) => {
    const [leftAudioUploads, setLeftAudioUploads] = useState<{ [key: number]: { file: File | null; uploadedUrl?: string } }>({});
    const [rightImageUploads, setRightImageUploads] = useState<{ [key: number]: { file: File | null; uploadedUrl?: string } }>({});
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "error" | "idle">("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string>("");
    const [leftItems, setLeftItems] = useState<MatchingAudioImageQuestionData["leftColumn"]>([]);
    const [rightItems, setRightItems] = useState<MatchingAudioImageQuestionData["rightColumn"]>([]);

    const leftValues = Form.useWatch(["data", "leftColumn"], form) || [];
    const rightValues = Form.useWatch(["data", "rightColumn"], form) || [];
    const correctMatches = Form.useWatch(["data", "correctMatches"], form) || [];

    const generateRightId = (index: number): string => String.fromCharCode(65 + index);

    useEffect(() => {
      if (initialValues?.data) {
        const { data } = initialValues;
        if (data.leftColumn) {
          setLeftItems(data.leftColumn);
          const audioUploads: typeof leftAudioUploads = {};
          data.leftColumn.forEach((item, index) => { if (item.audio || item.audio_url) audioUploads[index] = { file: null, uploadedUrl: item.audio_url || item.audio }; });
          setLeftAudioUploads(audioUploads);
        }
        if (data.rightColumn) {
          setRightItems(data.rightColumn);
          const imageUploads: typeof rightImageUploads = {};
          data.rightColumn.forEach((item, index) => { if (item.image) imageUploads[index] = { file: null, uploadedUrl: item.image }; });
          setRightImageUploads(imageUploads);
        }
      }
    }, [initialValues]);

    useEffect(() => {
      const updatedLeftItems = leftValues.map((item: any, index: number) => ({ id: item?.id || `${index + 1}`, audio: item?.audio || "", audio_url: item?.audio_url || item?.audio || "", transcript: item?.transcript || "" })).filter((item: any) => item.transcript || item.audio || item.audio_url);
      setLeftItems(updatedLeftItems);
    }, [leftValues]);

    useEffect(() => {
      const updatedRightItems = rightValues.map((item: any, index: number) => ({ id: item?.id || generateRightId(index), image: item?.image || "", alt: item?.alt || "" })).filter((item: any) => item.image || item.alt);
      setRightItems(updatedRightItems);
    }, [rightValues]);

    const handleLeftAudioChange = async (itemIndex: number, file: File | null) => {
      if (!file) return false;
      const audioValidation = validateFile(file, "audio", 10);
      if (!audioValidation.isValid) { message.error(audioValidation.error); return false; }
      setLeftAudioUploads((prev) => ({ ...prev, [itemIndex]: { file, uploadedUrl: prev[itemIndex]?.uploadedUrl } }));
      setUploadModalVisible(true);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setUploadError("");
      try {
        const result = await uploadAudioByType(file, questionType, (progress: UploadProgress) => { setUploadProgress(Math.round(progress.percentage)); });
        if (result.success && result.url) {
          setLeftAudioUploads((prev) => ({ ...prev, [itemIndex]: { file: null, uploadedUrl: result.url } }));
          const leftItems = form.getFieldValue(["data", "leftColumn"]) || [];
          leftItems[itemIndex] = { ...leftItems[itemIndex], audio: result.url, audio_url: result.url };
          form.setFieldsValue({ data: { ...form.getFieldValue("data"), leftColumn: leftItems } });
          setUploadStatus("success");
          setUploadProgress(100);
          message.success("Tải âm thanh lên thành công!");
        } else { throw new Error(result.error || "Upload failed"); }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(error instanceof Error ? error.message : "Upload failed");
        message.error("Tải lên thất bại.");
      }
      return false;
    };

    const handleRemoveLeftAudio = (itemIndex: number) => {
      setLeftAudioUploads((prev) => ({ ...prev, [itemIndex]: { file: null, uploadedUrl: undefined } }));
      const leftItems = form.getFieldValue(["data", "leftColumn"]) || [];
      if (leftItems[itemIndex]) { leftItems[itemIndex] = { ...leftItems[itemIndex], audio: "", audio_url: "" }; form.setFieldsValue({ data: { ...form.getFieldValue("data"), leftColumn: leftItems } }); }
    };

    const handleRightImageChange = async (itemIndex: number, file: File | null) => {
      if (!file) return false;
      const imageValidation = validateFile(file, "image", 10);
      if (!imageValidation.isValid) { message.error(imageValidation.error); return false; }
      setRightImageUploads((prev) => ({ ...prev, [itemIndex]: { file, uploadedUrl: prev[itemIndex]?.uploadedUrl } }));
      setUploadModalVisible(true);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setUploadError("");
      try {
        const result = await uploadImageByType(file, questionType, (progress: UploadProgress) => { setUploadProgress(Math.round(progress.percentage)); });
        if (result.success && result.url) {
          setRightImageUploads((prev) => ({ ...prev, [itemIndex]: { file: null, uploadedUrl: result.url } }));
          const rightItems = form.getFieldValue(["data", "rightColumn"]) || [];
          rightItems[itemIndex] = { ...rightItems[itemIndex], image: result.url };
          form.setFieldsValue({ data: { ...form.getFieldValue("data"), rightColumn: rightItems } });
          setUploadStatus("success");
          setUploadProgress(100);
          message.success("Tải hình ảnh lên thành công!");
        } else { throw new Error(result.error || "Upload failed"); }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(error instanceof Error ? error.message : "Upload failed");
        message.error("Tải lên thất bại.");
      }
      return false;
    };

    const handleRemoveRightImage = (itemIndex: number) => {
      setRightImageUploads((prev) => ({ ...prev, [itemIndex]: { file: null, uploadedUrl: undefined } }));
      const rightItems = form.getFieldValue(["data", "rightColumn"]) || [];
      if (rightItems[itemIndex]) { rightItems[itemIndex] = { ...rightItems[itemIndex], image: "" }; form.setFieldsValue({ data: { ...form.getFieldValue("data"), rightColumn: rightItems } }); }
    };

    const handleRightAltTextChange = (itemIndex: number, value: string) => {
      const rightItems = form.getFieldValue(["data", "rightColumn"]) || [];
      if (rightItems[itemIndex]) { rightItems[itemIndex] = { ...rightItems[itemIndex], alt: value }; form.setFieldsValue({ data: { ...form.getFieldValue("data"), rightColumn: rightItems } }); }
    };

    const handleUploadAllFiles = async (showModal: boolean = true): Promise<boolean> => {
      const leftAudiosToUpload = Object.entries(leftAudioUploads).filter(([_, upload]) => upload.file && !upload.uploadedUrl);
      const rightImagesToUpload = Object.entries(rightImageUploads).filter(([_, upload]) => upload.file && !upload.uploadedUrl);
      if (leftAudiosToUpload.length === 0 && rightImagesToUpload.length === 0) {
        const leftItems = form.getFieldValue(["data", "leftColumn"]) || [];
        const rightItems = form.getFieldValue(["data", "rightColumn"]) || [];
        const allLeftItemsHaveAudios = leftItems.length > 0 && leftItems.every((item: any, index: number) => item && (item.audio || item.audio_url || leftAudioUploads[index]?.uploadedUrl));
        const allRightItemsHaveImages = rightItems.length > 0 && rightItems.every((item: any, index: number) => item && (item.image || rightImageUploads[index]?.uploadedUrl));
        if (allLeftItemsHaveAudios && allRightItemsHaveImages) return true;
        message.warning("Vui lòng chọn và tải lên tất cả file yêu cầu");
        return false;
      }
      for (const [index, upload] of leftAudiosToUpload) {
        if (upload.file) { const audioValidation = validateFile(upload.file, "audio", 10); if (!audioValidation.isValid) { message.error(`Audio ${parseInt(index) + 1}: ${audioValidation.error}`); return false; } }
      }
      for (const [index, upload] of rightImagesToUpload) {
        if (upload.file) { const imageValidation = validateFile(upload.file, "image", 10); if (!imageValidation.isValid) { message.error(`Hình ${parseInt(index) + 1}: ${imageValidation.error}`); return false; } }
      }
      if (showModal) setUploadModalVisible(true);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setUploadError("");
      try {
        const uploadPromises: Promise<any>[] = [];
        const totalFiles = leftAudiosToUpload.length + rightImagesToUpload.length;
        let completedFiles = 0;
        for (const [index, upload] of leftAudiosToUpload) {
          if (upload.file) {
            const audioPromise = uploadAudioByType(upload.file, questionType, (progress: UploadProgress) => { const fileProgress = progress.percentage / totalFiles; setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress)); }).then((result) => ({ type: "left_audio", index: parseInt(index), result }));
            uploadPromises.push(audioPromise);
          }
        }
        for (const [index, upload] of rightImagesToUpload) {
          if (upload.file) {
            const imagePromise = uploadImageByType(upload.file, questionType, (progress: UploadProgress) => { const fileProgress = progress.percentage / totalFiles; setUploadProgress(Math.round((completedFiles / totalFiles) * 100 + fileProgress)); }).then((result) => ({ type: "right_image", index: parseInt(index), result }));
            uploadPromises.push(imagePromise);
          }
        }
        const results = await Promise.all(uploadPromises);
        const newLeftAudioUploads = { ...leftAudioUploads };
        const newRightImageUploads = { ...rightImageUploads };
        const leftItems = form.getFieldValue(["data", "leftColumn"]) || [];
        const rightItems = form.getFieldValue(["data", "rightColumn"]) || [];
        for (const item of results) {
          if (item.type === "left_audio") {
            if (item.result.success && item.result.url) { newLeftAudioUploads[item.index] = { file: null, uploadedUrl: item.result.url }; leftItems[item.index] = { ...leftItems[item.index], audio: item.result.url, audio_url: item.result.url }; }
            else { throw new Error(`Audio ${item.index + 1} upload failed: ${item.result.error}`); }
          } else if (item.type === "right_image") {
            if (item.result.success && item.result.url) { newRightImageUploads[item.index] = { file: null, uploadedUrl: item.result.url }; rightItems[item.index] = { ...rightItems[item.index], image: item.result.url }; }
            else { throw new Error(`Hình ${item.index + 1} upload failed: ${item.result.error}`); }
          }
          completedFiles++;
        }
        setLeftAudioUploads(newLeftAudioUploads);
        setRightImageUploads(newRightImageUploads);
        form.setFieldsValue({ data: { ...form.getFieldValue("data"), leftColumn: leftItems, rightColumn: rightItems } });
        setUploadStatus("success");
        setUploadProgress(100);
        if (showModal) message.success("Tất cả file đã tải lên thành công!");
        return true;
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(error instanceof Error ? error.message : "Upload failed");
        message.error("Tải lên thất bại.");
        return false;
      }
    };

    useImperativeHandle(ref, () => ({ uploadFiles: () => handleUploadAllFiles(false) }));

    return (
      <div className="max-w-2xl mx-auto">
        {/* Section 1: Question Setup */}
        <SectionContainer>
          <SectionHeader step={1} title="Thiết Lập Câu Hỏi" description="Nhập hướng dẫn cho học viên" icon={<QuestionCircleOutlined />} />
          <FormField label="Hướng dẫn câu hỏi" required>
            <Form.Item name={["data", "instruction"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
              <TextArea rows={2} className="rounded-lg" placeholder="VD: Nghe audio và ghép với hình ảnh đúng" />
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 2: Left Column (Audio) */}
        <SectionContainer>
          <SectionHeader step={2} title="Cột Trái (Âm Thanh)" description="Tải lên hoặc tạo audio bằng TTS" icon={<SoundOutlined />} />
          <Form.List name={["data", "leftColumn"]} initialValue={[{ id: "1", audio: "", audio_url: "", transcript: "" }]}>
            {(fields, { add, remove }) => (
              <>
                <div className="space-y-4">
                  {fields.map(({ key, name, ...restField }, index) => {
                    const audioUpload = leftAudioUploads[index];
                    return (
                      <div key={key} className="p-4 border-2 border-gray-200 rounded-xl bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold flex items-center justify-center">{index + 1}</span>
                            <span className="text-sm font-medium text-gray-600">Mục âm thanh {index + 1}</span>
                          </div>
                          {fields.length > 1 && <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="rounded-lg" />}
                        </div>
                        <Form.Item {...restField} name={[name, "id"]} initialValue={`${index + 1}`} className="hidden"><Input /></Form.Item>
                        <Form.Item {...restField} label="File Âm Thanh" name={[name, "audio"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-2">
                          <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                            <Space wrap>
                              <Upload accept="audio/*" maxCount={1} showUploadList={false} beforeUpload={(file) => { handleLeftAudioChange(index, file); return false; }}>
                                <Button icon={<UploadOutlined />} size="large" className="rounded-lg">{audioUpload?.file ? audioUpload.file.name : "Chọn Âm Thanh"}</Button>
                              </Upload>
                              <TTSButton
                                text={form.getFieldValue(["data", "leftColumn", index, "transcript"]) || ""}
                                buttonText="Tạo Giọng Nói"
                                size="middle"
                                onAudioGenerated={async (audioUrl, audioBlob) => {
                                  try {
                                    setUploadModalVisible(true); setUploadStatus("uploading"); setUploadProgress(0); setUploadError("");
                                    const filename = `tts_generated_${Date.now()}.wav`;
                                    const file = new File([audioBlob], filename, { type: "audio/wav" });
                                    const result = await uploadAudioByType(file, questionType, (progress: UploadProgress) => { setUploadProgress(Math.round(progress.percentage)); });
                                    if (result.success && result.url) {
                                      setLeftAudioUploads((prev) => ({ ...prev, [index]: { file: null, uploadedUrl: result.url } }));
                                      const leftItems = form.getFieldValue(["data", "leftColumn"]) || [];
                                      leftItems[index] = { ...leftItems[index], audio: result.url, audio_url: result.url };
                                      form.setFieldsValue({ data: { ...form.getFieldValue("data"), leftColumn: leftItems } });
                                      setUploadStatus("success"); setUploadProgress(100);
                                      message.success("Tạo và tải lên giọng nói thành công!");
                                    } else { throw new Error(result.error || "Upload failed"); }
                                  } catch (error) { console.error("TTS Upload error:", error); setUploadStatus("error"); setUploadError(error instanceof Error ? error.message : "Upload failed"); message.error("Lỗi khi tải lên giọng nói"); }
                                }}
                              />
                            </Space>
                            {audioUpload?.uploadedUrl && (
                              <div className="mt-4">
                                <div className="flex items-center gap-2 text-green-600 mb-2">
                                  <SoundOutlined /><span className="text-sm font-medium">Đã tải lên</span>
                                  <Button size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveLeftAudio(index)} type="text" danger>Xóa</Button>
                                </div>
                                <audio controls className="max-w-[300px]"><source src={audioUpload.uploadedUrl} /></audio>
                              </div>
                            )}
                          </div>
                        </Form.Item>
                        <Form.Item {...restField} label="Bản ghi (tùy chọn)" name={[name, "transcript"]} className="mb-0">
                          <Input size="large" className="rounded-lg" placeholder="Nhập bản ghi của âm thanh" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "audio_url"]} className="hidden"><Input /></Form.Item>
                      </div>
                    );
                  })}
                </div>
                <Button type="dashed" onClick={() => add({ id: `${fields.length + 1}`, audio: "", audio_url: "", transcript: "" })} block icon={<PlusOutlined />} className="mt-4 h-10 rounded-lg">
                  Thêm Mục Âm Thanh
                </Button>
              </>
            )}
          </Form.List>
        </SectionContainer>

        {/* Section 3: Right Column (Images) */}
        <SectionContainer>
          <SectionHeader step={3} title="Cột Phải (Hình Ảnh)" description="Tải lên hình ảnh cần ghép" icon={<PictureOutlined />} />
          <Form.List name={["data", "rightColumn"]} initialValue={[{ id: "A", image: "", alt: "" }]}>
            {(fields, { add, remove }) => (
              <>
                <div className="space-y-4">
                  {fields.map(({ key, name, ...restField }, index) => {
                    const imageUpload = rightImageUploads[index];
                    return (
                      <div key={key} className="p-4 border-2 border-gray-200 rounded-xl bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 font-bold flex items-center justify-center">{generateRightId(index)}</span>
                            <span className="text-sm font-medium text-gray-600">Mục hình ảnh {generateRightId(index)}</span>
                          </div>
                          {fields.length > 1 && <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="rounded-lg" />}
                        </div>
                        <Form.Item {...restField} name={[name, "id"]} initialValue={generateRightId(index)} className="hidden"><Input /></Form.Item>
                        <Form.Item {...restField} label="File Hình Ảnh" name={[name, "image"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-2">
                          <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                            <Upload accept="image/*" maxCount={1} showUploadList={false} beforeUpload={(file) => { handleRightImageChange(index, file); return false; }} disabled={!!imageUpload?.uploadedUrl}>
                              <Button icon={<UploadOutlined />} size="large" className="rounded-lg" disabled={!!imageUpload?.uploadedUrl}>{imageUpload?.file ? imageUpload.file.name : "Chọn Hình Ảnh"}</Button>
                            </Upload>
                            {imageUpload?.uploadedUrl && (
                              <div className="mt-4">
                                <div className="flex items-center gap-2 text-green-600 mb-2">
                                  <PictureOutlined /><span className="text-sm font-medium">Đã tải lên</span>
                                  <Button size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveRightImage(index)} type="text" danger>Xóa</Button>
                                </div>
                                <img src={imageUpload.uploadedUrl} alt={`Right item ${index + 1}`} className="max-w-[200px] max-h-[200px] object-cover rounded-lg border" />
                              </div>
                            )}
                          </div>
                        </Form.Item>
                        <Form.Item {...restField} label="Văn bản thay thế" name={[name, "alt"]} className="mb-0">
                          <Input size="large" className="rounded-lg" placeholder="Mô tả hình ảnh" onChange={(e) => handleRightAltTextChange(index, e.target.value)} />
                        </Form.Item>
                      </div>
                    );
                  })}
                </div>
                <Button type="dashed" onClick={() => add({ id: generateRightId(fields.length), image: "", alt: "" })} block icon={<PlusOutlined />} className="mt-4 h-10 rounded-lg">
                  Thêm Mục Hình Ảnh
                </Button>
              </>
            )}
          </Form.List>
        </SectionContainer>

        {/* Section 4: Correct Matches */}
        <SectionContainer>
          <SectionHeader step={4} title="Các Cặp Đúng" description="Chọn các cặp ghép đúng" icon={<LinkOutlined />} />
          <Form.List name={["data", "correctMatches"]} initialValue={[{ left: "", right: "" }]}>
            {(fields, { add, remove }) => (
              <>
                <div className="space-y-3">
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Text strong className="text-gray-600 w-16">Cặp {index + 1}:</Text>
                      <Form.Item {...restField} name={[name, "left"]} rules={[{ required: true, message: "Chọn" }]} className="mb-0 flex-1">
                        <Select placeholder="Chọn mục âm thanh" size="large" className="rounded-lg">
                          {leftItems.map((item, itemIndex) => (<Option key={`left-option-${item.id}-${itemIndex}`} value={item.id}>{item.id}: {item.transcript || "File âm thanh"}</Option>))}
                        </Select>
                      </Form.Item>
                      <span className="text-gray-400">→</span>
                      <Form.Item {...restField} name={[name, "right"]} rules={[{ required: true, message: "Chọn" }]} className="mb-0 flex-1">
                        <Select placeholder="Chọn mục hình ảnh" size="large" className="rounded-lg">
                          {rightItems.map((item, itemIndex) => (<Option key={`right-option-${item.id}-${itemIndex}`} value={item.id}>{item.id}: {item.alt || "Hình ảnh"}</Option>))}
                        </Select>
                      </Form.Item>
                      {fields.length > 1 && <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="rounded-lg" />}
                    </div>
                  ))}
                </div>
                <Button type="dashed" onClick={() => add({ left: "", right: "" })} block icon={<PlusOutlined />} className="mt-4 h-10 rounded-lg">Thêm Cặp</Button>
              </>
            )}
          </Form.List>
          {correctMatches?.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Text strong className="text-blue-800">Tóm Tắt Các Cặp:</Text>
              <div className="mt-2 space-y-1">
                {correctMatches?.map((match: any, index: number) => {
                  const leftItem = leftItems.find((item) => item.id === match.left);
                  const rightItem = rightItems.find((item) => item.id === match.right);
                  if (leftItem && rightItem) return (<div key={index} className="text-blue-700">{leftItem.id}: {leftItem.transcript || "File âm thanh"} → {rightItem.id}: {rightItem.alt || "Hình ảnh"}</div>);
                  return null;
                })}
              </div>
            </div>
          )}
        </SectionContainer>

        {/* Section 5: Additional Settings */}
        <SectionContainer>
          <SectionHeader step={5} title="Cài Đặt Bổ Sung" description="Giải thích và trạng thái" icon={<CheckCircleOutlined />} />
          <FormField label="Giải thích" hint="Hiển thị sau khi học viên trả lời">
            <Form.Item name={["data", "explanation"]} className="mb-0">
              <TextArea rows={3} className="rounded-lg" placeholder="Giải thích logic ghép hoặc cung cấp ngữ cảnh thêm..." />
            </Form.Item>
          </FormField>
          <FormField label="Kích hoạt">
            <Form.Item name="isActive" valuePropName="checked" initialValue={true} className="mb-0">
              <Switch />
            </Form.Item>
          </FormField>
        </SectionContainer>

        <UploadModal visible={uploadModalVisible} onCancel={() => setUploadModalVisible(false)} uploadStatus={uploadStatus} uploadProgress={uploadProgress} uploadedUrls={{}} errorMessage={uploadError} fileNames={{}} />
      </div>
    );
  }
);

MatchingAudioImageForm.displayName = "MatchingAudioImageForm";

export default MatchingAudioImageForm;
