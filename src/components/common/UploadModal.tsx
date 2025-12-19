"use client";
import React from "react";
import { Modal, Progress, Typography, Button, Alert } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

export interface UploadModalProps {
  visible: boolean;
  onCancel: () => void;
  uploadStatus: "uploading" | "success" | "error" | "idle";
  uploadProgress: number;
  uploadedUrls?: {
    imageUrl?: string;
    audioUrl?: string;
  };
  errorMessage?: string;
  fileNames?: {
    imageName?: string;
    audioName?: string;
  };
}

const UploadModal: React.FC<UploadModalProps> = ({
  visible,
  onCancel,
  uploadStatus,
  uploadProgress,
  uploadedUrls,
  errorMessage,
  fileNames,
}) => {
  const getModalTitle = () => {
    switch (uploadStatus) {
      case "uploading":
        return "Đang Tải Tệp Lên S3...";
      case "success":
        return "Tải Lên Thành Công!";
      case "error":
        return "Tải Lên Thất Bại";
      default:
        return "Tải Tệp Lên";
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
        return <LoadingOutlined style={{ fontSize: 24, color: "#1890ff" }} />;
      case "success":
        return (
          <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
        );
      case "error":
        return (
          <CloseCircleOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
        );
      default:
        return null;
    }
  };

  const getProgressStatus = () => {
    switch (uploadStatus) {
      case "success":
        return "success";
      case "error":
        return "exception";
      default:
        return "active";
    }
  };

  const renderUploadContent = () => {
    if (uploadStatus === "uploading") {
      return (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ marginBottom: 16 }}>{getStatusIcon()}</div>
          <Title level={4} style={{ marginBottom: 24 }}>
            Đang tải tệp của bạn lên...
          </Title>
          <Progress
            type="circle"
            percent={uploadProgress}
            status={getProgressStatus()}
            size={120}
          />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              Vui lòng không đóng cửa sổ này trong khi đang tải lên
            </Text>
          </div>
          {fileNames && (
            <div style={{ marginTop: 16, textAlign: "left" }}>
              {fileNames.imageName && (
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Hình Ảnh: </Text>
                  <Text>{fileNames.imageName}</Text>
                </div>
              )}
              {fileNames.audioName && (
                <div>
                  <Text strong>Âm Thanh: </Text>
                  <Text>{fileNames.audioName}</Text>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (uploadStatus === "success") {
      return (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ marginBottom: 16 }}>{getStatusIcon()}</div>
          <Title level={4} style={{ marginBottom: 24, color: "#52c41a" }}>
            Tải tệp lên thành công!
          </Title>
          <Alert
            message="Tải Lên Hoàn Tất"
            description="Các tệp của bạn đã được tải lên S3 và sẵn sàng sử dụng."
            type="success"
            showIcon
            style={{ marginBottom: 24, textAlign: "left" }}
          />
          {/* {uploadedUrls && (
            <div style={{ textAlign: 'left' }}>
              {uploadedUrls.imageUrl && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Image URL: </Text>
                  <Text copyable={{ text: uploadedUrls.imageUrl }} code>
                    {uploadedUrls.imageUrl.length > 50
                      ? `${uploadedUrls.imageUrl.substring(0, 50)}...`
                      : uploadedUrls.imageUrl}
                  </Text>
                </div>
              )}
              {uploadedUrls.audioUrl && (
                <div>
                  <Text strong>Audio URL: </Text>
                  <Text copyable={{ text: uploadedUrls.audioUrl }} code>
                    {uploadedUrls.audioUrl.length > 50
                      ? `${uploadedUrls.audioUrl.substring(0, 50)}...`
                      : uploadedUrls.audioUrl}
                  </Text>
                </div>
              )}
            </div>
          )} */}
        </div>
      );
    }

    if (uploadStatus === "error") {
      return (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ marginBottom: 16 }}>{getStatusIcon()}</div>
          <Title level={4} style={{ marginBottom: 24, color: "#ff4d4f" }}>
            Tải Lên Thất Bại
          </Title>
          <Alert
            message="Lỗi Tải Lên"
            description={
              errorMessage ||
              "Đã xảy ra lỗi khi tải tệp lên. Vui lòng thử lại."
            }
            type="error"
            showIcon
            style={{ marginBottom: 24, textAlign: "left" }}
          />
          <Text type="secondary">
            Vui lòng kiểm tra tệp của bạn và thử lại. Đảm bảo tệp đúng định dạng
            và dưới giới hạn kích thước cho phép.
          </Text>
        </div>
      );
    }

    return null;
  };

  const getFooterButtons = () => {
    if (uploadStatus === "uploading") {
      return null; // No buttons while uploading
    }

    if (uploadStatus === "success") {
      return [
        <Button key="done" type="primary" onClick={onCancel}>
          Hoàn Tất
        </Button>,
      ];
    }

    if (uploadStatus === "error") {
      return [
        <Button key="retry" type="primary" onClick={onCancel}>
          Đóng
        </Button>,
      ];
    }

    return [
      <Button key="cancel" onClick={onCancel}>
        Hủy
      </Button>,
    ];
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={uploadStatus === "uploading" ? undefined : onCancel}
      footer={getFooterButtons()}
      closable={uploadStatus !== "uploading"}
      maskClosable={uploadStatus !== "uploading"}
      width={500}
      centered
    >
      {renderUploadContent()}
    </Modal>
  );
};

export default UploadModal;
