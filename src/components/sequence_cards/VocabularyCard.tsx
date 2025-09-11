import React from 'react';
import { Card, Button } from 'antd';
import { SoundOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { VocabularyCardData } from '@/types';
interface Props {
  data: VocabularyCardData;
  onEdit: () => void;
  onDelete: () => void;
}

const VocabularyCard: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <Card
      title={<span className="text-xl font-bold">{data.simplified} ({data.traditional})</span>}
      className="mb-4 shadow-md"
      actions={[
        <Button key="sound" type="text" icon={<SoundOutlined />}>Phát âm</Button>,
        <Button key="edit" type="text" icon={<EditOutlined />} onClick={onEdit}>Sửa</Button>,
        <Button key="delete" type="text" icon={<DeleteOutlined />} danger onClick={onDelete}>Xóa</Button>,
      ]}
    >
      <p className="text-lg">{data.pinyin}</p>
      <p><strong>Nghĩa:</strong> {data.translation}</p>
      <p><strong>Loại từ:</strong> {data.part_of_speech}</p>
      <Button icon={<SoundOutlined />} className="mt-2">Phát âm</Button>
    </Card>
  );
};

export default VocabularyCard;