import React from 'react';
import { Card, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { GrammarCardData } from '@/types';

interface Props {
  data: GrammarCardData;
  onEdit: () => void;
  onDelete: () => void;
}

const GrammarCard: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <Card
      title={<span className="font-normal">Thẻ Ngữ pháp: <code className="bg-gray-200 px-2 py-1 rounded">{data.pattern}</code></span>}
      className="mb-4 shadow-md"
      actions={[
        <Button key="edit" type="text" icon={<EditOutlined />} onClick={onEdit}>Sửa</Button>,
        <Button key="delete" type="text" icon={<DeleteOutlined />} danger onClick={onDelete}>Xóa</Button>,
      ]}
    >
      <p className="text-lg">{data.pinyin}</p>
      <p><strong>Giải thích:</strong> {data.explanation}</p>
    </Card>
  );
};

export default GrammarCard;