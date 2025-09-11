'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  Descriptions, 
  Button, 
  Spin, 
  message, 
  Tabs, 
  Table, 
  Tag, 
  Space, 
  Typography,
  Empty
} from 'antd';
import { 
  EditOutlined, 
  BookOutlined, 
  ClockCircleOutlined, 
  CalendarOutlined
} from '@ant-design/icons';
import { courseService } from '@/services/api';
import { lessonApi } from '@/services/lessonApi';
import { Course,  } from '@/types';
import { useRouter } from 'next/navigation';
import CourseFormModal from './CourseFormModal';
import { Lesson } from '@/types/lessonTypes';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface CourseDetailsViewProps {
  courseId: number;
}

const CourseDetailsView: React.FC<CourseDetailsViewProps> = ({ courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);
      
      // Fetch lessons for this course
      const lessonsData = await lessonApi.getAllLessonsByCourse(courseId);
      setLessons(lessonsData);
    } catch (error) {
      message.error('Failed to fetch course data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const handleEditCourse = () => {
    setIsModalVisible(true);
  };

  const handleSaveCourse = async (values: any) => {
    try {
      await courseService.updateCourse(courseId, values);
      message.success('Course updated successfully');
      setIsModalVisible(false);
      fetchCourseData();
    } catch (error) {
      message.error('Failed to update course');
      console.error(error);
    }
  };

  const handleViewLesson = (lessonId: number) => {
    router.push(`/admin/lessons/${lessonId}`);
  };

  const handleAddLesson = () => {
    router.push(`/admin/lessons/new?courseId=${courseId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return <Empty description="Course not found" />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const lessonColumns = [
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
      render: (text: string, record: any) => (
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
      title: 'Order',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => 
        isActive ? 
          <Tag color="green">Active</Tag> : 
          <Tag color="red">Inactive</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => handleViewLesson(record.id)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <Title level={2}>{course.title}</Title>
            <Text>{course.description}</Text>
          </div>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={handleEditCourse}
          >
            Edit Course
          </Button>
        </div>

        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
          <Descriptions.Item label="HSK Level">
            <Tag color="blue">HSK {course.hskLevel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {course.isActive ? 
              <Tag color="green">Active</Tag> : 
              <Tag color="red">Inactive</Tag>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Order Index">
            <Tag icon={<ClockCircleOutlined />} color="default">
              {course.orderIndex}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Lessons">
            <Tag icon={<BookOutlined />} color="default">
              {lessons.length} lessons
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Tag icon={<CalendarOutlined />} color="default">
              {formatDate(course.createdAt)}
            </Tag>
          </Descriptions.Item>
          {course.prerequisiteCourseId && (
            <Descriptions.Item label="Prerequisite">
              Course #{course.prerequisiteCourseId}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card style={{ marginTop: '16px' }}>
        <Tabs defaultActiveKey="lessons">
          <TabPane tab="Lessons" key="lessons">
            <div style={{ marginBottom: '16px' }}>
              <Button type="primary" onClick={handleAddLesson}>
                Add New Lesson
              </Button>
            </div>
            
            <Table 
              columns={lessonColumns} 
              dataSource={lessons} 
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      {course && (
        <CourseFormModal
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onSave={handleSaveCourse}
          initialValues={course}
        />
      )}
    </div>
  );
};

export default CourseDetailsView;