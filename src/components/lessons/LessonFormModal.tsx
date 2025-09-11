import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Button, message } from 'antd';
import { Lesson, LessonFormValues } from '../../types/lessonTypes';
import { lessonApi } from '../../services/lessonApi';
import CourseSelect from '../shared/button/CourseSelect';

interface LessonFormModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  lesson: Lesson | null;
  courseId?: number;
}

const LessonFormModal: React.FC<LessonFormModalProps> = ({
  visible,
  onClose,
  lesson,
  courseId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (lesson) {
        form.setFieldsValue({
          name: lesson.name,
          description: lesson.description,
          orderIndex: lesson.orderIndex,
          courseId: lesson.courseId,
        });
      } else if (courseId) {
        form.setFieldsValue({
          courseId: courseId,
        });
      }
    }
  }, [visible, lesson, courseId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (lesson) {
        // Update existing lesson
        await lessonApi.updateLesson(lesson.id, values);
        message.success('Lesson updated successfully');
      } else {
        // Create new lesson
        await lessonApi.createLesson(values as LessonFormValues);
        message.success('Lesson created successfully');
      }

      onClose(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={lesson ? 'Edit Lesson' : 'Add New Lesson'}
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
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ orderIndex: 1 }}
      >
        <Form.Item
          name="name"
          label="Lesson name"
          rules={[{ required: true, message: 'Please enter lesson name' }]}
        >
          <Input placeholder="Enter lesson name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter lesson description' }]}
        >
          <Input.TextArea rows={4} placeholder="Enter lesson description" />
        </Form.Item>

        <Form.Item
          name="courseId"
          label="Course"
          rules={[{ required: true, message: 'Please select a course' }]}
        >
          <CourseSelect />
        </Form.Item>

        <Form.Item
          name="orderIndex"
          label="Order Index"
          rules={[{ required: true, message: 'Please enter order index' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LessonFormModal;