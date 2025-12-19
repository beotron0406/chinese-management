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
        message.success('Cập nhật lesson thành công');
      } else {
        // Create new lesson
        await lessonApi.createLesson(values as LessonFormValues);
        message.success('Tạo lesson thành công');
      }

      onClose(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('Lưu lesson thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={lesson ? 'Chỉnh sửa lesson' : 'Thêm lesson mới'}
      open={visible}
      onCancel={() => onClose(false)}
      footer={[
        <Button key="cancel" onClick={() => onClose(false)}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Lưu
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
          label="Tên bài học"
          rules={[{ required: true, message: 'Vui lòng nhập tên bài học' }]}
        >
          <Input placeholder="Nhập tên bài học" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
        >
          <Input.TextArea rows={4} placeholder="Nhập mô tả bài học" />
        </Form.Item>

        <Form.Item
          name="courseId"
          label="Khóa học"
          rules={[{ required: true, message: 'Vui lòng chọn khóa học' }]}
        >
          <CourseSelect />
        </Form.Item>

      </Form>
    </Modal>
  );
};

export default LessonFormModal;