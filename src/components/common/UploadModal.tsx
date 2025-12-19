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
        return <LoadingOutlined className="text-2xl text-blue-500" />;
      case "success":
        return <CheckCircleOutlined className="text-2xl text-green-500" />;
      case "error":
        return <CloseCircleOutlined className="text-2xl text-red-500" />;
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
        <div className="text-center py-6">
          <div className="mb-4">{getStatusIcon()}</div>
          <Title level={4} className="!mb-6">
            Đang tải tệp của bạn lên...
          </Title>
          <Progress
            type="circle"
            percent={uploadProgress}
            status={getProgressStatus()}
            size={120}
          />
          <div className="mt-4">
            <Text type="secondary">
              Vui lòng không đóng cửa sổ này trong khi đang tải lên
            </Text>
          </div>
          {fileNames && (
            <div className="mt-4 text-left">
              {fileNames.imageName && (
                <div className="mb-2">
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
        <div className="text-center py-6">
          <div className="mb-4">{getStatusIcon()}</div>
          <Title level={4} className="!mb-6 !text-green-500">
            Tải tệp lên thành công!
          </Title>
          <Alert
            message="Tải Lên Hoàn Tất"
            description="Các tệp của bạn đã được tải lên S3 và sẵn sàng sử dụng."
            type="success"
            showIcon
            className="mb-6 text-left"          />
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
        <div className="text-center py-6">
          <div className="mb-4">{getStatusIcon()}</div>
          <Title level={4} className="!mb-6 !text-red-500">
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
            className="mb-6 text-left"
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
