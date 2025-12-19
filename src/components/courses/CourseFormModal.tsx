"use client";

import { useEffect } from "react";
import {
  Form,
  Input,
  Modal,
  InputNumber,
  Switch,
  Select,
  Divider,
  Typography,
} from "antd";
import { Course, CourseCreateInput, CourseUpdateInput } from "@/types";
import CourseSelect from "../shared/button/CourseSelect";

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
  initialValues,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        form.setFieldsValue({
          isActive: true,
          hskLevel: 1,
          orderIndex: 1,
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onSave(values);
        form.resetFields();
      })
      .catch((info) => {
        console.error("Validate Failed:", info);
      });
  };

  return (
    <Modal
      title={initialValues ? "Sửa khóa học" : "Thêm khóa học mới"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={initialValues ? "Cập nhật" : "Tạo"}
      width={600}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ isActive: true, hskLevel: 1, orderIndex: 1 }}
      >
        <Divider orientation="left">Thông tin cơ bản</Divider>

        <Form.Item
          name="title"
          label="Tiêu đề khóa học"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề khóa học" },
          ]}
        >
          <Input placeholder="Nhập tiêu đề khóa học" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả khóa học">
          <TextArea
            rows={4}
            placeholder="Nhập mô tả khóa học"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Divider orientation="left">Cài đặt khóa học</Divider>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="hskLevel"
            label="Cấp độ HSK"
            rules={[{ required: true, message: "Vui lòng chọn cấp độ HSK" }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Chọn cấp độ HSK">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                <Option key={level} value={level}>
                  HSK {level}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="prerequisiteCourseId"
          label="Khóa học tiên quyết"
          tooltip="Khóa học phải hoàn thành trước khi có thể truy cập khóa học này"
        >
          <CourseSelect
            placeholder="Chọn khóa học tiên quyết (tùy chọn)"
            allowClear
            excludeCourseId={initialValues?.id}
          />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Active Status"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Text type="secondary">
          Only active courses are visible to students. Inactive courses are
          hidden.
        </Text>
      </Form>
    </Modal>
  );
};

export default CourseFormModal;
