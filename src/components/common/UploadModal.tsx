"use client";
import React from 'react';
import { Modal, Progress, Typography, Button, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface UploadModalProps {
  visible: boolean;
  onCancel: () => void;
  uploadStatus: 'uploading' | 'success' | 'error' | 'idle';
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
      case 'uploading':
        return 'Uploading Files to S3...';
      case 'success':
        return 'Upload Successful!';
      case 'error':
        return 'Upload Failed';
      default:
        return 'Upload Files';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const getProgressStatus = () => {
    switch (uploadStatus) {
      case 'success':
        return 'success';
      case 'error':
        return 'exception';
      default:
        return 'active';
    }
  };

  const renderUploadContent = () => {
    if (uploadStatus === 'uploading') {
      return (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ marginBottom: 16 }}>
            {getStatusIcon()}
          </div>
          <Title level={4} style={{ marginBottom: 24 }}>
            Uploading your files...
          </Title>
          <Progress
            type="circle"
            percent={uploadProgress}
            status={getProgressStatus()}
            size={120}
          />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              Please don't close this window while uploading
            </Text>
          </div>
          {fileNames && (
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              {fileNames.imageName && (
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Image: </Text>
                  <Text>{fileNames.imageName}</Text>
                </div>
              )}
              {fileNames.audioName && (
                <div>
                  <Text strong>Audio: </Text>
                  <Text>{fileNames.audioName}</Text>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (uploadStatus === 'success') {
      return (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ marginBottom: 16 }}>
            {getStatusIcon()}
          </div>
          <Title level={4} style={{ marginBottom: 24, color: '#52c41a' }}>
            Files uploaded successfully!
          </Title>
          <Alert
            message="Upload Complete"
            description="Your files have been uploaded to S3 and are ready to use."
            type="success"
            showIcon
            style={{ marginBottom: 24, textAlign: 'left' }}
          />
          {uploadedUrls && (
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
          )}
        </div>
      );
    }

    if (uploadStatus === 'error') {
      return (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ marginBottom: 16 }}>
            {getStatusIcon()}
          </div>
          <Title level={4} style={{ marginBottom: 24, color: '#ff4d4f' }}>
            Upload Failed
          </Title>
          <Alert
            message="Upload Error"
            description={errorMessage || 'An error occurred while uploading your files. Please try again.'}
            type="error"
            showIcon
            style={{ marginBottom: 24, textAlign: 'left' }}
          />
          <Text type="secondary">
            Please check your files and try again. Make sure your files are in the correct format and under the size limit.
          </Text>
        </div>
      );
    }

    return null;
  };

  const getFooterButtons = () => {
    if (uploadStatus === 'uploading') {
      return null; // No buttons while uploading
    }

    if (uploadStatus === 'success') {
      return [
        <Button key="done" type="primary" onClick={onCancel}>
          Done
        </Button>,
      ];
    }

    if (uploadStatus === 'error') {
      return [
        <Button key="retry" type="primary" onClick={onCancel}>
          Close
        </Button>,
      ];
    }

    return [
      <Button key="cancel" onClick={onCancel}>
        Cancel
      </Button>,
    ];
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={uploadStatus === 'uploading' ? undefined : onCancel}
      footer={getFooterButtons()}
      closable={uploadStatus !== 'uploading'}
      maskClosable={uploadStatus !== 'uploading'}
      width={500}
      centered
    >
      {renderUploadContent()}
    </Modal>
  );
};

export default UploadModal;