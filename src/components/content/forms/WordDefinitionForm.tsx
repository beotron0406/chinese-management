"use client";
import React, { useState, useEffect } from 'react';
import { Form, Input, Card, Typography, Row, Col } from 'antd';
import { SoundOutlined, PictureOutlined } from '@ant-design/icons';
import { pinyin } from 'pinyin-pro';
import type { FormInstance } from 'antd/es/form';
import { WordDefinitionData } from '@/types/contentTypes';

const { Text } = Typography;
const { TextArea } = Input;

interface WordDefinitionFormProps {
  form: FormInstance;
  initialValues?: WordDefinitionData;
}

const WordDefinitionForm: React.FC<WordDefinitionFormProps> = ({ form, initialValues }) => {
  const [chineseText, setChineseText] = useState<string>('');
  const [generatedPinyin, setGeneratedPinyin] = useState<string>('');

  const generatePinyin = (chinese: string): string => {
    try {
      return pinyin(chinese, {
        toneType: 'symbol',
        type: 'array'
      }).join(' ');
    } catch (error) {
      console.warn('Failed to generate pinyin:', error);
      return '';
    }
  };

  const handleChineseTextChange = (value: string) => {
    setChineseText(value);
    const pinyinResult = generatePinyin(value);
    setGeneratedPinyin(pinyinResult);

    form.setFieldsValue({
      data: {
        ...form.getFieldValue('data'),
        chinese_text: value,
        pinyin: pinyinResult
      }
    });
  };

  useEffect(() => {
    if (initialValues) {
      setChineseText(initialValues.chinese_text || '');
      setGeneratedPinyin(initialValues.pinyin || '');
    }
  }, [initialValues]);

  return (
    <div>
      <Card title="Word Information" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Chinese Text"
              name={['data', 'chinese_text']}
              rules={[{ required: true, message: 'Please enter the Chinese text' }]}
            >
              <Input
                onChange={(e) => handleChineseTextChange(e.target.value)}
                style={{ fontSize: '18px' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Pinyin (Auto-generated)"
              name={['data', 'pinyin']}
              rules={[{ required: true, message: 'Pinyin is required' }]}
            >
              <Input
                value={generatedPinyin}
                onChange={(e) => setGeneratedPinyin(e.target.value)}
                addonAfter={<SoundOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Part of Speech"
          name={['data', 'speech']}
          rules={[{ required: true, message: 'Please enter the part of speech' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Explanation"
          name={['data', 'explaination']}
          rules={[{ required: true, message: 'Please enter the explanation' }]}
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item
          label="Additional Information"
          name={['data', 'additional_info']}
        >
          <TextArea rows={4} />
        </Form.Item>
      </Card>

      <Card title="Media Files" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Picture URL"
              name={['data', 'picture_url']}
              rules={[{ required: true, message: 'Please enter the picture URL' }]}
            >
              <Input addonAfter={<PictureOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Audio URL"
              name={['data', 'audio_url']}
              rules={[{ required: true, message: 'Please enter the audio URL' }]}
            >
              <Input addonAfter={<SoundOutlined />} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {chineseText && (
        <Card title="Preview" style={{ marginBottom: '24px' }}>
          <div style={{ padding: '16px', border: '1px solid #d9d9d9', borderRadius: '6px', backgroundColor: '#fafafa' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>{chineseText}</Text>
              {generatedPinyin && <Text style={{ fontSize: '16px', color: '#666', marginLeft: '12px' }}>({generatedPinyin})</Text>}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text strong>Part of Speech: </Text>
              <Text>{form.getFieldValue(['data', 'speech']) || 'Not specified'}</Text>
            </div>
            <div>
              <Text strong>Explanation: </Text>
              <Text>{form.getFieldValue(['data', 'explaination']) || 'Not specified'}</Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WordDefinitionForm;