"use client";

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, message, Tooltip, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import WordForm from '@/components/words/WordForm';
import { fetchWords, deleteWord } from '@/services/wordApi';
import { Word } from '@/types/wordTypes';

const WordPage = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  
  // Fetch words with pagination and search
  const fetchWordData = async () => {
    setLoading(true);
    try {
      const response = await fetchWords({
        page,
        limit: pageSize,
        search: searchText,
        sortBy: 'id',
        sortOrder: 'DESC'
      });
      setWords(response.words || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to fetch words:", error);
      message.error("Failed to load words");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWordData();
  }, [page, pageSize, searchText]);

  // Handle delete word
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this word?',
      content: 'This action cannot be undone. All senses and translations will be deleted.',
      okText: 'Yes, delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteWord(id);
          message.success('Word deleted successfully');
          fetchWordData();
        } catch (error) {
          console.error("Failed to delete word:", error);
          message.error('Failed to delete word');
        }
      },
    });
  };

  // Handle successful form submission
  const handleFormSuccess = () => {
    fetchWordData();
    setCreateModalVisible(false);
    setEditModalVisible(false);
    setSelectedWord(null);
  };

  // Columns for the table
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Simplified',
      dataIndex: 'simplified',
      key: 'simplified',
      render: (text: string) => <span className="font-bold text-lg">{text}</span>,
    },
    {
      title: 'Traditional',
      dataIndex: 'traditional',
      key: 'traditional',
      render: (text: string) => <span className="text-gray-600">{text || '-'}</span>,
    },
    {
      title: 'Senses',
      key: 'senses',
      render: (_:any, record: Word) => (
        <span>{record.senses?.length || 0} sense(s)</span>
      ),
    },
    {
      title: 'HSK Level',
      key: 'hskLevel',
      render: (_:any, record: Word) => {
        const primarySense = record.senses?.find(sense => sense.isPrimary) || record.senses?.[0];
        if (!primarySense?.hskLevel) return <span>-</span>;
        return (
          <Tag color={getHskLevelColor(primarySense.hskLevel)}>
            HSK {primarySense.hskLevel}
          </Tag>
        );
      },
    },
    {
      title: 'Primary Meaning',
      key: 'meaning',
      render: (_:any, record: Word) => {
        const primarySense = record.senses?.find(sense => sense.isPrimary) || record.senses?.[0];
        const translation = primarySense?.translation?.translation || '-';
        const pinyin = primarySense?.pinyin || '';
        return (
          <div>
            <div className="text-gray-500">{pinyin}</div>
            <div>{translation}</div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_:any, record: Word) => (
        <Space size="middle">
          <Tooltip title="Edit Word">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
                setSelectedWord(record);
                setEditModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete Word">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Helper to get color for HSK level
  const getHskLevelColor = (level: number): string => {
    const colors = ['green', 'cyan', 'blue', 'purple', 'magenta', 'red'];
    return colors[Math.min(level, 6) - 1] || 'default';
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Word Management" 
        extra={[
          <Button 
            key="create" 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Add New Word
          </Button>
        ]}
      />

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="mb-4">
          <Input
            placeholder="Search words..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="w-80"
          />
        </div>

        <Table
          columns={columns}
          dataSource={words}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (page, pageSize) => {
              setPage(page);
              if (pageSize) setPageSize(pageSize);
            },
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} words`,
          }}
        />
      </div>

      {/* Create Word Modal */}
      <Modal
        title="Add New Word"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <WordForm onSuccess={handleFormSuccess} />
      </Modal>

      {/* Edit Word Modal */}
      <Modal
        title="Edit Word"
        open={editModalVisible && !!selectedWord}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedWord(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedWord && (
          <WordForm 
            wordData={selectedWord} 
            onSuccess={handleFormSuccess} 
          />
        )}
      </Modal>
    </div>
  );
};

export default WordPage;