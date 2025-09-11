import React from 'react';
import { Card, Button, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ExerciseData } from '@/types';

interface Props {
  data: ExerciseData;
  onEdit: () => void;
  onDelete: () => void;
}

const ExerciseCard: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <Card
      title={`Thẻ Bài tập: ${data.title}`}
      className="mb-4 shadow-md border-l-4 border-green-500"
      actions={[
        <Button key="edit" type="text" icon={<EditOutlined />} onClick={onEdit}>Sửa</Button>,
        <Button key="delete" type="text" icon={<DeleteOutlined />} danger onClick={onDelete}>Xóa</Button>,
      ]}
    >
      <p><strong>Loại bài tập:</strong> <Tag color="blue">{data.type}</Tag></p>
      {/* Hiển thị tóm tắt nội dung bài tập */}
      <div className="mt-2 p-2 bg-gray-50 rounded">
        <p className="text-gray-600">Nội dung chi tiết của bài tập sẽ được hiển thị ở đây...</p>
      </div>
    </Card>
  );
};

export default ExerciseCard;