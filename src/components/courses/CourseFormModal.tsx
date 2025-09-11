'use client';

import { useEffect } from 'react';
import { 
  Form, 
  Input, 
  Modal, 
  InputNumber, 
  Switch, 
  Select, 
  Divider,
  Typography
} from 'antd';
import { Course, CourseCreateInput, CourseUpdateInput } from '@/types';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface CourseFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: CourseCreateInput | CourseUpdateInput) => void;
  initialValues: Course | null;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ 
  visible, 
  onCancel, 
  onSave, 
  initialValues 
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        // Set default values for new courses
        form.setFieldsValue({ 
          isActive: true,
          hskLevel: 1,
          orderIndex: 1
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        onSave(values);
        form.resetFields();
      })
      .catch(info => {
        console.error('Validate Failed:', info);
      });
  };

  return (
    <Modal
      title={initialValues ? "Edit Course" : "Add New Course"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={initialValues ? "Update" : "Create"}
      width={600}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ isActive: true, hskLevel: 1, orderIndex: 1 }}
      >
        <Divider orientation="left">Basic Information</Divider>
        
        <Form.Item
          name="title"
          label="Course Title"
          rules={[{ required: true, message: 'Please enter the course title' }]}
        >
          <Input placeholder="Enter course title" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={4} 
            placeholder="Enter course description" 
            showCount 
            maxLength={500} 
          />
        </Form.Item>

        <Divider orientation="left">Course Settings</Divider>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="hskLevel"
            label="HSK Level"
            rules={[{ required: true, message: 'Please select HSK level' }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Select HSK level">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <Option key={level} value={level}>HSK {level}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="orderIndex"
            label="Order Index"
            rules={[{ required: true, message: 'Please enter the order index' }]}
            style={{ flex: 1 }}
            tooltip="Determines the order in which courses are displayed. Lower numbers appear first."
          >
            <InputNumber 
              min={1} 
              placeholder="Enter order index" 
              style={{ width: '100%' }} 
            />
          </Form.Item>
        </div>

        <Form.Item
          name="prerequisiteCourseId"
          label="Prerequisite Course"
          tooltip="Course that must be completed before this one becomes available"
        >
          <Select 
            placeholder="Select prerequisite course (optional)" 
            allowClear
          >
            {/* This would ideally be populated with courses from your API */}
            <Option value={1}>HSK 1 - Basic Chinese Characters</Option>
            <Option value={2}>HSK 1 - Greetings and Introductions</Option>
            {/* Add more options as needed */}
          </Select>
        </Form.Item>

        <Form.Item 
          name="isActive" 
          label="Active Status" 
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Text type="secondary">
          Only active courses are visible to students. Inactive courses are hidden.
        </Text>
      </Form>
    </Modal>
  );
};

export default CourseFormModal;