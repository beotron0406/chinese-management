"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Switch,
  Spin,
  message,
  Space,
  Alert,
  Upload,
  Tag,
  Typography,
} from "antd";
import { debounce } from "lodash";
import { pinyin } from "pinyin-pro";
import {
  searchWord,
  createWord,
  updateWordSense,
  deleteWordSense,
} from "@/services/wordApi";
import {
  Word,
  WordFormData,
  WordSense,
  WordTranslation,
} from "@/types/wordTypes";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
  PictureOutlined,
  SoundOutlined,
  BookOutlined,
  TranslationOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import {
  uploadImageByType,
  uploadAudioByType,
  validateFile,
  UploadProgress,
} from "@/utils/s3Upload";
import UploadModal from "@/components/common/UploadModal";
import TTSButton from "@/components/shared/TTSButton";

const { Option } = Select;
const { Text } = Typography;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

// Section Container with border
const SectionContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`p-6 border border-gray-200 rounded-2xl bg-white mb-6 ${className}`}>
    {children}
  </div>
);

// Section Header Component (reusable)
const SectionHeader: React.FC<{
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ step, title, description, icon }) => (
  <div className="flex items-center gap-4 mb-5">
    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-400 to-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-md text-2xl">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Bước {step}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 m-0 mt-1">{title}</h3>
      <p className="text-xs text-gray-500 m-0">{description}</p>
    </div>
  </div>
);

// Form Field Wrapper for consistent styling
const FormField: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ label, required, hint, children, action }) => (
  <div className="mb-5">
    <div className="flex justify-between items-center mb-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {action}
    </div>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

interface WordFormProps {
  wordData?: Word;
  onSuccess: () => void;
}

const WordForm: React.FC<WordFormProps> = ({ wordData, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [existingWord, setExistingWord] = useState<Word | null>(null);
  const [senseEditing, setSenseEditing] = useState<WordSense | null>(null);
  const [generatedPinyin, setGeneratedPinyin] = useState<string>("");
  const [chineseText, setChineseText] = useState<string>("");

  // Upload state
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "uploading" | "success" | "error" | "idle"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>(
    undefined
  );
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(
    undefined
  );
  const [uploadError, setUploadError] = useState<string>("");

  const isEdit = !!wordData;

  // Helper to get first translation object from sense
  const firstTranslation = (sense?: WordSense): WordTranslation | undefined => {
    return sense?.translations?.[0];
  };

  // Generate pinyin for Chinese text
  const generatePinyin = (chinese: string): string => {
    try {
      return pinyin(chinese, {
        toneType: "symbol",
        type: "array",
      }).join(" ");
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
      return "";
    }
  };

  // Auto-generate pinyin when simplified Chinese changes
  const handleSimplifiedChange = (value: string) => {
    if (!value || !value.trim()) {
      setGeneratedPinyin("");
      return;
    }

    const pinyinText = generatePinyin(value);
    setGeneratedPinyin(pinyinText);

    const currentPinyin = form.getFieldValue(["sense", "pinyin"]);
    if (!currentPinyin || currentPinyin.trim() === "") {
      form.setFieldsValue({
        sense: {
          ...form.getFieldValue("sense"),
          pinyin: pinyinText,
        },
      });
    }
  };

  // Manually regenerate pinyin
  const handleRegeneratePinyin = () => {
    const simplified = form.getFieldValue(["word", "simplified"]);
    if (!simplified || !simplified.trim()) {
      message.warning("Vui lòng nhập ký tự giản thể trước");
      return;
    }

    const pinyinText = generatePinyin(simplified);
    setGeneratedPinyin(pinyinText);

    form.setFieldsValue({
      sense: {
        ...form.getFieldValue("sense"),
        pinyin: pinyinText,
      },
    });

    message.success("Đã tạo lại Pinyin");
  };

  // Image upload handlers
  const handleImageFileChange = (file: File | null) => {
    setSelectedImageFile(file);
    return false;
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      message.warning("Vui lòng chọn file hình ảnh để tải lên");
      return;
    }

    const imageValidation = validateFile(selectedImageFile, "image", 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return;
    }

    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadImageByType(
        selectedImageFile,
        "word",
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedImageUrl(result.url);
        form.setFieldsValue({
          sense: {
            ...form.getFieldValue("sense"),
            imageUrl: result.url,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedImageFile(null);
        message.success("Tải hình ảnh lên thành công!");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(
        error instanceof Error ? error.message : "Tải lên thất bại"
      );
      message.error("Tải lên thất bại. Vui lòng thử lại.");
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setUploadedImageUrl(undefined);
    form.setFieldsValue({
      sense: {
        ...form.getFieldValue("sense"),
        imageUrl: null,
      },
    });
  };

  // Audio upload handlers
  const handleAudioFileChange = (file: File | null) => {
    setSelectedAudioFile(file);
    return false;
  };

  const handleUploadAudio = async () => {
    if (!selectedAudioFile) {
      message.warning("Vui lòng chọn file âm thanh để tải lên");
      return;
    }

    const audioValidation = validateFile(selectedAudioFile, "audio", 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return;
    }

    setUploadModalVisible(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      const result = await uploadAudioByType(
        selectedAudioFile,
        "word",
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          sense: {
            ...form.getFieldValue("sense"),
            audioUrl: result.url,
          },
        });
        setUploadStatus("success");
        setUploadProgress(100);
        setSelectedAudioFile(null);
        message.success("Tải âm thanh lên thành công!");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setUploadError(
        error instanceof Error ? error.message : "Tải lên thất bại"
      );
      message.error("Tải lên thất bại. Vui lòng thử lại.");
    }
  };

  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedAudioUrl(undefined);
    form.setFieldsValue({
      sense: {
        ...form.getFieldValue("sense"),
        audioUrl: null,
      },
    });
  };

  // Initialize form with existing data if editing
  useEffect(() => {
    if (wordData) {
      setExistingWord(wordData);

      const primarySense =
        wordData.senses?.find((sense) => sense.isPrimary) ||
        wordData.senses?.[0];
      if (primarySense) {
        setSenseEditing(primarySense);
        const t = firstTranslation(primarySense);

        if (primarySense.pinyin) {
          setGeneratedPinyin(primarySense.pinyin);
        }

        if (primarySense.imageUrl) {
          setUploadedImageUrl(primarySense.imageUrl);
        }
        if (primarySense.audioUrl) {
          setUploadedAudioUrl(primarySense.audioUrl);
        }

        form.setFieldsValue({
          word: {
            simplified: wordData.simplified,
            traditional: wordData.traditional || "",
          },
          sense: {
            pinyin: primarySense.pinyin,
            partOfSpeech: primarySense.partOfSpeech || "",
            hskLevel: primarySense.hskLevel || undefined,
            isPrimary: primarySense.isPrimary || false,
            imageUrl: primarySense.imageUrl || "",
            audioUrl: primarySense.audioUrl || "",
          },
          translation: {
            language: t?.language || "vn",
            translation: t?.translation || "",
            additionalDetail: t?.additionalDetail || "",
          },
        });
      }
    } else {
      form.resetFields();
      setSelectedImageFile(null);
      setSelectedAudioFile(null);
      setUploadedImageUrl(undefined);
      setUploadedAudioUrl(undefined);
      setGeneratedPinyin("");
    }
  }, [wordData, form]);

  // Search for existing word when simplified character is entered
  const handleSimplifiedSearch = debounce(async (value: string) => {
    if (!value || value.length < 1) {
      setExistingWord(null);
      return;
    }

    if (isEdit) return;

    try {
      setSearchLoading(true);
      const response = await searchWord(value);
      if (response.exists && response.word) {
        setExistingWord(response.word);
        message.info(`Từ "${value}" đã tồn tại. Bạn có thể thêm nghĩa mới.`);
      } else {
        setExistingWord(null);
      }
    } catch (error) {
      console.error("Error searching word:", error);
    } finally {
      setSearchLoading(false);
    }
  }, 500);

  // Combined handler for simplified input
  const handleSimplifiedInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setChineseText(value);
    handleSimplifiedChange(value);
    handleSimplifiedSearch(value);
  };

  // Handle TTS audio generated
  const handleTTSGenerated = async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const file = new File([blob], `tts_${Date.now()}.wav`, {
        type: "audio/wav",
      });

      setSelectedAudioFile(file);
      message.success("Đã tạo âm thanh TTS. Nhấn Tải lên để lưu.");
    } catch (error) {
      console.error("Error converting TTS audio:", error);
      message.error("Không thể xử lý âm thanh TTS");
    }
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      const formData: WordFormData = {
        wordId: existingWord?.id,
        word: values.word,
        sense: {
          ...values.sense,
          imageUrl: uploadedImageUrl || values.sense.imageUrl || null,
          audioUrl: uploadedAudioUrl || values.sense.audioUrl || null,
        },
        translation: values.translation,
      };

      if (isEdit && senseEditing?.id) {
        await updateWordSense(senseEditing.id, formData);
        message.success("Cập nhật từ vựng thành công");
      } else {
        await createWord(formData);
        message.success("Tạo từ vựng thành công");
      }

      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("Không thể lưu từ vựng");
    } finally {
      setLoading(false);
    }
  };

  // Handle sense deletion
  const handleDeleteSense = async (sense: WordSense) => {
    if (!sense.id) return;

    try {
      await deleteWordSense(sense.id);
      message.success("Xóa nghĩa thành công");
      onSuccess();
    } catch (error) {
      console.error("Error deleting sense:", error);
      message.error("Không thể xóa nghĩa");
    }
  };

  // Change active sense in edit mode
  const handleSenseChange = (senseId: number) => {
    if (!wordData || !wordData.senses) return;

    const sense = wordData.senses.find((s) => s.id === senseId);
    if (sense) {
      setSenseEditing(sense);
      const t = firstTranslation(sense);

      if (sense.pinyin) {
        setGeneratedPinyin(sense.pinyin);
      }

      setUploadedImageUrl(sense.imageUrl || undefined);
      setUploadedAudioUrl(sense.audioUrl || undefined);

      form.setFieldsValue({
        sense: {
          pinyin: sense.pinyin,
          partOfSpeech: sense.partOfSpeech || "",
          hskLevel: sense.hskLevel || undefined,
          isPrimary: sense.isPrimary || false,
          imageUrl: sense.imageUrl || "",
          audioUrl: sense.audioUrl || "",
        },
        translation: {
          language: t?.language || "vn",
          translation: t?.translation || "",
          additionalDetail: t?.additionalDetail || "",
        },
      });
    }
  };

  // Parts of speech options
  const partOfSpeechOptions = [
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
    "measure word",
  ].map((pos) => ({ label: pos, value: pos }));

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        className="max-w-2xl mx-auto"
      >
        {/* Form Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 m-0">
            {isEdit ? 'Chỉnh Sửa Từ Vựng' : 'Tạo Từ Vựng Mới'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Điền thông tin theo các bước bên dưới</p>
        </div>

        {/* Alert for existing word */}
        {existingWord && !isEdit && (
          <Alert
            message="Từ đã tồn tại"
            description="Từ này đã có trong cơ sở dữ liệu. Bạn có thể thêm nghĩa mới cho nó."
            type="info"
            showIcon
            className="mb-6 rounded-lg"
          />
        )}

        {/* Section 1: Word Info */}
        <SectionContainer>
          <SectionHeader
            step={1}
            title="Thông Tin Từ Vựng"
            description="Nhập chữ Hán và các thông tin cơ bản"
            icon={<BookOutlined />}
          />

          <FormField label="Chữ Giản Thể" required>
            <Form.Item
              name={["word", "simplified"]}
              rules={[{ required: true, message: "Bắt buộc" }]}
              className="mb-0"
            >
              <Input
                onChange={handleSimplifiedInput}
                disabled={isEdit || !!existingWord}
                suffix={searchLoading ? <Spin size="small" /> : null}
                placeholder="Ví dụ: 你好"
                size="large"
                className="rounded-lg text-xl"
              />
            </Form.Item>
            {generatedPinyin && (
              <div className="mt-2">
                <Tag color="blue">Pinyin: {generatedPinyin}</Tag>
              </div>
            )}
          </FormField>

          <FormField label="Chữ Phồn Thể" hint="Tùy chọn, để trống nếu không áp dụng">
            <Form.Item name={["word", "traditional"]} className="mb-0">
              <Input
                disabled={isEdit || !!existingWord}
                placeholder="Ví dụ: 你好"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Section 2: Sense Info */}
        <SectionContainer>
          <SectionHeader
            step={2}
            title="Thông Tin Nghĩa"
            description="Pinyin, loại từ và cấp độ HSK"
            icon={<TranslationOutlined />}
          />

          {/* Sense selector for edit mode */}
          {isEdit && wordData?.senses && wordData.senses.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <Text className="text-sm text-gray-600 block mb-2">Chọn nghĩa để chỉnh sửa:</Text>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={senseEditing?.id}
                  onChange={handleSenseChange}
                  className="flex-1"
                  size="large"
                >
                  {wordData.senses.map((sense) => {
                    const t = firstTranslation(sense);
                    return (
                      <Option key={sense.id} value={sense.id}>
                        Nghĩa {sense.senseNumber}: {sense.pinyin} - {t?.translation || ""}
                      </Option>
                    );
                  })}
                </Select>

                {wordData.senses.length > 1 && senseEditing?.id && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteSense(senseEditing)}
                    size="large"
                  >
                    Xóa
                  </Button>
                )}

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSenseEditing(null);
                    form.resetFields(["sense", "translation"]);
                    setGeneratedPinyin("");
                    setUploadedImageUrl(undefined);
                    setUploadedAudioUrl(undefined);
                    setSelectedImageFile(null);
                    setSelectedAudioFile(null);
                    form.setFieldsValue({
                      sense: { isPrimary: false },
                      translation: { language: "vn" },
                    });
                  }}
                  size="large"
                >
                  Thêm Nghĩa
                </Button>
              </div>
            </div>
          )}

          <FormField
            label="Pinyin"
            required
            action={
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRegeneratePinyin}
              >
                Tạo lại
              </Button>
            }
          >
            <Form.Item
              name={["sense", "pinyin"]}
              rules={[{ required: true, message: "Bắt buộc" }]}
              className="mb-0"
            >
              <Input placeholder="Ví dụ: nǐ hǎo" size="large" className="rounded-lg" />
            </Form.Item>
          </FormField>

          <div className="flex gap-4">
            <div className="flex-1">
              <FormField label="Loại Từ">
                <Form.Item name={["sense", "partOfSpeech"]} className="mb-0">
                  <Select
                    options={partOfSpeechOptions}
                    allowClear
                    showSearch
                    placeholder="Chọn loại từ"
                    size="large"
                    className="w-full"
                  />
                </Form.Item>
              </FormField>
            </div>
            <div className="w-28">
              <FormField label="HSK">
                <Form.Item name={["sense", "hskLevel"]} className="mb-0">
                  <InputNumber min={1} max={9} className="w-full" placeholder="1-9" size="large" />
                </Form.Item>
              </FormField>
            </div>
            <div className="w-28">
              <FormField label="Nghĩa chính?">
                <Form.Item name={["sense", "isPrimary"]} valuePropName="checked" className="mb-0">
                  <Switch className="mt-2" />
                </Form.Item>
              </FormField>
            </div>
          </div>
        </SectionContainer>

        {/* Section 3: Media */}
        <SectionContainer>
          <SectionHeader
            step={3}
            title="Tài Nguyên Đa Phương Tiện"
            description="Hình ảnh minh họa và âm thanh phát âm"
            icon={<FileImageOutlined />}
          />

          {/* Hidden fields for URLs */}
          <Form.Item name={["sense", "imageUrl"]} hidden><Input /></Form.Item>
          <Form.Item name={["sense", "audioUrl"]} hidden><Input /></Form.Item>

          {/* Image Upload */}
          <FormField label="Hình ảnh minh họa">
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageFileChange(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} size="large" className="rounded-lg">
                  {selectedImageFile ? selectedImageFile.name : "Chọn Hình Ảnh"}
                </Button>
              </Upload>

              {uploadedImageUrl && (
                <div className="mt-4 flex items-start gap-4">
                  <img
                    src={uploadedImageUrl}
                    alt="Word"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-green-600">
                      <PictureOutlined />
                      <span className="text-sm font-medium">Đã tải lên</span>
                    </div>
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                      type="text"
                      danger
                      className="mt-1"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              )}

              {DEV_MODE && selectedImageFile && !uploadedImageUrl && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleUploadImage}
                  loading={uploadStatus === "uploading"}
                  className="mt-3 rounded-lg"
                >
                  Tải lên S3
                </Button>
              )}
            </div>
          </FormField>

          {/* Audio Upload */}
          <FormField label="Âm thanh phát âm">
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
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
                  <Button icon={<UploadOutlined />} size="large" className="rounded-lg">
                    {selectedAudioFile ? selectedAudioFile.name : "Chọn Âm Thanh"}
                  </Button>
                </Upload>

                <TTSButton
                  text={chineseText || form.getFieldValue(["word", "simplified"])}
                  onAudioGenerated={handleTTSGenerated}
                  buttonText="Tạo TTS"
                />
              </Space>

              {uploadedAudioUrl && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <SoundOutlined />
                    <span className="text-sm font-medium">Đã tải lên</span>
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveAudio}
                      type="text"
                      danger
                    >
                      Xóa
                    </Button>
                  </div>
                  <audio controls className="w-full">
                    <source src={uploadedAudioUrl} />
                  </audio>
                </div>
              )}

              {DEV_MODE && selectedAudioFile && !uploadedAudioUrl && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleUploadAudio}
                  loading={uploadStatus === "uploading"}
                  className="mt-3 rounded-lg"
                >
                  Tải lên S3
                </Button>
              )}
            </div>
          </FormField>
        </SectionContainer>

        {/* Section 4: Translation */}
        <SectionContainer>
          <SectionHeader
            step={4}
            title="Bản Dịch Tiếng Việt"
            description="Nghĩa và thông tin bổ sung"
            icon={<TranslationOutlined />}
          />

          <Form.Item name={["translation", "language"]} initialValue="vn" hidden>
            <Input />
          </Form.Item>

          <FormField label="Bản dịch" required>
            <Form.Item
              name={["translation", "translation"]}
              rules={[{ required: true, message: "Bắt buộc" }]}
              className="mb-0"
            >
              <Input placeholder="Nhập nghĩa tiếng Việt" size="large" className="rounded-lg" />
            </Form.Item>
          </FormField>

          <FormField label="Thông tin bổ sung" hint="Ghi chú sử dụng, câu ví dụ, ngữ cảnh văn hóa">
            <Form.Item name={["translation", "additionalDetail"]} className="mb-0">
              <Input.TextArea
                rows={3}
                placeholder="Ví dụ: Lời chào phổ biến..."
                className="rounded-lg"
              />
            </Form.Item>
          </FormField>
        </SectionContainer>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Button size="large" onClick={onSuccess} className="rounded-lg px-6">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="rounded-lg px-8 bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            {isEdit && senseEditing?.id ? "Cập Nhật Từ" : "Tạo Từ Mới"}
          </Button>
        </div>
      </Form>

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={{
          imageUrl: uploadedImageUrl,
          audioUrl: uploadedAudioUrl,
        }}
        errorMessage={uploadError}
        fileNames={{
          imageName: selectedImageFile?.name,
          audioName: selectedAudioFile?.name,
        }}
      />
    </Spin>
  );
};

export default WordForm;
