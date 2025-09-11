'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  message, 
  Popconfirm, 
  Tag, 
  Card, 
  Input, 
  Select, 
  Pagination, 
  Spin,
  Typography,
  Badge
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  UndoOutlined, 
  PlusOutlined, 
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { courseService } from '@/services/api';
import CourseFormModal from './CourseFormModal';
import { Course } from '@/types';

const { Text, Title } = Typography;
const { Option } = Select;
interface CourseListProps {
  filterActive?: boolean;
}

const CourseList = ({ filterActive }: CourseListProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [filterHskLevel, setFilterHskLevel] = useState<number | null>(1);
  const [searchText, setSearchText] = useState('');

  const fetchCourses = async () => {
  setLoading(true);
  try {
    if (filterHskLevel) {
      // If filtering by HSK level
      const data = await courseService.getCoursesByHskLevel(filterHskLevel);
      setCourses(data);
      setTotalItems(data.length);
    } else {
      // Get all courses (paginated)
      const data = await courseService.getCourses(currentPage, pageSize);
      
      // Check if we have data and items
      if (data && data.items) {
        setCourses(data.items);
        setTotalItems(data.total || 0);
      } else {
        console.error('Invalid data format received:', data);
        setCourses([]);
        setTotalItems(0);
      }
    }
  } catch (error) {
    message.error('Failed to fetch courses');
    console.error('Error fetching courses:', error);
    setCourses([]);
    setTotalItems(0);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchCourses();
  }, [currentPage, pageSize, filterHskLevel]);

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await courseService.deleteCourse(id);
      message.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      message.error('Failed to delete course');
      console.error(error);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await courseService.restoreCourse(id);
      message.success('Course restored successfully');
      fetchCourses();
    } catch (error) {
      message.error('Failed to restore course');
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingCourse(null);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, values);
        message.success('Course updated successfully');
      } else {
        await courseService.createCourse(values);
        message.success('Course created successfully');
      }
      setIsModalVisible(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      message.error('Failed to save course');
      console.error(error);
    }
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const handleSearch = () => {
    // In a real implementation, you would add search parameters to your API call
    // For now, we'll just refetch courses
    fetchCourses();
  };

  const handleHskFilterChange = (value: number | null) => {
    setFilterHskLevel(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Course) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '0.9em' }}>
                {record.description.length > 60 
                  ? `${record.description.substring(0, 60)}...` 
                  : record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'HSK Level',
      dataIndex: 'hskLevel',
      key: 'hskLevel',
      width: 120,
      render: (level: number) => <Tag color="blue">HSK {level}</Tag>,
    },
    {
      title: 'Order',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 100,
    },
    {
      title: 'Lessons',
      dataIndex: 'totalLessons',
      key: 'totalLessons',
      width: 100,
      render: (count: number) => count || 0,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => 
        isActive ? 
          <Badge status="success" text="Active" /> : 
          <Badge status="error" text="Inactive" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Course) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          {record.isActive ? (
            <Popconfirm
              title="Are you sure you want to deactivate this course?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
              >
                Deactivate
              </Button>
            </Popconfirm>
          ) : (
            <Button 
              type="default" 
              icon={<UndoOutlined />} 
              size="small"
              onClick={() => handleRestore(record.id)}
            >
              Restore
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Add New Course
            </Button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Input
              placeholder="Search courses"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
              onPressEnter={handleSearch}
            />
            
            <Select
  placeholder="HSK Level"
  style={{ width: 120 }}
  allowClear
  onChange={handleHskFilterChange}
  defaultValue={1}
>
  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
    <Option key={level} value={level}>HSK {level}</Option>
  ))}
</Select>
          </div>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={courses} 
          rowKey="id" 
          loading={loading}
          pagination={false}
          size="middle"
        />
        
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `Total ${total} courses`}
          />
        </div>
      </Card>
      
      <CourseFormModal
        visible={isModalVisible}
        onCancel={handleCloseModal}
        onSave={handleSave}
        initialValues={editingCourse}
      />
    </div>
  );
};

export default CourseList;