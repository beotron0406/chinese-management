'use client';

import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Tag, Popconfirm, Input, Select, message } from 'antd';
import { EditOutlined, DeleteOutlined, UndoOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { Lesson } from '../../types/lessonTypes';
import { lessonApi } from '../../services/lessonApi';
import Link from 'next/link';
import LessonFormModal from './LessonFormModal';

const { Option } = Select;

interface LessonListProps {
  courseId?: number;
  showAll?: boolean;
}

const LessonList: React.FC<LessonListProps> = ({ courseId, showAll = false }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const fetchLessons = async () => {
  setLoading(true);
  try {
    let data;
    if (courseId) {
      // Type assertions for course-specific API calls
      data = showAll 
        ? await lessonApi.getAllLessonsByCourse(courseId) as Lesson[]
        : await lessonApi.getLessonsByCourse(courseId) as Lesson[];
      setLessons(data || []); // Add fallback empty array
      setTotal(data?.length || 0);
    } else {
      const response = await lessonApi.getAllLessons(page, pageSize);
      console.log('Lesson response:', response); // Debug the response

      // More robust response handling
      if (response) {
        if (Array.isArray(response)) {
          // Direct array response
          setLessons(response);
          setTotal(response.length);
        } else if (typeof response === 'object') {
          // Object response
          if ('data' in response && Array.isArray(response.data)) {
            // Standard format with data array
            setLessons(response.data);
            setTotal(response.total || response.data.length);
          } else {
            // Try to find any array property that might contain lessons
            const possibleLessonsArray = Object.values(response).find(
              val => Array.isArray(val) && val.length > 0 && val[0] && typeof val[0] === 'object' && 'id' in val[0]
            ) as any[];
            
            if (possibleLessonsArray && Array.isArray(possibleLessonsArray)) {
              setLessons(possibleLessonsArray as Lesson[]);
              setTotal(possibleLessonsArray.length);
            } else {
              console.error('Could not find lessons array in response:', response);
              message.error('Failed to parse lesson   ta');
              setLessons([]);
              setTotal(0);
            }
          }
        } else {
          console.error('Unexpected response format:', response);
          message.error('Failed to parse lesson data');
          setLessons([]);
          setTotal(0);
        }
      } else {
        console.error('Empty response from API');
        message.error('No data received from server');
        setLessons([]);
        setTotal(0);
      }
    }
  } catch (error) {
    message.error('Failed to fetch lessons');
    console.error(error);
    setLessons([]); // Set empty array on error
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchLessons();
  }, [courseId, showAll, page, pageSize]);

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await lessonApi.softDeleteLesson(id);
      message.success('Lesson deleted successfully');
      fetchLessons();
    } catch (error) {
      message.error('Failed to delete lesson');
      console.error(error);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await lessonApi.restoreLesson(id);
      message.success('Lesson restored successfully');
      fetchLessons();
    } catch (error) {
      message.error('Failed to restore lesson');
      console.error(error);
    }
  };

  const handleAddNew = () => {
    setEditingLesson(null);
    setModalVisible(true);
  };

  const handleModalClose = (refreshData: boolean) => {
    setModalVisible(false);
    if (refreshData) {
      fetchLessons();
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    // If we had an endpoint for searching, we would call it here
    // For now, we'll just filter the existing data
  };

  const filteredLessons = (lessons || []).filter(lesson => 
    (lesson.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
    (lesson.description?.toLowerCase() || '').includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '5%',
    },
    {
      title: 'Title',
      dataIndex: 'name', // Changed from 'title' to 'name'
      key: 'name',       // Changed key as well
      render: (text: string, record: Lesson) => (
        <Link href={`/admin/lessons/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Order',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: '10%',
    },
    {
      title: 'Status',
      key: 'isActive',
      width: '10%',
      render: (text: string, record: Lesson) => (
        <Tag color={record.isActive ? 'green' : 'red'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: '15%',
      render: (text: string, record: Lesson) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
          />
          {record.isActive ? (
            <Popconfirm
              title="Are you sure you want to delete this lesson?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          ) : (
            <Button 
              type="default" 
              icon={<UndoOutlined />} 
              size="small" 
              onClick={() => handleRestore(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="Search lessons"
            onChange={(e) => handleSearch(e.target.value)}
            value={searchText}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
          />
        </Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddNew}
        >
          Add Lesson
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={filteredLessons}
        rowKey="id"
        loading={loading}
        pagination={courseId ? false : {
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize || 10);
          },
        }}
      />
      <LessonFormModal
        visible={modalVisible}
        onClose={handleModalClose}
        lesson={editingLesson}
        courseId={courseId}
      />
    </div>
  );
};

export default LessonList;