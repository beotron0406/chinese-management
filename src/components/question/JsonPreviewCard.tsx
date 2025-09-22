"use client";
import React, { useState } from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, CopyOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface JsonPreviewCardProps {
  data: any;
  title?: string;
}

const JsonPreviewCard: React.FC<JsonPreviewCardProps> = ({
  data,
  title = "JSON Preview - Data to be sent to Backend"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text strong style={{ color: '#1890ff' }}>{title}</Text>
        </div>
      }
      extra={
        <Space>
          <Button
            size="small"
            icon={copySuccess ? <span style={{ color: 'green' }}>✓</span> : <CopyOutlined />}
            onClick={handleCopy}
            type={copySuccess ? "default" : "text"}
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            size="small"
            icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={toggleVisibility}
            type="text"
          >
            {isVisible ? 'Hide' : 'Show'}
          </Button>
        </Space>
      }
      style={{
        border: '1px dashed #1890ff',
        backgroundColor: '#f6ffed'
      }}
    >
      {isVisible && (
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.4',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {!isVisible && (
        <Text type="secondary" style={{ fontStyle: 'italic' }}>
          Click "Show" to preview the JSON data structure that will be sent to the backend API.
        </Text>
      )}
    </Card>
  );
};

export default JsonPreviewCard;