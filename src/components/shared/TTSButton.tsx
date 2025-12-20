import React, { useState } from "react";
import { Button, message } from "antd";
import { SoundOutlined } from "@ant-design/icons";
import TTSModal from "./TtsModal";

interface TTSButtonProps {
  text?: string;
  onAudioGenerated?: (audioUrl: string, audioBlob: Blob) => void;
  buttonText?: string;
  buttonType?: "primary" | "default" | "dashed" | "link" | "text";
  size?: "small" | "middle" | "large";
  disabled?: boolean;
}

const TTSButton: React.FC<TTSButtonProps> = ({
  text = "",
  onAudioGenerated,
  buttonText = "Tạo giọng nói",
  buttonType = "default",
  size = "middle",
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpen = () => {
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  const handleAudioGenerated = (audioUrl: string, audioBlob: Blob) => {
    if (onAudioGenerated) {
      onAudioGenerated(audioUrl, audioBlob);
    }
  };

  return (
    <>
      <Button
        icon={<SoundOutlined />}
        onClick={handleOpen}
        type={buttonType}
        size={size}
        disabled={disabled}
      >
        {buttonText}
      </Button>

      <TTSModal
        visible={modalVisible}
        onClose={handleClose}
        initialText={text}
        onAudioGenerated={handleAudioGenerated}
      />
    </>
  );
};

export default TTSButton;
