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
  Divider,
  Space,
  Alert,
  Upload,
  Tag,
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

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

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

    // Generate pinyin
    const pinyinText = generatePinyin(value);
    setGeneratedPinyin(pinyinText);

    // Auto-fill pinyin field if it's empty
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

      // Set initial form values for the first sense or selected sense
      const primarySense =
        wordData.senses?.find((sense) => sense.isPrimary) ||
        wordData.senses?.[0];
      if (primarySense) {
        setSenseEditing(primarySense);
        const t = firstTranslation(primarySense);

        // Set generated pinyin for display
        if (primarySense.pinyin) {
          setGeneratedPinyin(primarySense.pinyin);
        }

        // Set existing image/audio URLs
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

    // Skip search in edit mode
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
      // Convert blob URL to file for upload
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
        // Update existing word sense
        await updateWordSense(senseEditing.id, formData);
        message.success("Cập nhật từ vựng thành công");
      } else {
        // Create new word or add sense to existing word
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

      // Update generated pinyin
      if (sense.pinyin) {
        setGeneratedPinyin(sense.pinyin);
      }

      // Update uploaded URLs
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
      >
        {/* Word Info Section */}
        <Divider orientation="left">Thông Tin Từ Vựng</Divider>

        {existingWord && !isEdit && (
          <Alert
            message="Từ đã tồn tại"
            description={`Từ này đã có trong cơ sở dữ liệu. Bạn có thể thêm nghĩa mới cho nó.`}
            type="info"
            showIcon
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Form.Item
              label="Chữ Giản Thể"
              name={["word", "simplified"]}
              rules={[{ required: true, message: "Chữ giản thể là bắt buộc" }]}
            >
              <Input
                onChange={handleSimplifiedInput}
                disabled={isEdit || !!existingWord}
                suffix={searchLoading ? <Spin size="small" /> : null}
                placeholder="Ví dụ: 你好"
              />
            </Form.Item>

            {/* Display auto-generated pinyin preview */}
            {generatedPinyin && (
              <div className="-mt-4 mb-4">
                <Tag color="blue">Tự động tạo: {generatedPinyin}</Tag>
              </div>
            )}
          </div>

          <Form.Item
            label="Chữ Phồn Thể (tùy chọn)"
            name={["word", "traditional"]}
          >
            <Input
              disabled={isEdit || !!existingWord}
              placeholder="Ví dụ: 你好"
            />
          </Form.Item>
        </div>

        {/* Word Sense Section */}
        <Divider orientation="left">Thông Tin Nghĩa</Divider>

        {isEdit && wordData?.senses && wordData.senses.length > 0 && (
          <div className="mb-4">
            <span className="mr-2">Chỉnh sửa nghĩa:</span>
            <Select
              value={senseEditing?.id}
              onChange={handleSenseChange}
              className="w-[300px]"
            >
              {wordData.senses.map((sense) => {
                const t = firstTranslation(sense);
                return (
                  <Option key={sense.id} value={sense.id}>
                    Nghĩa {sense.senseNumber}: {sense.pinyin} -{" "}
                    {t?.translation || ""}
                  </Option>
                );
              })}
            </Select>

            {wordData.senses.length > 1 && senseEditing?.id && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteSense(senseEditing)}
                className="ml-2"
              >
                Xóa Nghĩa
              </Button>
            )}

            {isEdit && (
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
                className="ml-2"
              >
                Thêm Nghĩa Mới
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label={
              <Space>
                <span>Pinyin</span>
                <Button
                  type="link"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleRegeneratePinyin}
                  className="p-0"
                >
                  Tạo lại
                </Button>
              </Space>
            }
            name={["sense", "pinyin"]}
            rules={[{ required: true, message: "Pinyin là bắt buộc" }]}
          >
            <Input placeholder="Ví dụ: nǐ hǎo" />
          </Form.Item>

          <Form.Item label="Loại Từ" name={["sense", "partOfSpeech"]}>
            <Select
              options={partOfSpeechOptions}
              allowClear
              showSearch
              placeholder="Chọn loại từ"
            />
          </Form.Item>

          <Form.Item label="Cấp độ HSK" name={["sense", "hskLevel"]}>
            <InputNumber
              min={1}
              max={9}
              className="w-full"
              placeholder="1-9"
            />
          </Form.Item>

          <Form.Item
            label="Nghĩa Chính"
            name={["sense", "isPrimary"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>

        {/* Media Section */}
        <Divider orientation="left">Tài Nguyên Đa Phương Tiện</Divider>

        <div className="grid grid-cols-1 gap-4">
          {/* Hidden field to store image URL */}
          <Form.Item name={["sense", "imageUrl"]} hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Tải Lên Hình Ảnh">
            <div>
              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageFileChange(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} className="mb-2">
                  {selectedImageFile ? selectedImageFile.name : "Chọn Hình Ảnh"}
                </Button>
              </Upload>
              {uploadedImageUrl && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <PictureOutlined className="text-green-500" />
                    <span className="text-green-500">
                      Đã tải lên hình ảnh
                    </span>
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                      type="text"
                      danger
                    />
                  </div>
                  <div className="mt-1">
                    <img
                      src={uploadedImageUrl}
                      alt="Word"
                      className="max-w-[200px] max-h-[200px] object-cover"
                    />
                  </div>
                </div>
              )}
              {DEV_MODE && selectedImageFile && !uploadedImageUrl && (
                <div className="mt-2">
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={handleUploadImage}
                    loading={uploadStatus === "uploading"}
                  >
                    Tải Hình Ảnh Lên S3 (Dev Mode)
                  </Button>
                </div>
              )}
            </div>
          </Form.Item>

          {/* Hidden field to store audio URL */}
          <Form.Item name={["sense", "audioUrl"]} hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Âm Thanh">
            <Space direction="vertical" className="w-full">
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
                  <Button icon={<UploadOutlined />}>
                    {selectedAudioFile
                      ? selectedAudioFile.name
                      : "Chọn Âm Thanh"}
                  </Button>
                </Upload>

                <TTSButton
                  text={
                    chineseText || form.getFieldValue(["word", "simplified"])
                  }
                  onAudioGenerated={handleTTSGenerated}
                  buttonText="Tạo TTS"
                />
              </Space>

              {uploadedAudioUrl && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <SoundOutlined className="text-green-500" />
                    <span className="text-green-500">
                      Đã tải lên âm thanh
                    </span>
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
                      Trình duyệt của bạn không hỗ trợ phát âm thanh.
                    </audio>
                  </div>
                </div>
              )}
              {DEV_MODE && selectedAudioFile && !uploadedAudioUrl && (
                <div className="mt-2">
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={handleUploadAudio}
                    loading={uploadStatus === "uploading"}
                  >
                    Tải Âm Thanh Lên S3 (Dev Mode)
                  </Button>
                </div>
              )}
            </Space>
          </Form.Item>
        </div>

        {/* Translation Section */}
        <Divider orientation="left">Bản Dịch</Divider>

        <Form.Item
          label="Ngôn Ngữ"
          name={["translation", "language"]}
          initialValue="vn"
        >
          <Select disabled>
            <Option value="vn">Tiếng Việt</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Bản Dịch"
          name={["translation", "translation"]}
          rules={[{ required: true, message: "Bản dịch là bắt buộc" }]}
        >
          <Input placeholder="Nhập bản dịch tiếng Việt" />
        </Form.Item>

        <Form.Item
          label="Thông tin Bổ Sung"
          name={["translation", "additionalDetail"]}
          extra="Thêm ghi chú sử dụng, câu ví dụ hoặc ngữ cảnh văn hóa"
        >
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Lời chào phổ biến dùng trong các tình huống trang trọng và thân mật"
          />
        </Form.Item>

        <div className="flex justify-end mt-6">
          <Space>
            <Button onClick={onSuccess}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit && senseEditing?.id ? "Cập Nhật Từ" : "Tạo Từ Mới"}
            </Button>
          </Space>
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
