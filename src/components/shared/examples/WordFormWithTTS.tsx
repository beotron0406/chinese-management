import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  message,
  Space,
  Divider,
} from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import TTSButton from "@/components/shared/TTSButton";

const { TextArea } = Input;

interface WordFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (wordData: any) => void;
}

const WordFormModal: React.FC<WordFormModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [chineseText, setChineseText] = useState("");

  const handleAudioGenerated = async (url: string) => {
    setAudioUrl(url);
    message.success("Đã tạo file âm thanh. Có thể phát hoặc tải xuống.");

    // Optional: Convert to File object for upload
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `audio_${Date.now()}.wav`, {
        type: "audio/wav",
      });

      // Store the file for later upload
      form.setFieldsValue({ audioFile: file });
    } catch (error) {
      console.error("Error converting audio:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Add audio URL to form data
      const wordData = {
        ...values,
        audioUrl: audioUrl,
      };

      // Here you would upload the audio file to S3 or your storage
      // and get the permanent URL

      if (onSave) {
        await onSave(wordData);
      }

      message.success("Tạo từ vựng thành công!");
      handleClose();
    } catch (error) {
      console.error("Form validation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setAudioUrl(null);
    setChineseText("");
    onClose();
  };

  return (
    <Modal
      title="Tạo từ vựng mới"
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          loading={loading}
        >
          Lưu từ vựng
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="simplified"
          label="Chữ giản thể"
          rules={[{ required: true, message: "Vui lòng nhập chữ giản thể" }]}
        >
          <Input
            placeholder="例如: 你好"
            onChange={(e) => setChineseText(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="traditional"
          label="Chữ phồn thể"
          rules={[{ required: true, message: "Vui lòng nhập chữ phồn thể" }]}
        >
          <Input placeholder="例如: 你好" />
        </Form.Item>

        <Form.Item
          name="pinyin"
          label="Phiên âm (Pinyin)"
          rules={[{ required: true, message: "Vui lòng nhập pinyin" }]}
        >
          <Input placeholder="例如: nǐ hǎo" />
        </Form.Item>

        <Form.Item name="hskLevel" label="Cấp độ HSK">
          <Select placeholder="Chọn cấp độ HSK">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
              <Select.Option key={level} value={level}>
                HSK {level}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Tạo giọng nói</Divider>

        <Form.Item label="Audio File">
          <Space direction="vertical" style={{ width: "100%" }}>
            <TTSButton
              text={chineseText || form.getFieldValue("simplified")}
              onAudioGenerated={handleAudioGenerated}
              buttonText="Tạo giọng nói từ văn bản"
              buttonType="primary"
            />

            {audioUrl && (
              <div>
                <audio
                  src={audioUrl}
                  controls
                  style={{ width: "100%", marginTop: 8 }}
                />
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    setAudioUrl(null);
                    form.setFieldsValue({ audioFile: null });
                  }}
                >
                  Xóa audio
                </Button>
              </div>
            )}
          </Space>
        </Form.Item>

        <Divider>Định nghĩa</Divider>

        <Form.Item
          name="definition"
          label="Định nghĩa"
          rules={[{ required: true, message: "Vui lòng nhập định nghĩa" }]}
        >
          <TextArea rows={3} placeholder="Nhập định nghĩa của từ" />
        </Form.Item>

        <Form.Item name="partOfSpeech" label="Từ loại">
          <Select placeholder="Chọn từ loại">
            <Select.Option value="noun">Danh từ (Noun)</Select.Option>
            <Select.Option value="verb">Động từ (Verb)</Select.Option>
            <Select.Option value="adjective">Tính từ (Adjective)</Select.Option>
            <Select.Option value="adverb">Trạng từ (Adverb)</Select.Option>
            <Select.Option value="pronoun">Đại từ (Pronoun)</Select.Option>
            <Select.Option value="preposition">
              Giới từ (Preposition)
            </Select.Option>
            <Select.Option value="conjunction">
              Liên từ (Conjunction)
            </Select.Option>
            <Select.Option value="interjection">
              Thán từ (Interjection)
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WordFormModal;
