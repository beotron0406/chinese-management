import React, { useState } from "react";
import {
  Modal,
  Input,
  Select,
  Button,
  Space,
  message,
  Alert,
  Typography,
  Divider,
} from "antd";
import {
  SoundOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

interface TTSModalProps {
  visible: boolean;
  onClose: () => void;
  onAudioGenerated?: (audioUrl: string) => void;
  initialText?: string;
}

const TTSModal: React.FC<TTSModalProps> = ({
  visible,
  onClose,
  onAudioGenerated,
  initialText = "",
}) => {
  const [text, setText] = useState(initialText);
  const [voice, setVoice] = useState<string>("female");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Update text when modal opens with new initialText
  React.useEffect(() => {
    if (visible && initialText) {
      setText(initialText);
    }
  }, [visible, initialText]);

  // Cleanup audio URL when modal closes
  React.useEffect(() => {
    if (!visible) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      setIsPlaying(false);
    }
  }, [visible]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      message.warning("Vui lòng nhập văn bản tiếng Trung");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/audio-gen/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim(), voice }),
      });

      if (!response.ok) {
        throw new Error("Không thể tạo giọng nói");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      // Cleanup old audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(url);
      message.success("Tạo giọng nói thành công!");

      // Callback with audio URL
      if (onAudioGenerated) {
        onAudioGenerated(url);
      }
    } catch (error) {
      console.error("TTS generation error:", error);
      message.error("Có lỗi khi tạo giọng nói");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!audioUrl) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `tts_${text.substring(0, 10)}_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Đã tải xuống file âm thanh");
  };

  const handleClose = () => {
    setText("");
    setVoice("female");
    setAudioUrl(null);
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    setIsPlaying(false);
    onClose();
  };

  const voiceOptions = [
    { value: "male", label: "Nam giới", description: "Giọng nam trưởng thành" },
    {
      value: "female",
      label: "Nữ giới",
      description: "Giọng nữ trưởng thành",
    },
    { value: "child", label: "Trẻ em", description: "Giọng trẻ em" },
    { value: "uncle", label: "Người già", description: "Giọng nam lớn tuổi" },
  ];

  return (
    <Modal
      title={
        <Space>
          <SoundOutlined />
          <span>Tạo giọng nói Text-to-Speech</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="close" onClick={handleClose}>
          Đóng
        </Button>,
        <Button
          key="generate"
          type="primary"
          icon={loading ? <LoadingOutlined /> : <SoundOutlined />}
          onClick={handleGenerate}
          loading={loading}
          disabled={!text.trim()}
        >
          Tạo giọng nói
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Alert
          message="Nhập văn bản tiếng Trung để tạo file âm thanh"
          type="info"
          showIcon
        />

        <div>
          <Text strong>Văn bản tiếng Trung:</Text>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập văn bản tiếng Trung (ví dụ: 你好世界)"
            rows={4}
            maxLength={500}
            showCount
            style={{ marginTop: 8 }}
          />
        </div>

        <div>
          <Text strong>Chọn giọng nói:</Text>
          <Select
            value={voice}
            onChange={setVoice}
            style={{ width: "100%", marginTop: 8 }}
            options={voiceOptions.map((opt) => ({
              value: opt.value,
              label: (
                <div>
                  <div>{opt.label}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {opt.description}
                  </Text>
                </div>
              ),
            }))}
          />
        </div>

        {audioUrl && (
          <>
            <Divider />
            <div>
              <Text strong>Xem trước âm thanh:</Text>
              <div style={{ marginTop: 12 }}>
                <Space>
                  <Button
                    icon={
                      isPlaying ? (
                        <PauseCircleOutlined />
                      ) : (
                        <PlayCircleOutlined />
                      )
                    }
                    onClick={handlePlay}
                    type="default"
                  >
                    {isPlaying ? "Tạm dừng" : "Phát"}
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    type="primary"
                  >
                    Tải xuống
                  </Button>
                </Space>
              </div>
              <audio
                src={audioUrl}
                style={{ width: "100%", marginTop: 12 }}
                controls
              />
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
};

export default TTSModal;
