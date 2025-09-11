import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, message } from 'antd';
import { LessonContent, ContentFormValues } from '../../types/lessonTypes';
import { lessonApi } from '../../services/lessonApi';

const { Option } = Select;
const { TextArea } = Input;

interface CardFormModalProps {
  visible: boolean;
  onClose: (refresh: boolean) => void;
  card: LessonContent | null;
  lessonId: number;
}

const CardFormModal: React.FC<CardFormModalProps> = ({
  visible,
  onClose,
  card,
  lessonId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cardType, setCardType] = useState<string>('text');

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (card) {
        setCardType(card.type);
        form.setFieldsValue({
          type: card.type,
          orderIndex: card.orderIndex,
          ...getFormValues(card),
        });
      } else {
        setCardType('text');
        form.setFieldsValue({
          type: 'text',
          orderIndex: 1,
        });
      }
    }
  }, [visible, card, form]);

  const getFormValues = (card: LessonContent) => {
    switch (card.type) {
      case 'text':
        return {
          title: card.data.title,
          content: card.data.content,
          mediaUrl: card.data.mediaUrl,
        };
      case 'divider':
        return {
          title: card.data.title,
        };
      default:
        return card.data;
    }
  };

  const handleTypeChange = (value: string) => {
    setCardType(value);
    form.resetFields(['title', 'content', 'mediaUrl']);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const { type, orderIndex, ...rest } = values;
      const contentData: ContentFormValues = {
        type: type as 'text' | 'vocabulary' | 'grammar' | 'exercise' | 'divider',
        orderIndex,
        data: getDataByType(type, rest),
      };

      if (card) {
        // Edit card implementation would go here
        // For now, we'll just show a message since the API endpoint isn't shown in the guide
        message.info('Card editing not implemented in this example');
        // await lessonApi.updateLessonContent(card.id, contentData);
      } else {
        await lessonApi.addLessonContent(lessonId, contentData);
        message.success('Content added successfully');
      }

      onClose(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  const getDataByType = (type: string, values: any) => {
    switch (type) {
      case 'text':
        return {
          title: values.title,
          content: values.content,
          mediaUrl: values.mediaUrl,
        };
      case 'divider':
        return {
          title: values.title,
        };
      default:
        return values;
    }
  };

  const renderFormFields = () => {
    switch (cardType) {
      case 'text':
        return (
          <>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: 'Please enter content' }]}
            >
              <TextArea rows={6} />
            </Form.Item>
            <Form.Item name="mediaUrl" label="Media URL (optional)">
              <Input placeholder="Audio or image URL" />
            </Form.Item>
          </>
        );
      case 'divider':
        return (
          <Form.Item name="title" label="Divider Title">
            <Input />
          </Form.Item>
        );
      default:
        return (
          <div>No additional fields for this card type.</div>
        );
    }
  };

  return (
    <Modal
      title={card ? 'Edit Content Card' : 'Add Content Card'}
      open={visible}
      onCancel={() => onClose(false)}
      footer={[
        <Button key="cancel" onClick={() => onClose(false)}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Save
        </Button>,
      ]}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="type"
          label="Card Type"
          rules={[{ required: true, message: 'Please select card type' }]}
        >
          <Select onChange={handleTypeChange}>
            <Option value="text">Text</Option>
            <Option value="vocabulary">Vocabulary</Option>
            <Option value="grammar">Grammar</Option>
            <Option value="exercise">Exercise</Option>
            <Option value="divider">Section Divider</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="orderIndex"
          label="Order Index"
          rules={[{ required: true, message: 'Please enter order index' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        {renderFormFields()}
      </Form>
    </Modal>
  );
};

export default CardFormModal;