import React from 'react';
import { Card, Button } from 'antd';
import { EditOutlined, DeleteOutlined, SoundOutlined } from '@ant-design/icons';
import { SentenceCardData } from '@/types';

interface Props {
  data: SentenceCardData;
  onEdit: () => void;
  onDelete: () => void;
}

const SentenceCard: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <Card
      title="Thẻ Câu ví dụ"
      className="mb-4 shadow-md"
      actions={[
        <Button key="sound" type="text" icon={<SoundOutlined />}>Phát âm</Button>,
        <Button key="edit" type="text" icon={<EditOutlined />} onClick={onEdit}>Sửa</Button>,
        <Button key="delete" type="text" icon={<DeleteOutlined />} danger onClick={onDelete}>Xóa</Button>,
      ]}
    >
      <p className="text-2xl font-serif">{data.simplified}</p>
      <p className="text-lg">{data.pinyin}</p>
      <p><strong>Dịch nghĩa:</strong> {data.translation}</p>
    </Card>
  );
};

export default SentenceCard;