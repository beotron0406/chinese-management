import React from 'react';
import { DividerData } from '@/types';
import { Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface Props {
  data: DividerData;
  onEdit: () => void;
  onDelete: () => void;
}

const DividerCard: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <div className="flex justify-between items-center my-4 py-2 border-b-2 border-blue-500">
        <span className="text-lg font-bold text-gray-700">{data.title}</span>
        <Space>
            <Button size="small" type="text" icon={<EditOutlined />} onClick={onEdit} />
            <Button size="small" type="text" icon={<DeleteOutlined />} danger onClick={onDelete} />
        </Space>
    </div>
  );
};

export default DividerCard;